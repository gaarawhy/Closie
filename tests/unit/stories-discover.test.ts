import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryStorage } from "../helpers/storage";

type Feed = typeof import("@/lib/stories/feed");
type Publish = typeof import("@/lib/stories/publish");
type Views = typeof import("@/lib/stories/views");
type Interactions = typeof import("@/lib/stories/interactions");
type Demo = typeof import("@/lib/stories/demo");
type Social = typeof import("@/lib/social");

let feed: Feed;
let publish: Publish;
let views: Views;
let act: Interactions;
let demo: Demo;
let social: Social;

const H = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 5, 12, 0, 0);

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", memoryStorage());
  social = await import("@/lib/social");
  publish = await import("@/lib/stories/publish");
  feed = await import("@/lib/stories/feed");
  views = await import("@/lib/stories/views");
  act = await import("@/lib/stories/interactions");
  demo = await import("@/lib/stories/demo");
  for (const [id, privacy] of [
    ["eu", "private"],
    ["ana", "public"],
    ["bia", "public"],
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

function post(ownerId: string, hoursAgo: number, privacy: "public" | "followers" | "close_friends" = "public") {
  const result = publish.publishStory(
    { ownerId, media: { type: "image", url: `https://picsum.photos/seed/${ownerId}${hoursAgo}/1080/1920` }, privacy },
    NOW - hoursAgo * H,
  );
  if (!result.ok) throw new Error(result.reason);
  return result.story;
}

const owners = (groups: { owner: { id: string } }[]) => groups.map((group) => group.owner.id);

describe("descobrir", () => {
  it("mostra os dumps públicos de perfis públicos que a pessoa ainda não segue", () => {
    post("ana", 1);
    post("ana", 2);
    const groups = feed.buildDiscoverFeed("eu", NOW);
    expect(owners(groups)).toEqual(["ana"]);
    expect(groups[0].stories).toHaveLength(2);
  });

  it("deixa de fora quem já sigo, perfil privado, story só para seguidores, bloqueados, silenciados, denunciados, expirados e os meus", () => {
    social.follow("eu", "ana");
    post("ana", 1); // já sigo: aparece nos stories, não no descobrir
    post("bia", 1, "followers");
    post("caio", 1);
    social.block("caio", "eu");
    post("duda", 1);
    social.mute("eu", "duda");
    const reported = post("eva", 1);
    act.reportStory(reported.id, "eu", "spam", NOW);
    post("fe", 25);
    post("gui", 1); // perfil privado
    post("eu", 1);
    post("hugo", 2);
    expect(owners(feed.buildDiscoverFeed("eu", NOW))).toEqual(["hugo"]);
  });

  it("não vistos primeiro; depois, a atividade mais recente", () => {
    post("ana", 3);
    post("bia", 1);
    const seen = post("hugo", 0.5);
    views.markStoryViewed(seen.id, "eu", NOW);
    expect(owners(feed.buildDiscoverFeed("eu", NOW))).toEqual(["bia", "ana", "hugo"]);
  });
});

describe("perfis de exemplo", () => {
  it("cria pessoas e stories com horário relativo ao agora, sem seguir ninguém por você", () => {
    expect(demo.hasDemoNetwork()).toBe(false);
    demo.seedDemoNetwork("eu", NOW);
    expect(demo.hasDemoNetwork()).toBe(true);
    expect(social.followingIds("eu")).toEqual([]);
    const discover = feed.buildDiscoverFeed("eu", NOW);
    expect(discover.length).toBeGreaterThan(0);
    for (const group of discover) {
      for (const story of group.stories) {
        const created = Date.parse(story.createdAt);
        expect(created).toBeLessThanOrEqual(NOW);
        expect(created).toBeGreaterThan(NOW - 24 * H);
      }
    }
  });

  it("chamar de novo enquanto os stories estão no ar não duplica nada", () => {
    demo.seedDemoNetwork("eu", NOW);
    const before = feed.buildDiscoverFeed("eu", NOW).flatMap((group) => group.stories).length;
    demo.seedDemoNetwork("eu", NOW + H);
    expect(feed.buildDiscoverFeed("eu", NOW + H).flatMap((group) => group.stories).length).toBe(before);
  });

  it("renova os stories de quem ficou sem nenhum no ar", () => {
    demo.seedDemoNetwork("eu", NOW);
    const later = NOW + 30 * H;
    expect(feed.buildDiscoverFeed("eu", later)).toEqual([]);
    expect(demo.refreshDemoStories(later)).toBeGreaterThan(0);
    expect(feed.buildDiscoverFeed("eu", later).length).toBeGreaterThan(0);
  });

  it("amigos de exemplo: seguir todos de uma vez coloca os stories deles no seu feed", () => {
    demo.seedDemoNetwork("eu", NOW);
    demo.followDemoFriends("eu");
    expect(feed.buildStoriesFeed("eu", NOW).unseen.length).toBeGreaterThan(0);
  });

  it("um perfil de exemplo pede para seguir você", () => {
    demo.seedDemoNetwork("eu", NOW);
    expect(social.pendingFollowRequests("eu").length).toBe(1);
  });
});
