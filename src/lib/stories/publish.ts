import { getPerson } from "@/lib/social";
import { isExpired } from "./access";
import { CAPTION_MAX, DEFAULT_STORY_PRIVACY, STORY_PRIVACY_OPTIONS, STORY_TTL_MS } from "./constants";
import { loadStories, saveStories, updateStories } from "./storage";
import type { PublishFailure, PublishResult, Story, StoryMedia, StoryPrivacy } from "./types";

// Criar, excluir e mudar a privacidade de stories. Validação aqui (e não só na tela),
// porque estas funções são o "servidor" enquanto não existe backend.

const fail = (reason: PublishFailure, message: string): PublishResult => ({ ok: false, reason, message });

const isStoryPrivacy = (value: unknown): value is StoryPrivacy =>
  typeof value === "string" && (STORY_PRIVACY_OPTIONS as readonly string[]).includes(value);

function mediaProblem(media: StoryMedia | undefined): string | null {
  if (!media || (media.type !== "image" && media.type !== "video")) return "Escolha uma foto ou um vídeo.";
  const url = typeof media.url === "string" ? media.url.trim() : "";
  if (url.startsWith("blob:")) return "Essa mídia é temporária e se perderia ao atualizar a página.";
  if (url.startsWith("data:")) {
    return url.startsWith(`data:${media.type}/`) ? null : "O arquivo não combina com o tipo de mídia.";
  }
  return /^https?:\/\/\S+$/.test(url) ? null : "Não deu pra usar essa mídia.";
}

export function publishStory(
  input: { ownerId: string; media: StoryMedia; caption?: string | null; privacy?: StoryPrivacy },
  now = Date.now(),
): PublishResult {
  if (!input.ownerId || !getPerson(input.ownerId)) return fail("no_owner", "Entre na sua conta para publicar.");
  const problem = mediaProblem(input.media);
  if (problem) return fail("invalid_media", problem);
  const caption = (input.caption ?? "").trim();
  if (caption.length > CAPTION_MAX) {
    return fail("invalid_caption", `A legenda pode ter no máximo ${CAPTION_MAX} caracteres.`);
  }
  const privacy = input.privacy ?? DEFAULT_STORY_PRIVACY;
  if (!isStoryPrivacy(privacy)) return fail("invalid_privacy", "Escolha quem pode ver esse story.");

  const story: Story = {
    id: crypto.randomUUID(),
    ownerId: input.ownerId,
    media: { type: input.media.type, url: input.media.url.trim() },
    caption: caption.length > 0 ? caption : null,
    privacy,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + STORY_TTL_MS).toISOString(),
    deletedAt: null,
  };
  const state = loadStories();
  if (!saveStories({ ...state, stories: [...state.stories, story] })) {
    return fail("storage", "Não deu pra publicar: o armazenamento do navegador está cheio.");
  }
  return { ok: true, story };
}

// Excluir vale para ativos e para o histórico. As visualizações, curtidas e reações saem junto;
// respostas e denúncias ficam (são conversa e moderação, não parte do story).
export function deleteStory(
  storyId: string,
  ownerId: string,
  now = Date.now(),
): { ok: true } | { ok: false; reason: "not_found" | "forbidden" } {
  const story = loadStories().stories.find((item) => item.id === storyId && !item.deletedAt);
  if (!story) return { ok: false, reason: "not_found" };
  if (story.ownerId !== ownerId) return { ok: false, reason: "forbidden" };
  const deletedAt = new Date(now).toISOString();
  updateStories((state) => ({
    ...state,
    stories: state.stories.map((item) => (item.id === storyId ? { ...item, deletedAt } : item)),
    views: state.views.filter((item) => item.storyId !== storyId),
    likes: state.likes.filter((item) => item.storyId !== storyId),
    reactions: state.reactions.filter((item) => item.storyId !== storyId),
  }));
  return { ok: true };
}

export function updateStoryPrivacy(
  storyId: string,
  ownerId: string,
  privacy: StoryPrivacy,
  now = Date.now(),
): { ok: true } | { ok: false; reason: "not_found" | "forbidden" | "expired" | "invalid_privacy" } {
  const story = loadStories().stories.find((item) => item.id === storyId && !item.deletedAt);
  if (!story) return { ok: false, reason: "not_found" };
  if (story.ownerId !== ownerId) return { ok: false, reason: "forbidden" };
  if (!isStoryPrivacy(privacy)) return { ok: false, reason: "invalid_privacy" };
  if (isExpired(story, now)) return { ok: false, reason: "expired" };
  updateStories((state) => ({
    ...state,
    stories: state.stories.map((item) => (item.id === storyId ? { ...item, privacy } : item)),
  }));
  return { ok: true };
}
