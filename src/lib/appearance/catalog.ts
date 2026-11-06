// Catálogos da personalização: o que existe para escolher. Só dados (ids e nomes);
// o desenho de cada item fica nos componentes.

// Dois estilos: o clássico, o visual original da Closie (branco, Sora, foto redonda, momentos em
// cartões), e o scrapbook (papel kraft, letra manuscrita, polaroid, colagem). As escolhas abaixo
// personalizam o estilo de cada pessoa.
export const PROFILE_STYLES = ["classico", "scrapbook"] as const;
export type ProfileStyle = (typeof PROFILE_STYLES)[number];

export const FONTS = [
  { id: "moderna", label: "Moderna" },
  { id: "editorial", label: "Editorial" },
  { id: "manuscrita", label: "Manuscrita" },
  { id: "retro", label: "Retrô" },
] as const;
export type FontChoice = (typeof FONTS)[number]["id"];

export const MOMENT_LAYOUTS = [
  { id: "cartoes", label: "Cartões", text: "Mosaico com cantos do seu jeito" },
  { id: "polaroid", label: "Polaroid", text: "Fotos reveladas, com legenda embaixo" },
  { id: "moldura", label: "Moldura", text: "Cada foto num quadro" },
  { id: "editorial", label: "Editorial", text: "Um destaque grande, como revista" },
  { id: "minimal", label: "Minimal", text: "Grade limpa, só as fotos" },
  { id: "colagem", label: "Colagem", text: "Fotos sobrepostas com fita" },
  { id: "filme", label: "Filme", text: "Quadros de filme com data" },
] as const;
export type MomentsLayout = (typeof MOMENT_LAYOUTS)[number]["id"];

export const CORNERS = [
  { id: "redondo", label: "Redondos" },
  { id: "suave", label: "Suaves" },
  { id: "reto", label: "Retos" },
] as const;
export type Corners = (typeof CORNERS)[number]["id"];

export const AVATAR_FRAMES = [
  { id: "nenhuma", label: "Sem moldura" },
  { id: "anel", label: "Anel" },
  { id: "polaroid", label: "Polaroid" },
  { id: "fita", label: "Com fita" },
  { id: "cromado", label: "Cromado" },
  { id: "filme", label: "Visor de câmera" },
  { id: "pixel", label: "Pixel" },
] as const;
export type AvatarFrame = (typeof AVATAR_FRAMES)[number]["id"];

export const TEXTURES = [
  { id: "nenhuma", label: "Nenhuma" },
  { id: "papel", label: "Papel" },
  { id: "grao", label: "Grão de filme" },
  { id: "pontilhado", label: "Pontilhado" },
  { id: "grade", label: "Grade" },
  { id: "scanlines", label: "Linhas de TV" },
  { id: "holografico", label: "Holográfico" },
] as const;
export type TextureId = (typeof TEXTURES)[number]["id"];

export const GRADIENTS = [
  { id: "por-do-sol", label: "Pôr do sol", css: "linear-gradient(135deg, #FF8A5B 0%, #FFC371 100%)" },
  { id: "oceano", label: "Oceano", css: "linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)" },
  { id: "cromado", label: "Cromado", css: "linear-gradient(120deg, #F5F7FA 0%, #B8C1CC 30%, #FFFFFF 50%, #9AA5B4 70%, #E9EDF2 100%)" },
  { id: "aurora", label: "Aurora", css: "linear-gradient(135deg, #7F7FD5 0%, #86A8E7 50%, #91EAE4 100%)" },
  { id: "pessego", label: "Pêssego", css: "linear-gradient(135deg, #FFDDE1 0%, #EE9CA7 100%)" },
  { id: "noite", label: "Noite", css: "linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)" },
  { id: "menta", label: "Menta", css: "linear-gradient(135deg, #D4FC79 0%, #96E6A1 100%)" },
  { id: "vinho", label: "Vinho", css: "linear-gradient(135deg, #4B134F 0%, #C94B4B 100%)" },
] as const;
export type GradientId = (typeof GRADIENTS)[number]["id"];

// Cores prontas para os seletores (além do seletor livre)
export const COLOR_SWATCHES = [
  "#111111",
  "#FFFFFF",
  "#D62828",
  "#E4572E",
  "#F2C14E",
  "#00A86B",
  "#2DE2E6",
  "#2B4FD6",
  "#5B2BFF",
  "#FF4FD8",
  "#F4ECDD",
  "#0B0B12",
] as const;

// Doodles coloridos com carinha (desenhos próprios da Closie)
export const DOODLE_KINDS = ["flor-branca", "flor-rosa", "flor-vermelha", "estrela-sorriso", "coracao-brilho", "caracol", "nuvem-sorriso", "sol-sorriso"] as const;
export type DoodleKind = (typeof DOODLE_KINDS)[number];

// Rabiscos à mão do pacote dddoodle (fffuel, CC BY 4.0); os desenhos ficam em
// components/profile/appearance/rabiscos.ts (gerado)
export const RABISCO_KINDS = [
  "dd-misc-30",
  "dd-misc-31",
  "dd-misc-38",
  "dd-misc-51",
  "dd-misc-35",
  "dd-misc-15",
  "dd-misc-43",
  "dd-misc-12",
  "dd-misc-10",
  "dd-misc-5",
  "dd-misc-9",
  "dd-misc-53",
  "dd-misc-1",
  "dd-misc-14",
  "dd-misc-3",
  "dd-misc-57",
  "dd-misc-18",
  "dd-misc-50",
  "dd-circle-1",
  "dd-circle-15",
  "dd-circle-4",
  "dd-circle-6",
  "dd-circle-8",
  "dd-arrow-4",
  "dd-arrow-14",
  "dd-arrow-9",
  "dd-arrow-18",
  "dd-arrow-21",
  "dd-arrow-35",
  "dd-line-3",
  "dd-line-6",
] as const;
export type RabiscoKind = (typeof RABISCO_KINDS)[number];

export const STICKER_CATEGORIES = [
  { id: "doodles", label: "Doodles", kinds: DOODLE_KINDS },
  { id: "rabiscos", label: "Rabiscos", kinds: [...RABISCO_KINDS, "onda", "espiral", "seta", "circulo", "sublinhado", "coroa"] },
  { id: "simbolos", label: "Símbolos", kinds: ["brilho", "estrela", "coracao", "sorriso", "flor", "raio", "lua", "brilhos"] },
  { id: "adesivos", label: "Palavras", kinds: ["oi", "amor", "xoxo", "vibes", "ano", "uau", "selo"] },
  { id: "fitas", label: "Fitas", kinds: ["fita-listrada", "fita-poa", "fita-lisa", "fita-xadrez"] },
  { id: "foto", label: "Fotografia", kinds: ["filme", "camera", "rec", "data", "diafragma", "cantoneiras"] },
  { id: "graficos", label: "Detalhes gráficos", kinds: ["coracao-pixel", "cursor", "estrela-cromada", "pontos", "mais", "codigo-barras"] },
] as const;
export type StickerKind = (typeof STICKER_CATEGORIES)[number]["kinds"][number];
export const STICKER_KINDS: readonly StickerKind[] = STICKER_CATEGORIES.flatMap((category) => category.kinds);

// Paletas prontas (1 toque): fundo, texto principal, destaque e decoração que combinam.
// O texto continua legível em todas (themeColors ajusta onde precisar).
export const PALETTES = [
  { id: "classico", label: "Clássico", palette: { primary: "#D62828", accent: "#D62828", background: "#FFFFFF", decor: "#F1F1EC" } },
  { id: "kraft", label: "Kraft", palette: { primary: "#2F2A24", accent: "#E4572E", background: "#F4ECDD", decor: "#F2C14E" } },
  { id: "chiclete", label: "Chiclete", palette: { primary: "#C2185B", accent: "#FF5FA2", background: "#FFF0F6", decor: "#FFC2DD" } },
  { id: "lavanda", label: "Lavanda", palette: { primary: "#5B3FD1", accent: "#8E7CFF", background: "#F4F1FF", decor: "#D9D1FF" } },
  { id: "menta", label: "Menta", palette: { primary: "#11705A", accent: "#2BB58C", background: "#EEFAF5", decor: "#BDEBD9" } },
  { id: "oceano", label: "Oceano", palette: { primary: "#1D4E89", accent: "#2E8BC0", background: "#EEF5FB", decor: "#B9D9F0" } },
  { id: "pessego", label: "Pêssego", palette: { primary: "#B5462A", accent: "#FF8A5B", background: "#FFF4EE", decor: "#FFD1BA" } },
  { id: "cereja", label: "Cereja", palette: { primary: "#8E1B2D", accent: "#E23D55", background: "#FFF5F6", decor: "#F7C4CC" } },
  { id: "noite", label: "Noite", palette: { primary: "#F5F5F7", accent: "#FF5FA2", background: "#141418", decor: "#2A2A33" } },
  { id: "preto-branco", label: "Preto e branco", palette: { primary: "#111111", accent: "#111111", background: "#FFFFFF", decor: "#E7E7E2" } },
] as const;

export const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);

export const ids = <T extends { id: string }>(list: readonly T[]) => list.map((item) => item.id) as T["id"][];
