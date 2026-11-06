import { getStory, unavailableReason } from "./access";
import { loadStories, updateStories } from "./storage";
import type { Unavailable } from "./types";

// Visualizações: uma por pessoa por story (guarda a primeira vez). O dono vendo o próprio
// story não conta. Só o dono consulta quem viu.

export function hasViewed(storyId: string, viewerId: string): boolean {
  return loadStories().views.some((item) => item.storyId === storyId && item.viewerId === viewerId);
}

export function markStoryViewed(
  storyId: string,
  viewerId: string,
  now = Date.now(),
): { ok: true; counted: boolean } | { ok: false; reason: Unavailable | "not_found" } {
  const story = getStory(storyId);
  if (!story) return { ok: false, reason: "not_found" };
  const reason = unavailableReason(viewerId, story, now);
  if (reason) return { ok: false, reason };
  if (viewerId === story.ownerId || hasViewed(storyId, viewerId)) return { ok: true, counted: false };
  const counted = updateStories((state) => ({
    ...state,
    views: [...state.views, { storyId, viewerId, viewedAt: new Date(now).toISOString() }],
  }));
  return { ok: true, counted };
}

export function getStoryViewers(
  storyId: string,
  requesterId: string,
): { ok: true; viewers: { viewerId: string; viewedAt: string }[] } | { ok: false; reason: "not_found" | "forbidden" } {
  const story = getStory(storyId);
  if (!story || story.deletedAt) return { ok: false, reason: "not_found" };
  if (story.ownerId !== requesterId) return { ok: false, reason: "forbidden" };
  const viewers = loadStories()
    .views.filter((item) => item.storyId === storyId)
    .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt))
    .map(({ viewerId, viewedAt }) => ({ viewerId, viewedAt }));
  return { ok: true, viewers };
}
