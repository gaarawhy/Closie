import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryStorage } from "../helpers/storage";

type AccountModule = typeof import("@/lib/account");
let account: AccountModule;

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", memoryStorage());
  account = await import("@/lib/account");
});

async function onboarded(email: string, username: string) {
  await account.signUp({ email, password: "senha1234", birthdate: "2000-03-10", username });
  const done = await account.completeOnboarding({ username, displayName: "Zak Silva", bio: "", avatar: null, privacy: "private" });
  if (!done.ok) throw new Error(done.message);
}

describe("editar perfil", () => {
  it("salva nome, @, bio e privacidade, e mantém a data do onboarding", async () => {
    await onboarded("zak@exemplo.com", "zak");
    const before = account.getSession()!.profile.onboardingCompletedAt;
    const result = await account.updateProfile({
      username: "Zak.Silva",
      displayName: "  Zak   S.  ",
      bio: "  café e skate  ",
      avatar: null,
      privacy: "public",
    });
    expect(result).toEqual({ ok: true });
    expect(account.getSession()!.profile).toEqual({
      username: "zak.silva",
      displayName: "Zak S.",
      bio: "café e skate",
      avatar: null,
      privacy: "public",
      onboardingCompletedAt: before,
    });
  });

  it("aponta o campo com problema", async () => {
    await onboarded("ana@exemplo.com", "ana.paula");
    account.signOut();
    await onboarded("zak@exemplo.com", "zak");
    const base = { username: "zak", displayName: "Zak", bio: "", avatar: null, privacy: "private" as const };
    expect(await account.updateProfile({ ...base, username: "ana.paula" })).toMatchObject({ ok: false, field: "username" });
    expect(await account.updateProfile({ ...base, displayName: "" })).toMatchObject({ ok: false, field: "displayName" });
    expect(await account.updateProfile({ ...base, bio: "a".repeat(161) })).toMatchObject({ ok: false, field: "bio" });
  });

  it("a bio do perfil chega às outras telas (perfil, pesquisa)", async () => {
    await onboarded("zak@exemplo.com", "zak");
    await account.updateProfile({ username: "zak", displayName: "Zak", bio: "café e skate", avatar: null, privacy: "private" });
    const social = await import("@/lib/social");
    expect(social.getPerson(account.getSession()!.id)?.bio).toBe("café e skate");
  });

  it("sem sessão não salva nada", async () => {
    expect(
      await account.updateProfile({ username: "zak", displayName: "Zak", bio: "", avatar: null, privacy: "private" }),
    ).toMatchObject({ ok: false });
  });
});
