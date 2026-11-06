import type { ProfileStyle } from "./catalog";
import type { StylePreset } from "./types";

// Os dois estilos do perfil. Cada um muda a composição inteira (capa, moldura da foto, fonte dos
// títulos, jeito de mostrar os momentos, textura), não só as cores.
export const STYLE_PRESETS: Record<ProfileStyle, StylePreset> = {
  classico: {
    name: "Clássico",
    description: "O visual da Closie: limpo, branco e vermelho.",
    palette: { primary: "#D62828", accent: "#D62828", background: "#FFFFFF", decor: "#F1F1EC" },
    font: "moderna",
    layout: "cartoes",
    corners: "redondo",
    frame: "anel",
    texture: "nenhuma",
  },
  scrapbook: {
    name: "Scrapbook",
    description: "Recortes, fitas adesivas, polaroids e rabiscos.",
    palette: { primary: "#2F2A24", accent: "#E4572E", background: "#F4ECDD", decor: "#F2C14E" },
    font: "manuscrita",
    layout: "colagem",
    corners: "reto",
    frame: "polaroid",
    texture: "papel",
  },
};
