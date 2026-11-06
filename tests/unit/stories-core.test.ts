import { beforeEach, describe, expect, it, vi } from "vitest";
import { fullStorage, memoryStorage } from "../helpers/storage";

type Publish = typeof import("@/lib/stories/publish");
type Access = typeof import("@/lib/stories/access");
type Storage_ = typeof import("@/lib/stories/storage");
type Social = typeof import("@/lib/social");

let publish: Publish;
let access: Access;
let storage: Storage_;
let social: Social;
let store: Storage;

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 5, 12, 0, 0);
const photo = { type: "image" as const, url: "https://picsum.photos/seed/closie/1080/1920" };

beforeEach(async () => {
  vi.resetModules();
  store = memoryStorage();
  vi.stubGlobal("localStorage", store);
  social = await import("@/lib/social");
  publish = await import("@/lib/stories/publish");
  access = await import("@/lib/stories/access");
  storage = await import("@/lib/stories/storage");
  for (const [id, privacy] of [
    ["dono", "public"],
    ["privada", "private"],
    ["fa", "public"],
    ["pendente", "public"],
    ["estranho", "public"],
    ["amigo", "public"],
  ] as const) {
    social.addPerson({ id, username: id, displayName: id, avatar: null, privacy });
  }
});

function publishOk(input: Parameters<Publish["publishStory"]>[0], now = NOW) {
  const result = publish.publishStory(input, now);
  if (!result.ok) throw new Error(`publicação falhou: ${result.reason}`);
  return result.story;
}

describe("publicar", () => {
  it("guarda dono, data, mídia, privacidade e expiração em 24 h", () => {
    const story = publishOk({ ownerId: "dono", media: photo, caption: "  domingo lento  " });
    expect(story).toMatchObject({
      ownerId: "dono",
      media: photo,
      caption: "domingo lento",
      privacy: "followers",
      createdAt: new Date(NOW).toISOString(),
      deletedAt: null,
    });
    expect(Date.parse(story.expiresAt) - Date.parse(story.createdAt)).toBe(DAY);
    expect(access.getStory(story.id)).toEqual(story);
    const video = publishOk({ ownerId: "dono", media: { type: "video", url: "data:video/mp4;base64,AAAA" } });
    expect(video.media.type).toBe("video");
  });

  it("recusa mídia ausente, tipo inválido, blob:, tipo trocado, legenda longa, privacidade inválida e dono desconhecido", () => {
    const bad = [
      [{ ownerId: "dono", media: undefined as never }, "invalid_media"],
      [{ ownerId: "dono", media: { type: "gif" as never, url: "https://x.com/a.gif" } }, "invalid_media"],
      [{ ownerId: "dono", media: { type: "image", url: "blob:https://closie.co/123" } }, "invalid_media"],
      [{ ownerId: "dono", media: { type: "image", url: "data:video/mp4;base64,AAAA" } }, "invalid_media"],
      [{ ownerId: "dono", media: photo, caption: "a".repeat(201) }, "invalid_caption"],
      [{ ownerId: "dono", media: photo, privacy: "todos" as never }, "invalid_privacy"],
      [{ ownerId: "ninguem", media: photo }, "no_owner"],
    ] as const;
    for (const [input, reason] of bad) {
      expect(publish.publishStory(input as Parameters<Publish["publishStory"]>[0], NOW)).toMatchObject({ ok: false, reason });
    }
    expect(storage.loadStories().stories).toHaveLength(0);
  });

  it("com o localStorage cheio, falha com 'storage' e nada fica salvo", () => {
    publishOk({ ownerId: "dono", media: photo });
    vi.stubGlobal("localStorage", fullStorage(store));
    expect(publish.publishStory({ ownerId: "dono", media: photo }, NOW)).toMatchObject({ ok: false, reason: "storage" });
    expect(storage.loadStories().stories).toHaveLength(1);
  });
});

describe("expiração", () => {
  it("vence exatamente em 24 h para os outros; o dono continua vendo", () => {
    const story = publishOk({ ownerId: "dono", media: photo, privacy: "public" });
    expect(access.canViewStory("estranho", story, NOW + DAY - 60_000)).toBe(true);
    expect(access.isExpired(story, NOW + DAY - 1)).toBe(false);
    expect(access.isExpired(story, NOW + DAY)).toBe(true);
    expect(access.unavailableReason("estranho", story, NOW + DAY)).toBe("expired");
    expect(access.canViewStory("dono", story, NOW + DAY + 1000)).toBe(true);
  });
});

describe("privacidade e bloqueios", () => {
  it("público com perfil público: todo mundo; com perfil privado: só seguidores aprovados", () => {
    const open = publishOk({ ownerId: "dono", media: photo, privacy: "public" });
    expect(access.canViewStory("estranho", open, NOW)).toBe(true);

    social.follow("fa", "privada");
    social.approveFollow("privada", "fa");
    social.follow("pendente", "privada");
    const closed = publishOk({ ownerId: "privada", media: photo, privacy: "public" });
    expect(access.unavailableReason("estranho", closed, NOW)).toBe("forbidden");
    expect(access.unavailableReason("pendente", closed, NOW)).toBe("forbidden");
    expect(access.canViewStory("fa", closed, NOW)).toBe(true);
  });

  it("seguidores: só aprovados; amigos próximos: só quem está na lista", () => {
    social.follow("fa", "dono");
    social.setCloseFriends("dono", ["amigo"]);
    const followers = publishOk({ ownerId: "dono", media: photo, privacy: "followers" });
    expect(access.canViewStory("fa", followers, NOW)).toBe(true);
    expect(access.unavailableReason("estranho", followers, NOW)).toBe("forbidden");
    const close = publishOk({ ownerId: "dono", media: photo, privacy: "close_friends" });
    expect(access.canViewStory("amigo", close, NOW)).toBe(true);
    expect(access.unavailableReason("fa", close, NOW)).toBe("forbidden");
  });

  it("bloqueio em qualquer sentido impede ver", () => {
    social.follow("fa", "dono");
    const story = publishOk({ ownerId: "dono", media: photo, privacy: "public" });
    social.block("dono", "fa");
    expect(access.unavailableReason("fa", story, NOW)).toBe("blocked");
    social.block("estranho", "dono");
    expect(access.unavailableReason("estranho", story, NOW)).toBe("blocked");
  });
});

describe("gestão pelo dono", () => {
  it("só o dono exclui; excluído some para todos (inclusive para o dono)", () => {
    const story = publishOk({ ownerId: "dono", media: photo, privacy: "public" });
    expect(publish.deleteStory(story.id, "fa", NOW)).toEqual({ ok: false, reason: "forbidden" });
    expect(publish.deleteStory(story.id, "dono", NOW + 1000)).toEqual({ ok: true });
    expect(access.getStory(story.id)?.deletedAt).toBe(new Date(NOW + 1000).toISOString());
    const deleted = access.getStory(story.id)!;
    expect(access.unavailableReason("estranho", deleted, NOW)).toBe("deleted");
    expect(access.unavailableReason("dono", deleted, NOW)).toBe("deleted");
    expect(publish.deleteStory(story.id, "dono", NOW)).toEqual({ ok: false, reason: "not_found" });
  });

  it("muda a privacidade só do próprio story e só enquanto está ativo", () => {
    const story = publishOk({ ownerId: "dono", media: photo });
    expect(publish.updateStoryPrivacy(story.id, "fa", "public", NOW)).toEqual({ ok: false, reason: "forbidden" });
    expect(publish.updateStoryPrivacy(story.id, "dono", "todos" as never, NOW)).toEqual({ ok: false, reason: "invalid_privacy" });
    expect(publish.updateStoryPrivacy(story.id, "dono", "close_friends", NOW)).toEqual({ ok: true });
    expect(access.getStory(story.id)?.privacy).toBe("close_friends");
    expect(publish.updateStoryPrivacy(story.id, "dono", "public", NOW + DAY)).toEqual({ ok: false, reason: "expired" });
  });
});

describe("persistência", () => {
  it("continua lá depois de recarregar o módulo (simula atualizar a página)", async () => {
    const story = publishOk({ ownerId: "dono", media: photo });
    vi.resetModules();
    const again: Access = await import("@/lib/stories/access");
    expect(again.getStory(story.id)).toEqual(story);
  });

  it("JSON corrompido vira estado vazio, sem erro", async () => {
    localStorage.setItem("closie:stories:v1", "{");
    vi.resetModules();
    const again: Storage_ = await import("@/lib/stories/storage");
    expect(again.loadStories().stories).toEqual([]);
  });
});
