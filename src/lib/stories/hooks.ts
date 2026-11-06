"use client";

import { useCallback, useEffect, useMemo, useReducer, useSyncExternalStore } from "react";
import { useSession } from "@/lib/account";
import { getPerson, useSocialSnapshot } from "@/lib/social";
import { unavailableReason } from "./access";
import { useNow } from "./clock";
import {
  buildDiscoverFeed,
  buildStoriesFeed,
  getMyActiveStories,
  getMyExpiredStories,
  type FeedGroup,
  type StoriesFeed,
} from "./feed";
import { parseStories, storiesSnapshot, subscribeStories } from "./storage";
import type { Story, Unavailable } from "./types";
import { markStoryViewed } from "./views";
import {
  createViewer,
  currentStoryId,
  durationFor,
  segmentProgress,
  viewerReducer,
  type ViewerGroupRef,
  type ViewerStatus,
} from "./viewer";

// Hooks para a tela de stories (que ainda não existe). Só estado e regras: nada visual aqui.

const EMPTY_FEED: StoriesFeed = { unseen: [], seen: [], mine: null, isEmpty: true };

// Muda sempre que algo de stories muda: use como dependência para a tela reconsultar.
export function useStoriesSnapshot(): string {
  return useSyncExternalStore(subscribeStories, storiesSnapshot, () => "");
}

// Feed da pessoa logada. Reconsulta quando stories/relações mudam e a cada minuto
// (assim um story que expira sai da lista mesmo sem ninguém mexer em nada).
export function useStoriesFeed(): StoriesFeed & { loading: boolean } {
  const session = useSession();
  const stories = useStoriesSnapshot();
  const social = useSocialSnapshot();
  const now = useNow(60_000);
  return useMemo(() => {
    if (!session || now === 0) return { ...EMPTY_FEED, loading: session === undefined || now === 0 };
    // `stories` e `social` entram nas dependências como sinal de mudança; a consulta lê o storage atual
    void stories;
    void social;
    return { ...buildStoriesFeed(session.id, now), loading: false };
  }, [session, stories, social, now]);
}

// Descobrir: dumps públicos de perfis públicos que a pessoa ainda não segue.
export function useDiscoverFeed(): { loading: boolean; groups: FeedGroup[] } {
  const session = useSession();
  const stories = useStoriesSnapshot();
  const social = useSocialSnapshot();
  const now = useNow(60_000);
  return useMemo(() => {
    void stories;
    void social;
    if (!session || now === 0) return { loading: session === undefined || now === 0, groups: [] };
    return { loading: false, groups: buildDiscoverFeed(session.id, now) };
  }, [session, stories, social, now]);
}

// Stories da pessoa logada: no ar (em ordem de publicação) e histórico de expirados.
export function useMyStories(): { active: Story[]; expired: Story[] } {
  const session = useSession();
  const stories = useStoriesSnapshot();
  const now = useNow(60_000);
  return useMemo(() => {
    void stories;
    if (!session || now === 0) return { active: [], expired: [] };
    return { active: getMyActiveStories(session.id, now), expired: getMyExpiredStories(session.id, now) };
  }, [session, stories, now]);
}

// Leitor: guarda a lista da abertura, mede o tempo só enquanto toca, pausa com o dedo ou com a
// aba escondida, marca a visualização quando o story começa a tocar e troca o estado para
// expired/deleted/blocked/forbidden se o story deixar de poder ser visto com o leitor aberto.
export function useStoryViewer(viewerId: string, groups: ViewerGroupRef[], startGroupIndex: number) {
  const [state, dispatch] = useReducer(viewerReducer, undefined, () => createViewer(groups, startGroupIndex));
  const storiesRaw = useStoriesSnapshot();
  const social = useSocialSnapshot();
  const now = useNow(1000);
  const data = useMemo(() => parseStories(storiesRaw || null), [storiesRaw]);
  const storyId = currentStoryId(state);
  const story = useMemo(() => (storyId ? (data.stories.find((item) => item.id === storyId) ?? null) : null), [data, storyId]);

  const unavailable: Unavailable | null = useMemo(() => {
    void social;
    if (!storyId || now === 0) return null;
    // Sumiu do storage: trata como excluído
    if (!story) return "deleted";
    return unavailableReason(viewerId, story, now);
  }, [storyId, story, viewerId, now, social]);

  const owner = useMemo(() => {
    void social;
    return story ? getPerson(story.ownerId) : null;
  }, [story, social]);

  const status: ViewerStatus | Unavailable = unavailable ?? state.status;

  // Avança o tempo só enquanto toca (carregando, pausado, com erro ou indisponível: parado)
  useEffect(() => {
    if (status !== "playing") return;
    let last = performance.now();
    let frame = requestAnimationFrame(function loop(time) {
      dispatch({ type: "tick", deltaMs: time - last });
      last = time;
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [status]);

  useEffect(() => {
    const onChange = () => dispatch({ type: "visibility", hidden: document.hidden });
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  // Marca como visto quando começa a tocar (a função ignora repetições e o próprio dono)
  useEffect(() => {
    if (status === "playing" && storyId) markStoryViewed(storyId, viewerId);
  }, [status, storyId, viewerId]);

  const onMediaLoad = useCallback(
    (metadataSeconds?: number) => {
      if (story) dispatch({ type: "media_loaded", durationMs: durationFor(story.media, metadataSeconds) });
    },
    [story],
  );
  const onMediaError = useCallback(() => dispatch({ type: "media_error" }), []);
  const retry = useCallback(() => dispatch({ type: "retry" }), []);
  const hold = useCallback(() => dispatch({ type: "hold" }), []);
  const release = useCallback(() => dispatch({ type: "release" }), []);
  const nextStory = useCallback(() => dispatch({ type: "next_story" }), []);
  const prevStory = useCallback(() => dispatch({ type: "prev_story" }), []);
  const nextUser = useCallback(() => dispatch({ type: "next_user" }), []);
  const prevUser = useCallback(() => dispatch({ type: "prev_user" }), []);
  const close = useCallback(() => dispatch({ type: "close" }), []);

  return {
    status,
    story,
    owner,
    groupIndex: state.groupIndex,
    storyIndex: state.storyIndex,
    progress: segmentProgress(state),
    onMediaLoad,
    onMediaError,
    retry,
    hold,
    release,
    nextStory,
    prevStory,
    nextUser,
    prevUser,
    close,
  };
}
