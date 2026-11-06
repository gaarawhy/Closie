import type { AvatarFrame, Corners, FontChoice, GradientId, MomentsLayout, ProfileStyle, StickerKind, TextureId } from "./catalog";

// Formato da personalização de um perfil. Com backend, a API deve devolver estes mesmos campos.

export type CoverSetting =
  | { kind: "padrao" } // a capa do estilo
  | { kind: "cor"; color: string }
  | { kind: "gradiente"; gradient: GradientId }
  | { kind: "textura"; texture: Exclude<TextureId, "nenhuma"> }
  // x/y: ponto da foto que fica no centro do recorte (0–100)
  | { kind: "imagem"; url: string; x: number; y: number };

export type Palette = { primary: string; accent: string; background: string; decor: string };

// Adesivo na capa: x/y em % da capa; giro em graus; tamanho relativo (1 = normal)
export type Sticker = { id: string; kind: StickerKind; x: number; y: number; rotate: number; scale: number };

// O que a pessoa salvou. null = "o do estilo".
export type ProfileAppearance = {
  style: ProfileStyle;
  cover: CoverSetting;
  palette: Palette | null;
  font: FontChoice | null;
  layout: MomentsLayout | null;
  corners: Corners | null;
  frame: AvatarFrame | null;
  texture: TextureId | null;
  stickers: Sticker[];
};

// Tudo resolvido (escolhas da pessoa por cima do estilo): é isso que a tela desenha.
export type ResolvedAppearance = {
  style: ProfileStyle;
  cover: CoverSetting;
  palette: Palette;
  font: FontChoice;
  layout: MomentsLayout;
  corners: Corners;
  frame: AvatarFrame;
  texture: TextureId;
  stickers: Sticker[];
};

export type StylePreset = {
  name: string;
  description: string;
  palette: Palette;
  font: FontChoice;
  layout: MomentsLayout;
  corners: Corners;
  frame: AvatarFrame;
  texture: TextureId;
};
