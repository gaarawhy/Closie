import type { StoriesState } from "./types";

// Persistência temporária dos stories (localStorage). Para usar uma API, troque este arquivo
// mantendo as assinaturas; o resto do módulo só fala com ele.

const KEY = "closie:stories:v1";
const CHANGE_EVENT = "closie:stories-change";

// Sem localStorage (bloqueado ou fora do navegador), tudo vive só nesta cópia em memória.
let memory: string | null = null;

function hasLocalStorage() {
  try {
    return typeof localStorage !== "undefined" && localStorage !== null;
  } catch {
    return false;
  }
}

function read(): string | null {
  try {
    return hasLocalStorage() ? localStorage.getItem(KEY) : memory;
  } catch {
    return memory;
  }
}

const emptyState = (): StoriesState => ({
  stories: [],
  views: [],
  replies: [],
  likes: [],
  reactions: [],
  shares: [],
  reports: [],
});

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const list = (value: unknown) => (Array.isArray(value) ? value.filter(isRecord) : []);

// Lê o estado salvo; JSON quebrado ou formato estranho vira estado vazio.
export function loadStories(): StoriesState {
  return parseStories(read());
}

// Interpreta um retrato do storage (o mesmo texto que storiesSnapshot devolve). Os hooks usam
// isto para ler uma vez por mudança, e não a cada quadro da animação.
export function parseStories(raw: string | null): StoriesState {
  try {
    if (!raw) return emptyState();
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return emptyState();
    return {
      stories: list(data.stories).filter(
        (item) => typeof item.id === "string" && typeof item.ownerId === "string" && isRecord(item.media),
      ) as StoriesState["stories"],
      views: list(data.views) as StoriesState["views"],
      replies: list(data.replies) as StoriesState["replies"],
      likes: list(data.likes) as StoriesState["likes"],
      reactions: list(data.reactions) as StoriesState["reactions"],
      shares: list(data.shares) as StoriesState["shares"],
      reports: list(data.reports) as StoriesState["reports"],
    };
  } catch {
    return emptyState();
  }
}

// Grava tudo de uma vez. Se o localStorage recusar (cheio), devolve false e nada muda —
// assim uma publicação que não coube não fica pela metade.
export function saveStories(state: StoriesState): boolean {
  const value = JSON.stringify(state);
  if (hasLocalStorage()) {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      return false;
    }
  } else {
    memory = value;
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
  return true;
}

export function updateStories(change: (state: StoriesState) => StoriesState): boolean {
  return saveStories(change(loadStories()));
}

// Para o useSyncExternalStore: muda sempre que algo de stories muda.
export function storiesSnapshot(): string {
  return read() ?? "";
}

export function subscribeStories(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
