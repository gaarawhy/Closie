import { IMAGE_DURATION_MS, VIDEO_FALLBACK_MS, VIDEO_MAX_MS, VIDEO_MIN_MS } from "./constants";
import type { StoryMedia } from "./types";

// Leitor de stories como máquina de estados pura: quem chama manda as ações (mídia carregou,
// passou tempo, segurou, tocou para avançar…) e recebe o novo estado. Nada aqui usa timer ou
// relógio; o hook (hooks.ts) é quem mede o tempo e dispara "tick".

// Lista guardada na abertura: enquanto a pessoa assiste, nada muda de lugar.
export type ViewerGroupRef = { ownerId: string; storyIds: string[]; startIndex: number };

export type ViewerStatus = "loading" | "playing" | "paused" | "error" | "finished" | "closed";

export type ViewerState = {
  groups: ViewerGroupRef[];
  groupIndex: number;
  storyIndex: number;
  status: ViewerStatus;
  elapsedMs: number;
  // Conhecida só depois que a mídia carrega
  durationMs: number | null;
  // Dedo pressionado (segurar para pausar)
  held: boolean;
  // Aba/app em segundo plano
  hidden: boolean;
};

export type ViewerAction =
  | { type: "media_loaded"; durationMs: number }
  | { type: "media_error" }
  | { type: "retry" }
  | { type: "tick"; deltaMs: number }
  | { type: "hold" }
  | { type: "release" }
  | { type: "visibility"; hidden: boolean }
  | { type: "next_story" }
  | { type: "prev_story" }
  | { type: "next_user" }
  | { type: "prev_user" }
  | { type: "close" };

// Foto: tempo fixo. Vídeo: a duração real, dentro dos limites; sem duração válida, o padrão.
export function durationFor(media: StoryMedia, metadataSeconds?: number): number {
  if (media.type === "image") return IMAGE_DURATION_MS;
  if (typeof metadataSeconds !== "number" || !Number.isFinite(metadataSeconds) || metadataSeconds <= 0) {
    return VIDEO_FALLBACK_MS;
  }
  return Math.min(VIDEO_MAX_MS, Math.max(VIDEO_MIN_MS, Math.round(metadataSeconds * 1000)));
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// Cada grupo precisa ter pelo menos um story (o feed nunca monta grupo vazio).
export function createViewer(groups: ViewerGroupRef[], groupIndex: number): ViewerState {
  const base = { groups, elapsedMs: 0, durationMs: null, held: false, hidden: false };
  if (groups.length === 0) return { ...base, groupIndex: 0, storyIndex: 0, status: "finished" };
  const gi = clamp(groupIndex, 0, groups.length - 1);
  const group = groups[gi];
  return { ...base, groupIndex: gi, storyIndex: clamp(group.startIndex, 0, group.storyIds.length - 1), status: "loading" };
}

function goTo(state: ViewerState, groupIndex: number, storyIndex: number): ViewerState {
  return { ...state, groupIndex, storyIndex, status: "loading", elapsedMs: 0, durationMs: null };
}

function nextUser(state: ViewerState): ViewerState {
  if (state.groupIndex < state.groups.length - 1) {
    const gi = state.groupIndex + 1;
    const group = state.groups[gi];
    return goTo(state, gi, clamp(group.startIndex, 0, group.storyIds.length - 1));
  }
  return { ...state, status: "finished" };
}

function nextStory(state: ViewerState): ViewerState {
  const group = state.groups[state.groupIndex];
  if (state.storyIndex < group.storyIds.length - 1) return goTo(state, state.groupIndex, state.storyIndex + 1);
  return nextUser(state);
}

// No primeiro story de uma pessoa, volta para o último story da pessoa anterior;
// no primeiro de todos, recomeça.
function prevStory(state: ViewerState): ViewerState {
  if (state.storyIndex > 0) return goTo(state, state.groupIndex, state.storyIndex - 1);
  if (state.groupIndex > 0) {
    const gi = state.groupIndex - 1;
    return goTo(state, gi, state.groups[gi].storyIds.length - 1);
  }
  return goTo(state, 0, 0);
}

function prevUser(state: ViewerState): ViewerState {
  return goTo(state, Math.max(0, state.groupIndex - 1), 0);
}

export function viewerReducer(state: ViewerState, action: ViewerAction): ViewerState {
  if (state.status === "finished" || state.status === "closed") return state;
  switch (action.type) {
    case "media_loaded":
      if (state.status !== "loading") return state;
      return { ...state, durationMs: action.durationMs, status: state.held || state.hidden ? "paused" : "playing" };
    case "media_error":
      return state.status === "loading" || state.status === "playing" || state.status === "paused"
        ? { ...state, status: "error" }
        : state;
    case "retry":
      return state.status === "error" ? { ...state, status: "loading", elapsedMs: 0, durationMs: null } : state;
    case "tick": {
      if (state.status !== "playing" || state.durationMs === null) return state;
      const elapsedMs = state.elapsedMs + Math.max(0, action.deltaMs);
      return elapsedMs >= state.durationMs ? nextStory(state) : { ...state, elapsedMs };
    }
    case "hold":
      return { ...state, held: true, status: state.status === "playing" ? "paused" : state.status };
    case "release":
      return {
        ...state,
        held: false,
        status: state.status === "paused" && !state.hidden ? "playing" : state.status,
      };
    case "visibility": {
      if (action.hidden) {
        return { ...state, hidden: true, status: state.status === "playing" ? "paused" : state.status };
      }
      return {
        ...state,
        hidden: false,
        status: state.status === "paused" && !state.held ? "playing" : state.status,
      };
    }
    case "next_story":
      return nextStory(state);
    case "prev_story":
      return prevStory(state);
    case "next_user":
      return nextUser(state);
    case "prev_user":
      return prevUser(state);
    case "close":
      return { ...state, status: "closed" };
    default:
      return state;
  }
}

export function currentStoryId(state: ViewerState): string | null {
  if (state.status === "finished" || state.status === "closed") return null;
  return state.groups[state.groupIndex]?.storyIds[state.storyIndex] ?? null;
}

// Barras do topo da pessoa atual: 1 nos já vistos nesta sessão, fração no atual, 0 nos seguintes.
export function segmentProgress(state: ViewerState): number[] {
  const group = state.groups[state.groupIndex];
  if (!group) return [];
  // Chegou ao fim: tudo assistido
  if (state.status === "finished") return group.storyIds.map(() => 1);
  return group.storyIds.map((_, index) => {
    if (index < state.storyIndex) return 1;
    if (index > state.storyIndex) return 0;
    return state.durationMs ? Math.min(1, state.elapsedMs / state.durationMs) : 0;
  });
}
