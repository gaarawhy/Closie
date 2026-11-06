import { getPerson, isBlockedEitherWay } from "@/lib/social";
import { getStory, unavailableReason } from "./access";
import { REPLY_MAX, REPORT_REASONS, STORY_REACTIONS } from "./constants";
import { loadStories, updateStories } from "./storage";
import type { Story, StoryLike, StoryReaction, StoryReply, Unavailable } from "./types";

// Interações com um story. Todas exigem poder ver o story naquele momento (o que já inclui
// bloqueio, expiração, exclusão e privacidade). As do dono com o próprio story ficam de fora.

// "storage": o navegador não conseguiu salvar (armazenamento cheio) — nada foi registrado
export type InteractionFailure = { ok: false; reason: Unavailable | "not_found" | "invalid" | "own_story" | "storage" };

const NOT_SAVED: InteractionFailure = { ok: false, reason: "storage" };

function reachable(storyId: string, userId: string, now: number): Story | InteractionFailure {
  const story = getStory(storyId);
  if (!story) return { ok: false, reason: "not_found" };
  const reason = unavailableReason(userId, story, now);
  if (reason) return { ok: false, reason };
  return story;
}

const isFailure = (value: Story | InteractionFailure): value is InteractionFailure => "ok" in value;

function ownerOnly(storyId: string, requesterId: string): Story | { ok: false; reason: "not_found" | "forbidden" } {
  const story = getStory(storyId);
  if (!story || story.deletedAt) return { ok: false, reason: "not_found" };
  if (story.ownerId !== requesterId) return { ok: false, reason: "forbidden" };
  return story;
}

// Resposta ligada ao story original (o dono lê em getStoryReplies).
export function replyToStory(
  storyId: string,
  fromId: string,
  text: string,
  now = Date.now(),
): { ok: true; reply: StoryReply } | InteractionFailure {
  const story = reachable(storyId, fromId, now);
  if (isFailure(story)) return story;
  if (story.ownerId === fromId) return { ok: false, reason: "own_story" };
  const clean = text.trim();
  if (clean.length === 0 || clean.length > REPLY_MAX) return { ok: false, reason: "invalid" };
  const reply: StoryReply = {
    id: crypto.randomUUID(),
    storyId,
    fromId,
    text: clean,
    createdAt: new Date(now).toISOString(),
  };
  if (!updateStories((state) => ({ ...state, replies: [...state.replies, reply] }))) return NOT_SAVED;
  return { ok: true, reply };
}

export function getStoryReplies(
  storyId: string,
  requesterId: string,
): { ok: true; replies: StoryReply[] } | { ok: false; reason: "not_found" | "forbidden" } {
  const story = ownerOnly(storyId, requesterId);
  if ("ok" in story) return story;
  const replies = loadStories()
    .replies.filter((reply) => reply.storyId === storyId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return { ok: true, replies };
}

export function hasLiked(storyId: string, userId: string): boolean {
  return loadStories().likes.some((like) => like.storyId === storyId && like.userId === userId);
}

// Curtir alterna: curte se ainda não curtiu, descurte se já curtiu.
export function toggleStoryLike(
  storyId: string,
  userId: string,
  now = Date.now(),
): { ok: true; liked: boolean } | InteractionFailure {
  const story = reachable(storyId, userId, now);
  if (isFailure(story)) return story;
  if (story.ownerId === userId) return { ok: false, reason: "own_story" };
  const liked = loadStories().likes.some((like) => like.storyId === storyId && like.userId === userId);
  const saved = updateStories((state) => ({
    ...state,
    likes: liked
      ? state.likes.filter((like) => !(like.storyId === storyId && like.userId === userId))
      : [...state.likes, { storyId, userId, createdAt: new Date(now).toISOString() }],
  }));
  if (!saved) return NOT_SAVED;
  return { ok: true, liked: !liked };
}

export function getStoryLikes(
  storyId: string,
  requesterId: string,
): { ok: true; likes: { userId: string; createdAt: string }[] } | { ok: false; reason: "not_found" | "forbidden" } {
  const story = ownerOnly(storyId, requesterId);
  if ("ok" in story) return story;
  const likes = loadStories()
    .likes.filter((like) => like.storyId === storyId)
    .map(({ userId, createdAt }) => ({ userId, createdAt }));
  return { ok: true, likes };
}

// Reação rápida (emoji da lista). Mandar a mesma de novo não duplica.
export function sendStoryReaction(
  storyId: string,
  userId: string,
  emoji: string,
  now = Date.now(),
): { ok: true; added: boolean } | InteractionFailure {
  const story = reachable(storyId, userId, now);
  if (isFailure(story)) return story;
  if (story.ownerId === userId) return { ok: false, reason: "own_story" };
  if (!(STORY_REACTIONS as readonly string[]).includes(emoji)) return { ok: false, reason: "invalid" };
  const exists = loadStories().reactions.some(
    (reaction) => reaction.storyId === storyId && reaction.userId === userId && reaction.emoji === emoji,
  );
  if (exists) return { ok: true, added: false };
  const saved = updateStories((state) => ({
    ...state,
    reactions: [...state.reactions, { storyId, userId, emoji, createdAt: new Date(now).toISOString() }],
  }));
  return saved ? { ok: true, added: true } : NOT_SAVED;
}

// Para as notificações: o que outras pessoas fizeram nos stories do dono (excluídos ficam de fora;
// expirados continuam, porque a curtida/resposta aconteceu).
export function activityOnStories(ownerId: string): {
  stories: Story[];
  likes: StoryLike[];
  replies: StoryReply[];
  reactions: StoryReaction[];
} {
  const state = loadStories();
  const stories = state.stories.filter((story) => story.ownerId === ownerId && !story.deletedAt);
  const ids = new Set(stories.map((story) => story.id));
  return {
    stories,
    likes: state.likes.filter((like) => ids.has(like.storyId) && like.userId !== ownerId),
    replies: state.replies.filter((reply) => ids.has(reply.storyId) && reply.fromId !== ownerId),
    reactions: state.reactions.filter((reaction) => ids.has(reaction.storyId) && reaction.userId !== ownerId),
  };
}

// Compartilhar só funciona se quem recebe também puder ver o story (privacidade e bloqueios).
export function shareStory(
  storyId: string,
  fromId: string,
  toId: string,
  now = Date.now(),
): { ok: true } | InteractionFailure {
  const story = reachable(storyId, fromId, now);
  if (isFailure(story)) return story;
  if (toId === fromId) return { ok: false, reason: "invalid" };
  if (!getPerson(toId)) return { ok: false, reason: "not_found" };
  if (isBlockedEitherWay(fromId, toId)) return { ok: false, reason: "blocked" };
  if (unavailableReason(toId, story, now)) return { ok: false, reason: "forbidden" };
  const saved = updateStories((state) => ({
    ...state,
    shares: [...state.shares, { id: crypto.randomUUID(), storyId, fromId, toId, createdAt: new Date(now).toISOString() }],
  }));
  return saved ? { ok: true } : NOT_SAVED;
}

// Denúncia: uma por pessoa por story; o story some do feed de quem denunciou (feed.ts filtra).
export function reportStory(
  storyId: string,
  reporterId: string,
  reason: string,
  now = Date.now(),
): { ok: true; added: boolean } | InteractionFailure {
  const story = reachable(storyId, reporterId, now);
  if (isFailure(story)) return story;
  if (story.ownerId === reporterId) return { ok: false, reason: "own_story" };
  if (!(REPORT_REASONS as readonly string[]).includes(reason)) return { ok: false, reason: "invalid" };
  const exists = loadStories().reports.some((report) => report.storyId === storyId && report.reporterId === reporterId);
  if (exists) return { ok: true, added: false };
  const saved = updateStories((state) => ({
    ...state,
    reports: [...state.reports, { storyId, reporterId, reason, createdAt: new Date(now).toISOString() }],
  }));
  return saved ? { ok: true, added: true } : NOT_SAVED;
}
