import { getPerson, isApprovedFollower, isBlockedEitherWay, isCloseFriend } from "@/lib/social";
import { loadStories } from "./storage";
import type { Story, Unavailable } from "./types";

// Regras de quem pode ver o quê. Sempre com o horário passado por quem chama: a expiração
// é decidida na hora da consulta, nunca por um timer.

export function getStory(id: string): Story | null {
  return loadStories().stories.find((story) => story.id === id) ?? null;
}

export function isExpired(story: Story, now: number): boolean {
  return now >= Date.parse(story.expiresAt);
}

// null = pode ver. A ordem importa: excluído vale para todos; o dono vê os próprios mesmo
// expirados (histórico); para os outros, expiração, bloqueio e depois a privacidade.
export function unavailableReason(viewerId: string, story: Story, now: number): Unavailable | null {
  if (story.deletedAt) return "deleted";
  if (viewerId === story.ownerId) return null;
  if (isExpired(story, now)) return "expired";
  if (isBlockedEitherWay(viewerId, story.ownerId)) return "blocked";
  const owner = getPerson(story.ownerId);
  if (!owner) return "forbidden";
  switch (story.privacy) {
    case "close_friends":
      return isCloseFriend(viewerId, story.ownerId) ? null : "forbidden";
    case "followers":
      return isApprovedFollower(viewerId, story.ownerId) ? null : "forbidden";
    case "public":
      // Perfil privado prevalece: story público de perfil privado é só para seguidores aprovados
      return owner.privacy === "public" || isApprovedFollower(viewerId, story.ownerId) ? null : "forbidden";
    default:
      return "forbidden";
  }
}

export function canViewStory(viewerId: string, story: Story, now: number): boolean {
  return unavailableReason(viewerId, story, now) === null;
}
