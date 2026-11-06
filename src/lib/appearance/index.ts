// Personalização do perfil: estilos, capa, cores, adesivos, momentos e fonte. Tudo o que as
// telas usam passa por aqui. Para ligar um backend, troque storage.ts mantendo as assinaturas.
export {
  AVATAR_FRAMES,
  COLOR_SWATCHES,
  CORNERS,
  FONTS,
  GRADIENTS,
  MOMENT_LAYOUTS,
  PROFILE_STYLES,
  STICKER_CATEGORIES,
  STICKER_KINDS,
  TEXTURES,
} from "./catalog";
export type { AvatarFrame, Corners, FontChoice, GradientId, MomentsLayout, ProfileStyle, StickerKind, TextureId } from "./catalog";
export { contrastRatio, ensureReadable, isHexColor, mix, readableTextOn, themeColors } from "./color";
export type { ThemeColors } from "./color";
export { seedDemoAppearances } from "./demo";
export { useSavedAppearance } from "./hooks";
export {
  STICKERS_MAX,
  addSticker,
  chooseStyle,
  defaultAppearance,
  moveSticker,
  removeSticker,
  resolveAppearance,
  sanitizeAppearance,
  updateSticker,
} from "./model";
export { loadAppearance, resetAppearance, saveAppearance } from "./storage";
export { STYLE_PRESETS } from "./styles";
export type { CoverSetting, Palette, ProfileAppearance, ResolvedAppearance, Sticker, StylePreset } from "./types";
