import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryStorage } from "../helpers/storage";

type Social = typeof import("@/lib/social");
type Feed = typeof import("@/lib/stories/feed");
type Publish = typeof import("@/lib/stories/publish");
type Interactions = typeof import("@/lib/stories/interactions");

let social: Social;
let feed: Feed;
let publish: Publish;
let act: Interactions;

const H = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 5, 12, 0, 0);

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", memoryStorage());
  social = await import("@/lib/social");
  publish = await import("@/lib/stories/publish");
  feed = await import("@/lib/stories/feed");
  act = await import("@/lib/stories/interactions");
  for (const [id, privacy] of [
    ["eu", "private"],
    ["ana", "public"],
    ["bia", "public"],
    ["gui", "private"],
  ] as const) {
    social.addPerson({ id, username: id, displayName: id, avatar: null, privacy });
  }
});

function post(ownerId: string, hoursAgo: number, privacy: "public" | "followers" = "public") {
  const result = publish.publishStory(
    { ownerId, media: { type: "image", url: `https://picsum.photos/seed/${ownerId}${hoursAgo}/1080/1920` }, privacy },
    NOW - hoursAgo * H,
  );
  if (!result.ok) throw new Error(result.reason);
  return result.story;
}

describe("stories de uma pessoa (resultado da pesquisa)", () => {
  it("mostra só o que você pode ver dessa pessoa agora", () => {
    post("ana", 2, "public");
    post("ana", 1, "followers");
    expect(feed.buildPersonGroup("eu", "ana", NOW)?.stories).toHaveLength(1);
    social.follow("eu", "ana");
    expect(feed.buildPersonGroup("eu", "ana", NOW)?.stories).toHaveLength(2);
  });

  it("sem nada para ver (sem stories, perfil privado, expirado), devolve null", () => {
    expect(feed.buildPersonGroup("eu", "bia", NOW)).toBeNull();
    post("gui", 1);
    expect(feed.buildPersonGroup("eu", "gui", NOW)).toBeNull();
    post("bia", 30);
    expect(feed.buildPersonGroup("eu", "bia", NOW)).toBeNull();
  });

  it("deixa de fora o que você denunciou e também serve para você mesmo", () => {
    const reported = post("ana", 1);
    act.reportStory(reported.id, "eu", "spam", NOW);
    expect(feed.buildPersonGroup("eu", "ana", NOW)).toBeNull();
    post("eu", 1, "followers");
    expect(feed.buildPersonGroup("eu", "eu", NOW)?.stories).toHaveLength(1);
  });
});
