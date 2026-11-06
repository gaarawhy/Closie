import type { Post, PostLike, PostPhoto, PostsState } from "./types";

// Persistência temporária dos momentos (localStorage). Para usar uma API, troque este arquivo
// mantendo as assinaturas; o resto do módulo só fala com ele.

const KEY = "closie:posts:v1";
const CHANGE_EVENT = "closie:posts-change";

// Cópia em memória para quando o localStorage estiver bloqueado (vale só nesta visita).
let memory: string | null = null;

function read(): string | null {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

const emptyState = (): PostsState => ({ posts: [], likes: [] });

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isString = (value: unknown): value is string => typeof value === "string";
const isSize = (value: unknown): value is number => typeof value === "number" && value > 0;

const isPhoto = (value: unknown): value is PostPhoto =>
  isRecord(value) && isString(value.id) && isString(value.url) && isSize(value.width) && isSize(value.height);

function isPost(value: unknown): value is Post {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.ownerId) &&
    Array.isArray(value.photos) &&
    value.photos.length > 0 &&
    value.photos.every(isPhoto) &&
    (value.caption === null || isString(value.caption)) &&
    isString(value.createdAt) &&
    (value.editedAt === null || isString(value.editedAt))
  );
}

const isLike = (value: unknown): value is PostLike =>
  isRecord(value) && isString(value.postId) && isString(value.userId) && isString(value.createdAt);

// Lê e confere o formato; qualquer coisa estranha (JSON quebrado, campos faltando) fica de fora.
export function loadPosts(): PostsState {
  try {
    const raw = read();
    if (!raw) return emptyState();
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return emptyState();
    return {
      posts: Array.isArray(data.posts) ? data.posts.filter(isPost) : [],
      likes: Array.isArray(data.likes) ? data.likes.filter(isLike) : [],
    };
  } catch {
    return emptyState();
  }
}

// Grava e avisa quem está ouvindo. Devolve false se o localStorage recusou (armazenamento cheio):
// aí nada muda, nem na memória, para a tela não mostrar algo que some ao recarregar.
export function savePosts(state: PostsState): boolean {
  const value = JSON.stringify(state);
  try {
    localStorage.setItem(KEY, value);
  } catch (error) {
    // Cheio é falha de verdade; sem localStorage nenhum (bloqueado), a memória segura esta visita
    if (error instanceof DOMException && error.name === "QuotaExceededError") return false;
  }
  memory = value;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
  return true;
}

export function updatePosts(change: (state: PostsState) => PostsState): boolean {
  return savePosts(change(loadPosts()));
}

// Para o useSyncExternalStore: muda sempre que algum momento muda.
export function postsSnapshot(): string {
  return read() ?? "";
}

export function subscribePosts(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
