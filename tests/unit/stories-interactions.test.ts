import { beforeEach, describe, expect, it, vi } from "vitest";
import { fullStorage, memoryStorage } from "../helpers/storage";

type Interactions = typeof import("@/lib/stories/interactions");
type Publish = typeof import("@/lib/stories/publish");
type Feed = typeof import("@/lib/stories/feed");
type Social = typeof import("@/lib/social");

let act: Interactions;
let publish: Publish;
let feed: Feed;
let social: Social;

const NOW = Date.UTC(2026, 10, 5, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;
const photo = { type: "image" as const, url: "https://picsum.photos/seed/closie/1080/1920" };

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", memoryStorage());
  social = await import("@/lib/social");
  publish = await import("@/lib/stories/publish");
  feed = await import("@/lib/stories/feed");
  act = await import("@/lib/stories/interactions");
  for (const id of ["ana", "eu", "hugo", "caio"]) {
    social.addPerson({ id, username: id, displayName: id, avatar: null, privacy: "public" });
  }
  social.follow("eu", "ana");
  social.follow("hugo", "ana");
});

function post(privacy: "public" | "followers" | "close_friends" = "followers", now = NOW) {
  const result = publish.publishStory({ ownerId: "ana", media: photo, privacy }, now);
  if (!result.ok) throw new Error(result.reason);
  return result.story;
}

describe("responder", () => {
  it("a resposta fica ligada ao story e só o dono lista; vazia ou longa é recusada", () => {
    const story = post();
    const result = act.replyToStory(story.id, "eu", "  que dia lindo  ", NOW);
    expect(result).toMatchObject({ ok: true, reply: { storyId: story.id, fromId: "eu", text: "que dia lindo" } });
    expect(act.replyToStory(story.id, "eu", "   ", NOW)).toEqual({ ok: false, reason: "invalid" });
    expect(act.replyToStory(story.id, "eu", "a".repeat(501), NOW)).toEqual({ ok: false, reason: "invalid" });
    expect(act.replyToStory(story.id, "ana", "eu mesma", NOW)).toEqual({ ok: false, reason: "own_story" });
    const replies = act.getStoryReplies(story.id, "ana");
    expect(replies.ok && replies.replies.map((reply) => reply.text)).toEqual(["que dia lindo"]);
    expect(act.getStoryReplies(story.id, "eu")).toEqual({ ok: false, reason: "forbidden" });
  });
});

describe("curtir e reagir", () => {
  it("curtir alterna, não duplica e não vale no próprio story; só o dono vê quem curtiu", () => {
    const story = post();
    expect(act.toggleStoryLike(story.id, "eu", NOW)).toEqual({ ok: true, liked: true });
    expect(act.toggleStoryLike(story.id, "hugo", NOW)).toEqual({ ok: true, liked: true });
    expect(act.toggleStoryLike(story.id, "eu", NOW)).toEqual({ ok: true, liked: false });
    expect(act.toggleStoryLike(story.id, "ana", NOW)).toEqual({ ok: false, reason: "own_story" });
    const likes = act.getStoryLikes(story.id, "ana");
    expect(likes.ok && likes.likes.map((like) => like.userId)).toEqual(["hugo"]);
    expect(act.getStoryLikes(story.id, "eu")).toEqual({ ok: false, reason: "forbidden" });
  });

  it("hasLiked diz se a pessoa curtiu", () => {
    const story = post();
    expect(act.hasLiked(story.id, "eu")).toBe(false);
    act.toggleStoryLike(story.id, "eu", NOW);
    expect(act.hasLiked(story.id, "eu")).toBe(true);
  });

  it("reação repetida não duplica; emoji fora da lista é recusado", () => {
    const story = post();
    expect(act.sendStoryReaction(story.id, "eu", "🔥", NOW)).toEqual({ ok: true, added: true });
    expect(act.sendStoryReaction(story.id, "eu", "🔥", NOW)).toEqual({ ok: true, added: false });
    expect(act.sendStoryReaction(story.id, "eu", "😂", NOW)).toEqual({ ok: true, added: true });
    expect(act.sendStoryReaction(story.id, "eu", "🍕", NOW)).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("compartilhar e denunciar", () => {
  it("compartilhar só se quem recebe também puder ver", () => {
    const followersOnly = post("followers");
    expect(act.shareStory(followersOnly.id, "eu", "caio", NOW)).toEqual({ ok: false, reason: "forbidden" });
    expect(act.shareStory(followersOnly.id, "eu", "hugo", NOW)).toEqual({ ok: true });
    expect(act.shareStory(followersOnly.id, "eu", "eu", NOW)).toEqual({ ok: false, reason: "invalid" });
    expect(act.shareStory(followersOnly.id, "eu", "ninguem", NOW)).toEqual({ ok: false, reason: "not_found" });
    const open = post("public");
    expect(act.shareStory(open.id, "eu", "caio", NOW)).toEqual({ ok: true });
  });

  it("denúncia conta uma vez e tira o story do feed de quem denunciou", () => {
    const story = post();
    expect(act.reportStory(story.id, "eu", "spam", NOW)).toEqual({ ok: true, added: true });
    expect(act.reportStory(story.id, "eu", "spam", NOW)).toEqual({ ok: true, added: false });
    expect(act.reportStory(story.id, "eu", "porque sim", NOW)).toEqual({ ok: false, reason: "invalid" });
    expect(feed.buildStoriesFeed("eu", NOW).isEmpty).toBe(true);
    expect(feed.buildStoriesFeed("hugo", NOW).unseen).toHaveLength(1);
  });
});

describe("armazenamento cheio", () => {
  it("nenhuma interação diz que deu certo se não conseguiu salvar", () => {
    const story = post("public");
    vi.stubGlobal("localStorage", fullStorage(localStorage));
    for (const result of [
      act.replyToStory(story.id, "eu", "oi", NOW),
      act.toggleStoryLike(story.id, "eu", NOW),
      act.sendStoryReaction(story.id, "eu", "❤️", NOW),
      act.shareStory(story.id, "eu", "hugo", NOW),
      act.reportStory(story.id, "eu", "spam", NOW),
    ]) {
      expect(result).toEqual({ ok: false, reason: "storage" });
    }
  });
});

describe("bloqueio, permissão e expiração", () => {
  it("quem foi bloqueado não responde, não curte, não reage, não compartilha nem denuncia", () => {
    const story = post("public");
    social.block("ana", "eu");
    for (const result of [
      act.replyToStory(story.id, "eu", "oi", NOW),
      act.toggleStoryLike(story.id, "eu", NOW),
      act.sendStoryReaction(story.id, "eu", "❤️", NOW),
      act.shareStory(story.id, "eu", "hugo", NOW),
      act.reportStory(story.id, "eu", "spam", NOW),
    ]) {
      expect(result).toEqual({ ok: false, reason: "blocked" });
    }
  });

  it("sem permissão de ver: 'forbidden'; story expirado: 'expired'", () => {
    const story = post("followers");
    expect(act.replyToStory(story.id, "caio", "oi", NOW)).toEqual({ ok: false, reason: "forbidden" });
    expect(act.toggleStoryLike(story.id, "caio", NOW)).toEqual({ ok: false, reason: "forbidden" });
    expect(act.sendStoryReaction(story.id, "caio", "❤️", NOW)).toEqual({ ok: false, reason: "forbidden" });
    expect(act.reportStory(story.id, "caio", "spam", NOW)).toEqual({ ok: false, reason: "forbidden" });
    expect(act.replyToStory(story.id, "eu", "oi", NOW + DAY)).toEqual({ ok: false, reason: "expired" });
  });
});
