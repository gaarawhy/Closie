import { followStatus, followerIds, followingIds, getPerson, isBlockedEitherWay, listPeople, type Person } from "@/lib/social";
import { canViewStory } from "./access";
import { loadStories } from "./storage";

// Sugestões de quem seguir (fim do Início). Nunca: você, quem você já segue ou já pediu para
// seguir, nem bloqueados nos dois sentidos.

export type SuggestionReason = "follows_you" | "followed_by" | "posted_today" | "new";

export type Suggestion = {
  person: Person;
  reason: SuggestionReason;
  // Em "followed_by": alguém que você segue e que segue essa pessoa
  via: Person | null;
};

const ORDER: Record<SuggestionReason, number> = { follows_you: 0, followed_by: 1, posted_today: 2, new: 3 };

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

// Primeiro quem já segue você, depois quem seus amigos seguem, depois quem tem story que você
// pode ver hoje; o resto por @.
export function suggestPeople(viewerId: string, now = Date.now(), limit = 6): Suggestion[] {
  const following = followingIds(viewerId);
  const followers = new Set(followerIds(viewerId));
  const viaFriend = new Map<string, string>();
  for (const friendId of following) {
    for (const id of followingIds(friendId)) if (!viaFriend.has(id)) viaFriend.set(id, friendId);
  }
  const stories = loadStories().stories;
  const list: Suggestion[] = [];
  for (const person of listPeople()) {
    if (person.id === viewerId || followStatus(viewerId, person.id) !== null || isBlockedEitherWay(viewerId, person.id)) continue;
    const viaId = viaFriend.get(person.id);
    const reason: SuggestionReason = followers.has(person.id)
      ? "follows_you"
      : viaId
        ? "followed_by"
        : stories.some((story) => story.ownerId === person.id && canViewStory(viewerId, story, now))
          ? "posted_today"
          : "new";
    list.push({ person, reason, via: reason === "followed_by" && viaId ? getPerson(viaId) : null });
  }
  return list.sort((a, b) => ORDER[a.reason] - ORDER[b.reason] || compare(a.person.username, b.person.username)).slice(0, limit);
}
