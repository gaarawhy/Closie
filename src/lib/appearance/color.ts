import type { Palette } from "./types";

// Cores da personalização: conta de contraste (WCAG) para o texto continuar legível com
// qualquer combinação que a pessoa escolher.

export function parseHex(value: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? [...match[1]].map((char) => char + char).join("") : match[1];
  const number = Number.parseInt(hex, 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

export const isHexColor = (value: unknown): value is string => typeof value === "string" && parseHex(value) !== null;

const toHex = (rgb: number[]) =>
  `#${rgb.map((channel) => Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

export function luminance(hex: string): number {
  const [r, g, b] = (parseHex(hex) ?? [0, 0, 0]).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// Quase preto ou branco: o que der mais contraste com o fundo.
export function readableTextOn(background: string): "#111111" | "#FFFFFF" {
  return contrastRatio("#111111", background) >= contrastRatio("#FFFFFF", background) ? "#111111" : "#FFFFFF";
}

// Mistura a com b (amount 0 = só a, 1 = só b).
export function mix(a: string, b: string, amount: number): string {
  const from = parseHex(a) ?? [0, 0, 0];
  const to = parseHex(b) ?? [0, 0, 0];
  return toHex(from.map((value, index) => value + (to[index] - value) * amount));
}

// Usa a cor se ela tiver contraste suficiente com o fundo; senão, o texto legível.
export function ensureReadable(color: string, background: string, minimum: number): string {
  return contrastRatio(color, background) >= minimum ? color : readableTextOn(background);
}

export type ThemeColors = {
  bg: string;
  text: string;
  muted: string;
  surface: string;
  border: string;
  primary: string;
  onPrimary: string;
  title: string;
  accent: string;
  onAccent: string;
  accentText: string;
  decor: string;
  onDecor: string;
};

// As cores que a tela usa, derivadas das quatro escolhidas: texto e textos fracos legíveis
// sobre o fundo, títulos e destaques com contraste mínimo de 3:1 (texto grande), e a cor do
// texto em cima de botões e adesivos.
export function themeColors(palette: Palette): ThemeColors {
  const bg = palette.background;
  const text = readableTextOn(bg);
  return {
    bg,
    text,
    muted: mix(text, bg, 0.38),
    surface: mix(bg, text, 0.05),
    border: mix(bg, text, 0.16),
    primary: palette.primary,
    onPrimary: readableTextOn(palette.primary),
    title: ensureReadable(palette.primary, bg, 3),
    accent: palette.accent,
    onAccent: readableTextOn(palette.accent),
    accentText: ensureReadable(palette.accent, bg, 3),
    decor: palette.decor,
    onDecor: readableTextOn(palette.decor),
  };
}
