import { followsInvolving, getPerson, isBlockedEitherWay, type Person } from "@/lib/social";
import { activityOnStories } from "@/lib/stories/interactions";
import { getLastSeen } from "./seen";
import type { NotificationItem } from "./types";

// Tudo o que aconteceu com a pessoa, do mais novo para o mais antigo: pedidos para seguir,
// novos seguidores, pedidos aceitos e curtidas/respostas/reações nos stories dela.
// Quem está bloqueado (nos dois sentidos) não aparece.
export function buildNotifications(userId: string): NotificationItem[] {
  const people = new Map<string, Person | null>();
  const person = (id: string): Person | null => {
    if (!people.has(id)) people.set(id, isBlockedEitherWay(userId, id) ? null : getPerson(id));
    return people.get(id) ?? null;
  };

  const items: NotificationItem[] = [];
  for (const item of followsInvolving(userId)) {
    if (item.followingId === userId) {
      const from = person(item.followerId);
      if (!from) continue;
      items.push(
        item.status === "pending"
          ? { kind: "follow_request", id: `pedido:${from.id}`, from, at: item.createdAt }
          : { kind: "new_follower", id: `seguidor:${from.id}`, from, at: item.approvedAt ?? item.createdAt },
      );
    } else if (item.status === "approved" && item.approvedAt) {
      // Seu pedido para um perfil privado foi aceito
      const from = person(item.followingId);
      if (from) items.push({ kind: "request_accepted", id: `aceito:${from.id}`, from, at: item.approvedAt });
    }
  }

  const activity = activityOnStories(userId);
  const stories = new Map(activity.stories.map((story) => [story.id, story]));
  for (const like of activity.likes) {
    const from = person(like.userId);
    const story = stories.get(like.storyId);
    if (from && story) items.push({ kind: "like", id: `curtida:${story.id}:${from.id}`, from, story, at: like.createdAt });
  }
  for (const reply of activity.replies) {
    const from = person(reply.fromId);
    const story = stories.get(reply.storyId);
    if (from && story) items.push({ kind: "reply", id: `resposta:${reply.id}`, from, story, text: reply.text, at: reply.createdAt });
  }
  for (const reaction of activity.reactions) {
    const from = person(reaction.userId);
    const story = stories.get(reaction.storyId);
    if (from && story) {
      items.push({
        kind: "reaction",
        id: `reacao:${story.id}:${from.id}:${reaction.emoji}`,
        from,
        story,
        emoji: reaction.emoji,
        at: reaction.createdAt,
      });
    }
  }
  return items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

// Quantas chegaram depois da última vez que a pessoa abriu as notificações.
export function countUnread(items: NotificationItem[], lastSeen: string | null): number {
  return items.filter((item) => !lastSeen || item.at > lastSeen).length;
}

export function unreadCount(userId: string): number {
  return countUnread(buildNotifications(userId), getLastSeen(userId));
}
