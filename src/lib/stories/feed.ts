import { followingIds, getPerson, isBlockedEitherWay, isMuted, type Person } from "@/lib/social";
import { canViewStory, isExpired } from "./access";
import { loadStories } from "./storage";
import type { StoriesState, Story } from "./types";

// Monta o que cada pessoa vê, sempre com o horário da consulta (expirados já ficam de fora aqui).

export type FeedGroupStatus = "unseen" | "partial" | "seen";

export type FeedGroup = {
  owner: Person;
  // Em ordem de publicação (é a ordem em que vão tocar)
  stories: Story[];
  seenIds: string[];
  status: FeedGroupStatus;
  // Onde o leitor começa: o primeiro não visto (ou o primeiro, se já viu tudo)
  startIndex: number;
  // Atividade mais recente (o story mais novo do grupo)
  latestAt: string;
};

export type StoriesFeed = {
  // Não vistos e parcialmente vistos, do mais recente para o mais antigo
  unseen: FeedGroup[];
  // Vistos por completo, do mais recente para o mais antigo
  seen: FeedGroup[];
  // Os próprios stories ativos (fora das duas listas)
  mine: FeedGroup | null;
  // Nenhum story de quem a pessoa segue
  isEmpty: boolean;
};

const byCreatedAt = (a: Story, b: Story) => a.createdAt.localeCompare(b.createdAt);
const byLatestDesc = (a: FeedGroup, b: FeedGroup) => b.latestAt.localeCompare(a.latestAt);

function makeGroup(owner: Person, stories: Story[], viewerId: string, state: StoriesState): FeedGroup {
  const seenIds = stories
    .filter((story) => state.views.some((view) => view.storyId === story.id && view.viewerId === viewerId))
    .map((story) => story.id);
  const firstUnseen = stories.findIndex((story) => !seenIds.includes(story.id));
  const status: FeedGroupStatus =
    seenIds.length === 0 ? "unseen" : seenIds.length === stories.length ? "seen" : "partial";
  return {
    owner,
    stories,
    seenIds,
    status,
    startIndex: firstUnseen === -1 ? 0 : firstUnseen,
    latestAt: stories[stories.length - 1].createdAt,
  };
}

export function buildStoriesFeed(viewerId: string, now = Date.now()): StoriesFeed {
  const state = loadStories();
  const reported = new Set(
    state.reports.filter((report) => report.reporterId === viewerId).map((report) => report.storyId),
  );
  const groups: FeedGroup[] = [];
  for (const ownerId of new Set(followingIds(viewerId))) {
    if (ownerId === viewerId || isMuted(viewerId, ownerId) || isBlockedEitherWay(viewerId, ownerId)) continue;
    const owner = getPerson(ownerId);
    if (!owner) continue;
    const stories = state.stories
      .filter((story) => story.ownerId === ownerId && !reported.has(story.id) && canViewStory(viewerId, story, now))
      .sort(byCreatedAt);
    if (stories.length > 0) groups.push(makeGroup(owner, stories, viewerId, state));
  }

  const me = getPerson(viewerId);
  const myStories = getMyActiveStories(viewerId, now);
  const mine = me && myStories.length > 0 ? { ...makeGroup(me, myStories, viewerId, state), status: "seen" as const, startIndex: 0 } : null;

  const unseen = groups.filter((group) => group.status !== "seen").sort(byLatestDesc);
  const seen = groups.filter((group) => group.status === "seen").sort(byLatestDesc);
  return { unseen, seen, mine, isEmpty: unseen.length === 0 && seen.length === 0 };
}

// Descobrir: dumps do dia (stories públicos) de perfis públicos que a pessoa ainda não segue.
// Sem bloqueados, silenciados, denunciados por ela, expirados ou os próprios.
// Não vistos primeiro; dentro de cada parte, a atividade mais recente.
export function buildDiscoverFeed(viewerId: string, now = Date.now()): FeedGroup[] {
  const state = loadStories();
  const following = new Set(followingIds(viewerId));
  const reported = new Set(
    state.reports.filter((report) => report.reporterId === viewerId).map((report) => report.storyId),
  );
  const byOwner = new Map<string, Story[]>();
  for (const story of state.stories) {
    if (story.ownerId === viewerId || following.has(story.ownerId) || story.privacy !== "public") continue;
    if (reported.has(story.id) || isMuted(viewerId, story.ownerId)) continue;
    if (!canViewStory(viewerId, story, now)) continue;
    byOwner.set(story.ownerId, [...(byOwner.get(story.ownerId) ?? []), story]);
  }
  const groups: FeedGroup[] = [];
  for (const [ownerId, stories] of byOwner) {
    const owner = getPerson(ownerId);
    if (owner) groups.push(makeGroup(owner, stories.sort(byCreatedAt), viewerId, state));
  }
  return [
    ...groups.filter((group) => group.status !== "seen").sort(byLatestDesc),
    ...groups.filter((group) => group.status === "seen").sort(byLatestDesc),
  ];
}

// Os stories de uma pessoa que você pode ver agora (resultado da pesquisa). Nada para ver: null.
export function buildPersonGroup(viewerId: string, personId: string, now = Date.now()): FeedGroup | null {
  const owner = getPerson(personId);
  if (!owner) return null;
  const state = loadStories();
  const reported = new Set(
    state.reports.filter((report) => report.reporterId === viewerId).map((report) => report.storyId),
  );
  const stories = state.stories
    .filter((story) => story.ownerId === personId && !reported.has(story.id) && canViewStory(viewerId, story, now))
    .sort(byCreatedAt);
  return stories.length > 0 ? makeGroup(owner, stories, viewerId, state) : null;
}

// Stories do dono ainda no ar, em ordem de publicação.
export function getMyActiveStories(ownerId: string, now = Date.now()): Story[] {
  return loadStories()
    .stories.filter((story) => story.ownerId === ownerId && !story.deletedAt && !isExpired(story, now))
    .sort(byCreatedAt);
}

// Histórico local dos que já expiraram (sem os excluídos), do mais recente para o mais antigo.
export function getMyExpiredStories(ownerId: string, now = Date.now()): Story[] {
  return loadStories()
    .stories.filter((story) => story.ownerId === ownerId && !story.deletedAt && isExpired(story, now))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
