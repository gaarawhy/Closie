import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

type AccountModule = typeof import("@/lib/account");
let account: AccountModule;

// localStorage novo a cada teste (o Node não tem um), para exercitar o caminho real de gravação
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, String(value));
    },
  };
}

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", memoryStorage());
  account = await import("@/lib/account");
});

const valid = {
  email: "Marcelo@Exemplo.com",
  password: "senha1234",
  birthdate: "2000-03-10",
  username: "marcelo.c",
};

describe("signUp", () => {
  it("cria a conta com o @ do cadastro, perfil por preencher, e já entra", async () => {
    expect(await account.signUp(valid)).toEqual({ ok: true });
    const session = account.getSession();
    expect(session?.email).toBe("marcelo@exemplo.com");
    expect(session?.profile).toEqual({
      username: "marcelo.c",
      displayName: null,
      bio: null,
      avatar: null,
      privacy: "private",
      onboardingCompletedAt: null,
    });
    expect(account.isOnboarded(session!)).toBe(false);
  });

  it("recusa e-mail que já tem conta", async () => {
    await account.signUp(valid);
    account.signOut();
    expect(await account.signUp({ ...valid, username: "outro.nome" })).toEqual({
      ok: false,
      field: "email",
      message: "Esse e-mail já tem conta. Que tal entrar?",
    });
  });

  it("recusa senha curta, menor de 13 anos e @ em uso, sem abrir sessão", async () => {
    expect(await account.signUp({ ...valid, password: "123" })).toMatchObject({ ok: false, field: "password" });
    expect(await account.signUp({ ...valid, birthdate: "2020-01-01" })).toMatchObject({ ok: false, field: "birthdate" });
    expect(await account.signUp({ ...valid, username: "lua" })).toEqual({
      ok: false,
      field: "username",
      message: "Esse @ já está em uso.",
    });
    expect(account.getSession()).toBeNull();
  });
});

describe("signIn", () => {
  beforeEach(async () => {
    await account.signUp(valid);
    account.signOut();
  });

  it("entra por e-mail e por @ (com '@' e maiúsculas)", async () => {
    expect(await account.signIn(" MARCELO@exemplo.com ", "senha1234")).toBe(true);
    account.signOut();
    expect(await account.signIn("@Marcelo.C", "senha1234")).toBe(true);
    expect(account.getSession()?.email).toBe("marcelo@exemplo.com");
  });

  it("senha errada não entra", async () => {
    expect(await account.signIn("marcelo@exemplo.com", "errada123")).toBe(false);
    expect(account.getSession()).toBeNull();
  });
});

describe("checkUsernamesAvailable", () => {
  it("devolve, na ordem, só os livres; o @ da própria sessão conta como livre", async () => {
    await account.signUp(valid);
    account.signOut();
    await account.signUp({ ...valid, email: "bia2@exemplo.com", username: "bia.rocha" });
    const result = await account.checkUsernamesAvailable([
      "marcelo.c", // de outra conta
      "admin", // reservado
      "lua", // conta fictícia
      "Nova.Pessoa", // normalizado
      ".ruim", // formato inválido
      "bia.rocha", // da própria sessão
      "livre_1",
    ]);
    expect(result).toEqual(["nova.pessoa", "bia.rocha", "livre_1"]);
  });

  it("mais de 10 nomes por consulta é erro", async () => {
    const names = Array.from({ length: 11 }, (_, i) => `nome${i}`);
    await expect(account.checkUsernamesAvailable(names)).rejects.toThrow();
  });
});

describe("completeOnboarding", () => {
  const input = {
    username: " Marcelo.C ",
    displayName: "  Marcelo   Coronet ",
    bio: "  ",
    avatar: null,
    privacy: "public" as const,
  };

  beforeEach(async () => {
    await account.signUp(valid);
  });

  it("grava normalizado e marca como concluído", async () => {
    expect(await account.completeOnboarding(input)).toEqual({ ok: true });
    const session = account.getSession()!;
    expect(session.profile).toMatchObject({
      username: "marcelo.c",
      displayName: "Marcelo Coronet",
      bio: null,
      avatar: null,
      privacy: "public",
    });
    expect(account.isOnboarded(session)).toBe(true);
  });

  it("concluir de novo mantém a data da primeira conclusão", async () => {
    await account.completeOnboarding(input);
    const first = account.getSession()!.profile.onboardingCompletedAt;
    await new Promise((resolve) => setTimeout(resolve, 5));
    await account.completeOnboarding({ ...input, displayName: "Outro" });
    expect(account.getSession()!.profile.onboardingCompletedAt).toBe(first);
    expect(account.getSession()!.profile.displayName).toBe("Outro");
  });

  it("@ tomado por outra conta volta ao passo 1", async () => {
    account.signOut();
    await account.signUp({ ...valid, email: "x@exemplo.com", username: "x.pessoa" });
    expect(await account.completeOnboarding({ ...input, username: "marcelo.c" })).toEqual({
      ok: false,
      step: 1,
      field: "username",
      message: "Esse @ já está em uso.",
    });
  });

  it("nome vazio, bio longa ou foto inválida voltam ao passo 2; privacidade inválida ao passo 3", async () => {
    expect(await account.completeOnboarding({ ...input, displayName: " " })).toMatchObject({
      ok: false,
      step: 2,
      field: "displayName",
    });
    expect(await account.completeOnboarding({ ...input, bio: "a".repeat(161) })).toMatchObject({
      ok: false,
      step: 2,
      field: "bio",
    });
    expect(await account.completeOnboarding({ ...input, avatar: "https://site.com/foto.png" })).toMatchObject({
      ok: false,
      step: 2,
      field: "avatar",
    });
    expect(
      await account.completeOnboarding({ ...input, privacy: "friends" as unknown as "public" }),
    ).toMatchObject({ ok: false, step: 3, field: "privacy" });
    expect(account.isOnboarded(account.getSession()!)).toBe(false);
  });

  it("sem sessão não grava nada", async () => {
    account.signOut();
    expect(await account.completeOnboarding(input)).toMatchObject({ ok: false, step: 1 });
    await account.signIn("marcelo@exemplo.com", "senha1234");
    expect(account.isOnboarded(account.getSession()!)).toBe(false);
  });
});

describe("sessão", () => {
  it("sair e entrar de novo traz o perfil concluído (não repete o onboarding)", async () => {
    await account.signUp(valid);
    await account.completeOnboarding({
      username: "marcelo.c",
      displayName: "Marcelo",
      bio: "oi",
      avatar: "data:image/webp;base64,AAAA",
      privacy: "private",
    });
    account.signOut();
    expect(account.getSession()).toBeNull();
    expect(await account.signIn("marcelo.c", "senha1234")).toBe(true);
    const session = account.getSession()!;
    expect(session.profile).toMatchObject({
      displayName: "Marcelo",
      bio: "oi",
      avatar: "data:image/webp;base64,AAAA",
      privacy: "private",
    });
    expect(account.isOnboarded(session)).toBe(true);
  });

  it("conta no formato antigo do mock continua entrando e cai no onboarding", async () => {
    localStorage.setItem(
      "closie:contas",
      JSON.stringify([
        { username: "antiga", email: "antiga@exemplo.com", birthdate: "2000-01-01", passwordHash: sha256("senha1234") },
      ]),
    );
    expect(await account.signIn("@antiga", "senha1234")).toBe(true);
    expect(account.getSession()?.profile).toMatchObject({ username: "antiga", onboardingCompletedAt: null });
  });

  it("sessão no formato antigo (cópia da conta) é reconhecida", () => {
    localStorage.setItem(
      "closie:contas",
      JSON.stringify([
        { username: "antiga", email: "antiga@exemplo.com", birthdate: "2000-01-01", passwordHash: sha256("x") },
      ]),
    );
    localStorage.setItem(
      "closie:sessao",
      JSON.stringify({ username: "antiga", email: "antiga@exemplo.com", birthdate: "2000-01-01" }),
    );
    expect(account.getSession()?.email).toBe("antiga@exemplo.com");
  });
});
