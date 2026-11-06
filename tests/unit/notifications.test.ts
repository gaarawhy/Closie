import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryStorage } from "../helpers/storage";

type Social = typeof import("@/lib/social");
type Publish = typeof import("@/lib/stories/publish");
type Interactions = typeof import("@/lib/stories/interactions");
type Notifications = typeof import("@/lib/notifications");

let social: Social;
let publish: Publish;
let act: Interactions;
let notifications: Notifications;

const NOW = Date.UTC(2026, 10, 5, 12, 0, 0);
const at = (minutes: number) => NOW + minutes * 60_000;

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", memoryStorage());
  social = await import("@/lib/social");
  publish = await import("@/lib/stories/publish");
  act = await import("@/lib/stories/interactions");
  notifications = await import("@/lib/notifications");
  for (const [id, privacy] of [
    ["eu", "private"],
    ["ana", "public"],
    ["bia", "public"],
    ["caio", "private"],
  ] as const) {
    social.addPerson({ id, username: id, displayName: id, avatar: null, privacy });
  }
});

function post(ownerId: string, when: number) {
  const result = publish.publishStory(
    { ownerId, media: { type: "image", url: "https://picsum.photos/1080/1920" }, privacy: "followers" },
    when,
  );
  if (!result.ok) throw new Error(result.reason);
  return result.story;
}

const kinds = (items: { kind: string; from: { id: string } }[]) => items.map((item) => [item.kind, item.from.id]);

describe("notificações", () => {
  it("pedido para seguir vira 'começou a seguir' quando você aceita", () => {
    social.follow("ana", "eu", at(0));
    expect(kinds(notifications.buildNotifications("eu"))).toEqual([["follow_request", "ana"]]);
    social.approveFollow("eu", "ana", at(5));
    const items = notifications.buildNotifications("eu");
    expect(kinds(items)).toEqual([["new_follower", "ana"]]);
    expect(items[0].at).toBe(new Date(at(5)).toISOString());
  });

  it("avisa quando um perfil privado aceita o seu pedido (e não quando o perfil é público)", () => {
    social.follow("eu", "caio", at(0));
    social.follow("eu", "bia", at(1));
    social.approveFollow("caio", "eu", at(10));
    expect(kinds(notifications.buildNotifications("eu"))).toEqual([["request_accepted", "caio"]]);
  });

  it("curtidas, respostas e reações nos seus stories, do mais novo para o mais antigo", () => {
    social.follow("ana", "eu", at(0));
    social.approveFollow("eu", "ana", at(1));
    const story = post("eu", at(2));
    act.toggleStoryLike(story.id, "ana", at(3));
    act.replyToStory(story.id, "ana", "que lindo!", at(4));
    act.sendStoryReaction(story.id, "ana", "😂", at(5));
    const items = notifications.buildNotifications("eu");
    expect(kinds(items)).toEqual([
      ["reaction", "ana"],
      ["reply", "ana"],
      ["like", "ana"],
      ["new_follower", "ana"],
    ]);
    const [reaction, reply, like] = items;
    expect(reaction.kind === "reaction" && reaction.emoji).toBe("😂");
    expect(reply.kind === "reply" && reply.text).toBe("que lindo!");
    expect(like.kind === "like" && like.story.id).toBe(story.id);
  });

  it("ignora story excluído e quem está bloqueado", () => {
    for (const id of ["ana", "bia"]) {
      social.follow(id, "eu", at(0));
      social.approveFollow("eu", id, at(1));
    }
    const deleted = post("eu", at(2));
    const kept = post("eu", at(3));
    act.toggleStoryLike(deleted.id, "ana", at(4));
    act.toggleStoryLike(kept.id, "bia", at(5));
    publish.deleteStory(deleted.id, "eu");
    social.block("eu", "bia");
    expect(kinds(notifications.buildNotifications("eu"))).toEqual([["new_follower", "ana"]]);
  });

  it("não lidas: só o que chegou depois da última visita, e cada pessoa tem a sua", () => {
    social.follow("ana", "eu", at(0));
    social.follow("eu", "bia", at(0));
    expect(notifications.unreadCount("eu")).toBe(1);
    expect(notifications.unreadCount("bia")).toBe(1);
    notifications.markNotificationsSeen("eu", at(1));
    expect(notifications.unreadCount("eu")).toBe(0);
    expect(notifications.unreadCount("bia")).toBe(1);
    social.follow("caio", "eu", at(2));
    expect(notifications.unreadCount("eu")).toBe(1);
  });
});
