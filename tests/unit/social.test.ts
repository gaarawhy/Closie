import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryStorage } from "../helpers/storage";

type Social = typeof import("@/lib/social");
let social: Social;

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", memoryStorage());
  social = await import("@/lib/social");
  social.addPerson({ id: "pub", username: "pub", displayName: "Público", avatar: null, privacy: "public" });
  social.addPerson({ id: "priv", username: "priv", displayName: "Privado", avatar: null, privacy: "private" });
  social.addPerson({ id: "a", username: "ana.b", displayName: "Ana", avatar: null, privacy: "public" });
  social.addPerson({ id: "b", username: "beto", displayName: "Beto", avatar: null, privacy: "public" });
});

describe("seguir", () => {
  it("perfil público aprova na hora; privado fica pendente até o dono aprovar", () => {
    expect(social.follow("a", "pub")).toBe("approved");
    expect(social.isApprovedFollower("a", "pub")).toBe(true);
    expect(social.follow("a", "priv")).toBe("pending");
    expect(social.isApprovedFollower("a", "priv")).toBe(false);
    expect(social.pendingFollowRequests("priv")).toEqual(["a"]);
    expect(social.approveFollow("priv", "a")).toBe(true);
    expect(social.isApprovedFollower("a", "priv")).toBe(true);
    expect(social.pendingFollowRequests("priv")).toEqual([]);
    expect([...social.followingIds("a")].sort()).toEqual(["priv", "pub"]);
  });

  it("recusar remove o pedido; deixar de seguir remove a aprovação", () => {
    social.follow("a", "priv");
    expect(social.rejectFollow("priv", "a")).toBe(true);
    expect(social.pendingFollowRequests("priv")).toEqual([]);
    expect(social.approveFollow("priv", "a")).toBe(false);
    social.follow("a", "pub");
    social.unfollow("a", "pub");
    expect(social.isApprovedFollower("a", "pub")).toBe(false);
  });

  it("seguir a si mesmo não vale e seguir de novo não duplica", () => {
    expect(social.follow("a", "a")).toBe("self");
    social.follow("a", "pub");
    expect(social.follow("a", "pub")).toBe("approved");
    expect(social.followingIds("a")).toEqual(["pub"]);
  });
});

describe("bloquear", () => {
  it("desfaz o seguir nos dois sentidos e impede seguir de novo", () => {
    social.follow("a", "b");
    social.follow("b", "a");
    social.block("a", "b");
    expect(social.isApprovedFollower("a", "b")).toBe(false);
    expect(social.isApprovedFollower("b", "a")).toBe(false);
    expect(social.isBlockedEitherWay("a", "b")).toBe(true);
    expect(social.isBlockedEitherWay("b", "a")).toBe(true);
    expect(social.follow("b", "a")).toBe("blocked");
    expect(social.follow("a", "b")).toBe("blocked");
    expect(social.blockedIds("a")).toEqual(["b"]);
  });

  it("desbloquear libera, sem refazer o seguir", () => {
    social.follow("a", "b");
    social.block("a", "b");
    social.unblock("a", "b");
    expect(social.isBlockedEitherWay("a", "b")).toBe(false);
    expect(social.blockedIds("a")).toEqual([]);
    expect(social.isApprovedFollower("a", "b")).toBe(false);
  });
});

describe("amigos próximos e silenciar", () => {
  it("amigos próximos são só os escolhidos pelo dono, sem repetição e sem o próprio dono", () => {
    social.setCloseFriends("a", ["b", "b", "a", "pub"]);
    expect(social.getCloseFriends("a")).toEqual(["b", "pub"]);
    expect(social.isCloseFriend("b", "a")).toBe(true);
    // Não é recíproco
    expect(social.isCloseFriend("a", "b")).toBe(false);
    social.setCloseFriends("a", []);
    expect(social.isCloseFriend("b", "a")).toBe(false);
  });

  it("silenciar não mexe no seguir", () => {
    social.follow("a", "pub");
    social.mute("a", "pub");
    expect(social.isMuted("a", "pub")).toBe(true);
    expect(social.isApprovedFollower("a", "pub")).toBe(true);
    social.unmute("a", "pub");
    expect(social.isMuted("a", "pub")).toBe(false);
  });
});

describe("listar pessoas e status de seguir", () => {
  it("listPeople junta contas locais e pessoas extras, sem repetir", async () => {
    const account = await import("@/lib/account");
    await account.signUp({ email: "zak@exemplo.com", password: "senha1234", birthdate: "2000-01-01", username: "zak" });
    const me = account.getSession()!;
    const ids = social.listPeople().map((person) => person.id);
    expect(ids).toEqual(expect.arrayContaining([me.id, "pub", "priv", "a", "b"]));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("followStatus diz se já segue, se o pedido está pendente ou nada", () => {
    social.follow("a", "pub");
    social.follow("a", "priv");
    expect(social.followStatus("a", "pub")).toBe("approved");
    expect(social.followStatus("a", "priv")).toBe("pending");
    expect(social.followStatus("a", "b")).toBeNull();
  });
});

describe("pessoas e persistência", () => {
  it("getPerson acha conta local e pessoa extra; id desconhecido → null", async () => {
    const account = await import("@/lib/account");
    await account.signUp({ email: "zak@exemplo.com", password: "senha1234", birthdate: "2000-01-01", username: "zak" });
    const me = account.getSession()!;
    expect(social.getPerson(me.id)).toMatchObject({ id: me.id, username: "zak", privacy: "private" });
    expect(social.getPerson("pub")).toMatchObject({ username: "pub", privacy: "public" });
    expect(social.getPerson("ninguem")).toBeNull();
  });

  it("persiste depois de recarregar o módulo (simula atualizar a página)", async () => {
    social.follow("a", "priv");
    social.block("a", "b");
    vi.resetModules();
    const again: Social = await import("@/lib/social");
    expect(again.pendingFollowRequests("priv")).toEqual(["a"]);
    expect(again.isBlockedEitherWay("a", "b")).toBe(true);
    expect(again.getPerson("pub")).not.toBeNull();
  });

  it("JSON corrompido no storage vira estado vazio, sem erro", async () => {
    localStorage.setItem("closie:social:v1", "{");
    vi.resetModules();
    const again: Social = await import("@/lib/social");
    expect(again.followingIds("a")).toEqual([]);
    expect(again.getPerson("pub")).toBeNull();
  });
});
