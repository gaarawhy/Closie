import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryStorage } from "../helpers/storage";

type Feed = typeof import("@/lib/stories/feed");
type Views = typeof import("@/lib/stories/views");
type Publish = typeof import("@/lib/stories/publish");
type Social = typeof import("@/lib/social");

let feed: Feed;
let views: Views;
let publish: Publish;
let social: Social;

const H = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 5, 12, 0, 0);
const photo = (seed: string) => ({ type: "image" as const, url: `https://picsum.photos/seed/${seed}/1080/1920` });

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", memoryStorage());
  social = await import("@/lib/social");
  publish = await import("@/lib/stories/publish");
  feed = await import("@/lib/stories/feed");
  views = await import("@/lib/stories/views");
  for (const [id, privacy] of [
    ["eu", "public"],
    ["ana", "public"],
    ["bia", "private"],
    ["caio", "public"],
    ["duda", "public"],
    ["eva", "public"],
    ["fe", "public"],
    ["gui", "private"],
    ["hugo", "public"],
  ] as const) {
    social.addPerson({ id, username: id, displayName: id, avatar: null, privacy });
  }
});

function post(ownerId: string, hoursAgo: number, privacy: "public" | "followers" | "close_friends" = "followers") {
  const result = publish.publishStory({ ownerId, media: photo(`${ownerId}-${hoursAgo}`), privacy }, NOW - hoursAgo * H);
  if (!result.ok) throw new Error(result.reason);
  return result.story;
}

const owners = (groups: { owner: { id: string } }[]) => groups.map((group) => group.owner.id);

describe("organização do feed", () => {
  it("agrupa vários stories da mesma pessoa em ordem de publicação", () => {
    social.follow("eu", "ana");
    const s1 = post("ana", 3);
    const s2 = post("ana", 1);
    const s3 = post("ana", 2);
    const { unseen } = feed.buildStoriesFeed("eu", NOW);
    expect(unseen).toHaveLength(1);
    expect(unseen[0].stories.map((story) => story.id)).toEqual([s1.id, s3.id, s2.id]);
    expect(unseen[0].latestAt).toBe(s2.createdAt);
  });

  it("só quem a pessoa segue (aprovado), sem silenciados, bloqueados, expirados ou excluídos", () => {
    social.follow("eu", "ana");
    social.follow("eu", "bia");
    social.approveFollow("bia", "eu");
    social.follow("eu", "caio");
    social.mute("eu", "caio");
    social.follow("eu", "duda");
    social.block("eu", "duda");
    social.follow("eu", "fe");
    social.follow("eu", "gui"); // pendente
    post("ana", 1);
    const gone = post("ana", 2);
    publish.deleteStory(gone.id, "ana", NOW);
    post("bia", 1);
    post("caio", 1);
    post("duda", 1, "public");
    post("eva", 1, "public"); // não sigo
    post("fe", 25); // expirado
    post("gui", 1);
    const { unseen, seen } = feed.buildStoriesFeed("eu", NOW);
    expect(owners([...unseen, ...seen]).sort()).toEqual(["ana", "bia"]);
    expect(unseen.find((group) => group.owner.id === "ana")?.stories).toHaveLength(1);
  });

  it("não vistos primeiro, vistos à parte; cada lista pela atividade mais recente", () => {
    for (const id of ["ana", "hugo", "caio"]) social.follow("eu", id);
    post("ana", 1);
    post("caio", 0.5);
    const old = post("hugo", 5);
    views.markStoryViewed(old.id, "eu", NOW);
    const { unseen, seen } = feed.buildStoriesFeed("eu", NOW);
    expect(owners(unseen)).toEqual(["caio", "ana"]);
    expect(owners(seen)).toEqual(["hugo"]);
    expect(seen[0].status).toBe("seen");
    expect(seen[0].startIndex).toBe(0);
  });

  it("parcialmente visto fica entre os não vistos e retoma no primeiro não visto", () => {
    social.follow("eu", "ana");
    const s1 = post("ana", 3);
    post("ana", 2);
    post("ana", 1);
    views.markStoryViewed(s1.id, "eu", NOW);
    const group = feed.buildStoriesFeed("eu", NOW).unseen[0];
    expect(group).toMatchObject({ status: "partial", startIndex: 1, seenIds: [s1.id] });
  });

  it("sem ninguém para ver: isEmpty, e os próprios stories vêm à parte", () => {
    const empty = feed.buildStoriesFeed("eu", NOW);
    expect(empty).toEqual({ unseen: [], seen: [], mine: null, isEmpty: true });
    const mine = post("eu", 1);
    const withMine = feed.buildStoriesFeed("eu", NOW);
    expect(withMine.isEmpty).toBe(true);
    expect(withMine.mine?.stories.map((story) => story.id)).toEqual([mine.id]);
  });
});

describe("visualizações", () => {
  it("contam uma vez por pessoa; o dono vendo o próprio não conta", () => {
    social.follow("eu", "ana");
    const story = post("ana", 1);
    expect(views.markStoryViewed(story.id, "eu", NOW)).toEqual({ ok: true, counted: true });
    expect(views.markStoryViewed(story.id, "eu", NOW + 5000)).toEqual({ ok: true, counted: false });
    expect(views.markStoryViewed(story.id, "ana", NOW)).toEqual({ ok: true, counted: false });
    const result = views.getStoryViewers(story.id, "ana");
    expect(result).toEqual({ ok: true, viewers: [{ viewerId: "eu", viewedAt: new Date(NOW).toISOString() }] });
    expect(views.hasViewed(story.id, "eu")).toBe(true);
    expect(views.hasViewed(story.id, "caio")).toBe(false);
  });

  it("sem permissão ou expirado não registra", () => {
    const hidden = post("ana", 1); // só seguidores; "caio" não segue
    expect(views.markStoryViewed(hidden.id, "caio", NOW)).toEqual({ ok: false, reason: "forbidden" });
    social.follow("eu", "ana");
    expect(views.markStoryViewed(hidden.id, "eu", NOW + 24 * H)).toEqual({ ok: false, reason: "expired" });
    expect(views.markStoryViewed("nao-existe", "eu", NOW)).toEqual({ ok: false, reason: "not_found" });
  });

  it("só o dono vê a lista de visualizadores, mais recentes primeiro", () => {
    social.follow("eu", "ana");
    social.follow("hugo", "ana");
    const story = post("ana", 1);
    views.markStoryViewed(story.id, "eu", NOW);
    views.markStoryViewed(story.id, "hugo", NOW + 1000);
    const result = views.getStoryViewers(story.id, "ana");
    expect(result.ok && result.viewers.map((item) => item.viewerId)).toEqual(["hugo", "eu"]);
    expect(views.getStoryViewers(story.id, "eu")).toEqual({ ok: false, reason: "forbidden" });
  });

  it("persistem depois de recarregar o módulo", async () => {
    social.follow("eu", "ana");
    const story = post("ana", 1);
    views.markStoryViewed(story.id, "eu", NOW);
    vi.resetModules();
    const again: Views = await import("@/lib/stories/views");
    expect(again.hasViewed(story.id, "eu")).toBe(true);
  });
});

describe("consultas do dono", () => {
  it("ativos e histórico de expirados separados; excluídos fora dos dois", () => {
    const old = post("ana", 30);
    const a1 = post("ana", 2);
    const a2 = post("ana", 1);
    const gone = post("ana", 3);
    publish.deleteStory(gone.id, "ana", NOW);
    expect(feed.getMyActiveStories("ana", NOW).map((story) => story.id)).toEqual([a1.id, a2.id]);
    expect(feed.getMyExpiredStories("ana", NOW).map((story) => story.id)).toEqual([old.id]);
  });
});
