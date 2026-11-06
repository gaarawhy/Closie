import { getPerson } from "@/lib/social";
import { POST_CAPTION_MAX, POST_PHOTOS_MAX } from "./constants";
import { loadPosts, updatePosts } from "./storage";
import type { NewPhoto, Post, PostFailure } from "./types";

// Criar, editar a legenda e excluir momentos. Só o dono mexe no que é dele.

const invalid = (message: string): PostFailure => ({ ok: false, reason: "invalid", message });
const NOT_FOUND: PostFailure = { ok: false, reason: "not_found", message: "Esse momento não existe mais." };
const FORBIDDEN: PostFailure = { ok: false, reason: "forbidden", message: "Só quem publicou pode mexer nesse momento." };
const NOT_SAVED: PostFailure = {
  ok: false,
  reason: "storage",
  message: "Não deu pra salvar: o armazenamento do navegador está cheio.",
};

// Só foto de verdade: data URL de imagem ou endereço http(s). Nada de javascript: e afins.
const isSafeUrl = (url: string) => url.startsWith("data:image/") || /^https?:\/\//.test(url);

function cleanCaption(caption: string | null | undefined): { ok: true; value: string | null } | PostFailure {
  const value = (caption ?? "").trim();
  if (value.length > POST_CAPTION_MAX) return invalid(`A legenda pode ter até ${POST_CAPTION_MAX} caracteres.`);
  return { ok: true, value: value.length > 0 ? value : null };
}

export function createPost(
  input: { ownerId: string; photos: NewPhoto[]; caption?: string | null },
  now = Date.now(),
): { ok: true; post: Post } | PostFailure {
  if (!getPerson(input.ownerId)) return invalid("Conta não encontrada.");
  if (input.photos.length === 0 || input.photos.length > POST_PHOTOS_MAX) {
    return invalid(`Um momento tem de 1 a ${POST_PHOTOS_MAX} fotos.`);
  }
  if (!input.photos.every((photo) => isSafeUrl(photo.url) && photo.width > 0 && photo.height > 0)) {
    return invalid("Não deu pra usar uma das fotos. Escolha outra.");
  }
  const caption = cleanCaption(input.caption);
  if (!caption.ok) return caption;
  const post: Post = {
    id: crypto.randomUUID(),
    ownerId: input.ownerId,
    photos: input.photos.map((photo) => ({
      id: crypto.randomUUID(),
      url: photo.url,
      width: Math.round(photo.width),
      height: Math.round(photo.height),
    })),
    caption: caption.value,
    createdAt: new Date(now).toISOString(),
    editedAt: null,
  };
  if (!updatePosts((state) => ({ ...state, posts: [...state.posts, post] }))) return NOT_SAVED;
  return { ok: true, post };
}

export function updatePostCaption(
  postId: string,
  userId: string,
  caption: string,
  now = Date.now(),
): { ok: true; post: Post } | PostFailure {
  const post = loadPosts().posts.find((item) => item.id === postId);
  if (!post) return NOT_FOUND;
  if (post.ownerId !== userId) return FORBIDDEN;
  const clean = cleanCaption(caption);
  if (!clean.ok) return clean;
  const updated: Post = { ...post, caption: clean.value, editedAt: new Date(now).toISOString() };
  if (!updatePosts((state) => ({ ...state, posts: state.posts.map((item) => (item.id === postId ? updated : item)) }))) {
    return NOT_SAVED;
  }
  return { ok: true, post: updated };
}

// Excluir leva junto as curtidas (não sobra nada do momento).
export function deletePost(postId: string, userId: string): { ok: true } | PostFailure {
  const post = loadPosts().posts.find((item) => item.id === postId);
  if (!post) return NOT_FOUND;
  if (post.ownerId !== userId) return FORBIDDEN;
  const saved = updatePosts((state) => ({
    posts: state.posts.filter((item) => item.id !== postId),
    likes: state.likes.filter((like) => like.postId !== postId),
  }));
  return saved ? { ok: true } : NOT_SAVED;
}
