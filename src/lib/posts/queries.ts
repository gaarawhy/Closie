import { canViewPosts } from "./access";
import { loadPosts, updatePosts } from "./storage";
import type { Post, PostFailure } from "./types";

// Consultas e curtidas. Tudo lê o estado salvo na hora.

const newestFirst = (a: Post, b: Post) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0);

export function getPost(postId: string): Post | null {
  return loadPosts().posts.find((post) => post.id === postId) ?? null;
}

// Momentos de um perfil que essa pessoa pode ver (nenhum, se não pode), do mais novo ao mais antigo.
export function listPosts(viewerId: string, ownerId: string): Post[] {
  if (!canViewPosts(viewerId, ownerId)) return [];
  return loadPosts()
    .posts.filter((post) => post.ownerId === ownerId)
    .sort(newestFirst);
}

// Número de publicações do perfil (um álbum conta uma vez, não importa quantas fotos).
export function countPosts(ownerId: string): number {
  return loadPosts().posts.filter((post) => post.ownerId === ownerId).length;
}

export function hasLikedPost(postId: string, userId: string): boolean {
  return loadPosts().likes.some((like) => like.postId === postId && like.userId === userId);
}

export function postLikeCount(postId: string): number {
  return loadPosts().likes.filter((like) => like.postId === postId).length;
}

// Curtir alterna (curte ou descurte). Só quem pode ver o momento curte.
export function togglePostLike(postId: string, userId: string, now = Date.now()): { ok: true; liked: boolean } | PostFailure {
  const post = getPost(postId);
  if (!post) return { ok: false, reason: "not_found", message: "Esse momento não existe mais." };
  if (!canViewPosts(userId, post.ownerId)) {
    return { ok: false, reason: "forbidden", message: "Você não pode ver esse momento." };
  }
  const liked = hasLikedPost(postId, userId);
  const saved = updatePosts((state) => ({
    ...state,
    likes: liked
      ? state.likes.filter((like) => !(like.postId === postId && like.userId === userId))
      : [...state.likes, { postId, userId, createdAt: new Date(now).toISOString() }],
  }));
  if (!saved) return { ok: false, reason: "storage", message: "Não deu pra salvar: o armazenamento do navegador está cheio." };
  return { ok: true, liked: !liked };
}
