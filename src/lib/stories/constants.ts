import type { StoryPrivacy } from "./types";

// Cada story vale 24 horas a partir da publicação.
export const STORY_TTL_MS = 24 * 60 * 60 * 1000;

// Tempo na tela: foto fixa; vídeo pela duração do arquivo, dentro dos limites.
export const IMAGE_DURATION_MS = 5000;
export const VIDEO_MIN_MS = 1000;
export const VIDEO_MAX_MS = 60000;
// Quando o vídeo não informa a duração (NaN, Infinity em transmissões)
export const VIDEO_FALLBACK_MS = 10000;

export const CAPTION_MAX = 200;
export const REPLY_MAX = 500;

export const STORY_PRIVACY_OPTIONS: readonly StoryPrivacy[] = ["public", "followers", "close_friends"];
export const DEFAULT_STORY_PRIVACY: StoryPrivacy = "followers";

// Reações rápidas aceitas e motivos de denúncia
export const STORY_REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👏"] as const;
export const REPORT_REASONS = ["spam", "nudez", "violencia", "assedio", "outro"] as const;
