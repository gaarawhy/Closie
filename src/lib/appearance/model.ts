import {
  AVATAR_FRAMES,
  CORNERS,
  FONTS,
  GRADIENTS,
  MOMENT_LAYOUTS,
  PROFILE_STYLES,
  STICKER_KINDS,
  TEXTURES,
  ids,
  isOneOf,
  type ProfileStyle,
} from "./catalog";
import { isHexColor } from "./color";
import { STYLE_PRESETS } from "./styles";
import type { CoverSetting, Palette, ProfileAppearance, ResolvedAppearance, Sticker } from "./types";

// Regras da personalização (puras): resolver o visual, trocar de estilo e mexer nos adesivos.

export const STICKERS_MAX = 12;

export function defaultAppearance(): ProfileAppearance {
  return {
    style: "classico",
    cover: { kind: "padrao" },
    palette: null,
    font: null,
    layout: null,
    corners: null,
    frame: null,
    texture: null,
    stickers: [],
  };
}

// As escolhas da pessoa por cima do estilo. Sem personalização, o visual original da Closie.
export function resolveAppearance(look: ProfileAppearance | null): ResolvedAppearance {
  const base = look ?? defaultAppearance();
  const preset = STYLE_PRESETS[base.style];
  return {
    style: base.style,
    cover: base.cover,
    palette: base.palette ?? preset.palette,
    font: base.font ?? preset.font,
    layout: base.layout ?? preset.layout,
    corners: base.corners ?? preset.corners,
    frame: base.frame ?? preset.frame,
    texture: base.texture ?? preset.texture,
    stickers: base.stickers,
  };
}

// Novo estilo: as escolhas voltam a ser as do estilo; a foto da capa e os adesivos ficam.
export function chooseStyle(look: ProfileAppearance, style: ProfileStyle): ProfileAppearance {
  return {
    ...look,
    style,
    cover: look.cover.kind === "imagem" ? look.cover : { kind: "padrao" },
    palette: null,
    font: null,
    layout: null,
    corners: null,
    frame: null,
    texture: null,
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const clampPosition = (value: number) => clamp(Math.round(value * 10) / 10, 4, 96);

// Lugares bonitos (e diferentes) para cada adesivo novo, com um giro leve
const SPOTS: [x: number, y: number, rotate: number][] = [
  [14, 28, -12],
  [86, 30, 10],
  [30, 70, 6],
  [72, 64, -8],
  [52, 20, 14],
  [92, 72, -14],
  [8, 62, 8],
  [62, 42, -4],
  [40, 36, 12],
  [22, 50, -6],
  [78, 16, 4],
  [46, 78, -10],
];

export function addSticker(look: ProfileAppearance, kind: string): ProfileAppearance {
  if (!isOneOf(STICKER_KINDS, kind) || look.stickers.length >= STICKERS_MAX) return look;
  const [x, y, rotate] = SPOTS[look.stickers.length % SPOTS.length];
  const sticker: Sticker = { id: crypto.randomUUID(), kind, x, y, rotate, scale: 1 };
  return { ...look, stickers: [...look.stickers, sticker] };
}

export function moveSticker(look: ProfileAppearance, id: string, x: number, y: number): ProfileAppearance {
  return {
    ...look,
    stickers: look.stickers.map((item) => (item.id === id ? { ...item, x: clampPosition(x), y: clampPosition(y) } : item)),
  };
}

export function updateSticker(look: ProfileAppearance, id: string, patch: { rotate?: number; scale?: number }): ProfileAppearance {
  return {
    ...look,
    stickers: look.stickers.map((item) =>
      item.id === id
        ? {
            ...item,
            rotate: patch.rotate === undefined ? item.rotate : clamp(Math.round(patch.rotate), -45, 45),
            scale: patch.scale === undefined ? item.scale : clamp(Math.round(patch.scale * 100) / 100, 0.6, 1.8),
          }
        : item,
    ),
  };
}

export function removeSticker(look: ProfileAppearance, id: string): ProfileAppearance {
  return { ...look, stickers: look.stickers.filter((item) => item.id !== id) };
}

// --- Leitura segura do que veio do armazenamento (tudo estranho vira o padrão) ---

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isSafeImage = (value: unknown): value is string =>
  typeof value === "string" && (value.startsWith("data:image/") || /^https?:\/\//.test(value));

function sanitizeCover(value: unknown): CoverSetting {
  if (!isRecord(value)) return { kind: "padrao" };
  if (value.kind === "cor" && isHexColor(value.color)) return { kind: "cor", color: value.color };
  if (value.kind === "gradiente" && isOneOf(ids(GRADIENTS), value.gradient)) return { kind: "gradiente", gradient: value.gradient };
  if (value.kind === "textura" && isOneOf(ids(TEXTURES), value.texture) && value.texture !== "nenhuma") {
    return { kind: "textura", texture: value.texture };
  }
  if (value.kind === "imagem" && isSafeImage(value.url)) {
    return {
      kind: "imagem",
      url: value.url,
      x: isNumber(value.x) ? clamp(value.x, 0, 100) : 50,
      y: isNumber(value.y) ? clamp(value.y, 0, 100) : 50,
    };
  }
  return { kind: "padrao" };
}

function sanitizePalette(value: unknown): Palette | null {
  if (!isRecord(value)) return null;
  const { primary, accent, background, decor } = value;
  return isHexColor(primary) && isHexColor(accent) && isHexColor(background) && isHexColor(decor)
    ? { primary, accent, background, decor }
    : null;
}

function sanitizeStickers(value: unknown): Sticker[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => isRecord(item) && isOneOf(STICKER_KINDS, item.kind))
    .slice(0, STICKERS_MAX)
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
      kind: item.kind as Sticker["kind"],
      x: isNumber(item.x) ? clampPosition(item.x) : 50,
      y: isNumber(item.y) ? clampPosition(item.y) : 50,
      rotate: isNumber(item.rotate) ? clamp(item.rotate, -45, 45) : 0,
      scale: isNumber(item.scale) ? clamp(item.scale, 0.6, 1.8) : 1,
    }));
}

export function sanitizeAppearance(value: unknown): ProfileAppearance {
  if (!isRecord(value)) return defaultAppearance();
  const pick = <T extends string>(list: readonly T[], item: unknown): T | null => (isOneOf(list, item) ? item : null);
  return {
    style: isOneOf(PROFILE_STYLES, value.style) ? value.style : "classico",
    cover: sanitizeCover(value.cover),
    palette: sanitizePalette(value.palette),
    font: pick(ids(FONTS), value.font),
    layout: pick(ids(MOMENT_LAYOUTS), value.layout),
    corners: pick(ids(CORNERS), value.corners),
    frame: pick(ids(AVATAR_FRAMES), value.frame),
    texture: pick(ids(TEXTURES), value.texture),
    stickers: sanitizeStickers(value.stickers),
  };
}
