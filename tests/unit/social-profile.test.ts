import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryStorage } from "../helpers/storage";

type Social = typeof import("@/lib/social");
let social: Social;

const NOW = Date.UTC(2026, 10, 5, 12, 0, 0);

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", memoryStorage());
  social = await import("@/lib/social");
  for (const [id, privacy] of [
    ["eu", "private"],
    ["ana", "public"],
    ["bia", "public"],
    ["gui", "private"],
  ] as const) {
    social.addPerson({ id, username: id, displayName: id, avatar: null, privacy, bio: `bio de ${id}` });
  }
});

describe("relação com o dono do perfil", () => {
  it("você, seguindo, pedido enviado, nada", () => {
    expect(social.relationship("eu", "eu")).toBe("self");
    social.follow("eu", "ana");
    expect(social.relationship("eu", "ana")).toBe("following");
    social.follow("eu", "gui");
    expect(social.relationship("eu", "gui")).toBe("requested");
    expect(social.relationship("eu", "bia")).toBe("none");
  });

  it("separa quem você bloqueou de quem bloqueou você", () => {
    social.block("eu", "ana");
    social.block("bia", "eu");
    expect(social.relationship("eu", "ana")).toBe("blocked");
    expect(social.relationship("eu", "bia")).toBe("blocked_by");
  });
});

describe("perfil", () => {
  it("guarda a bio da pessoa", () => {
    expect(social.getPerson("ana")?.bio).toBe("bio de ana");
  });

  it("ao virar público, aceita todos os pedidos pendentes", () => {
    social.follow("ana", "eu", NOW);
    social.follow("bia", "eu", NOW);
    expect(social.approveAllPending("eu", NOW + 1000)).toBe(2);
    expect(social.pendingFollowRequests("eu")).toEqual([]);
    expect(social.followerIds("eu").sort()).toEqual(["ana", "bia"]);
    expect(social.approveAllPending("eu", NOW)).toBe(0);
  });

  it("denunciar alguém: uma vez por pessoa, com motivo válido, nunca a si mesmo", () => {
    expect(social.reportUser("eu", "ana", "spam", NOW)).toBe(true);
    expect(social.reportUser("eu", "ana", "spam", NOW)).toBe(false);
    expect(social.reportUser("eu", "bia", "qualquer", NOW)).toBe(false);
    expect(social.reportUser("eu", "eu", "spam", NOW)).toBe(false);
    expect(social.hasReported("eu", "ana")).toBe(true);
  });
});
