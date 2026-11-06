import type { CSSProperties } from "react";
import { GRADIENTS, themeColors, type Corners, type ResolvedAppearance } from "@/lib/appearance";
import { FONT_FAMILY, FONT_SCALE } from "./fonts";

// Variáveis CSS do perfil: tudo o que é personalizável vira --p-*, aplicado só na raiz da
// página de perfil (o resto da plataforma não muda).

const RADIUS: Record<Corners, { card: string; button: string }> = {
  redondo: { card: "24px", button: "999px" },
  suave: { card: "12px", button: "14px" },
  reto: { card: "2px", button: "6px" },
};

export function themeStyle(look: ResolvedAppearance): CSSProperties {
  const colors = themeColors(look.palette);
  return {
    "--p-bg": colors.bg,
    "--p-text": colors.text,
    "--p-muted": colors.muted,
    "--p-surface": colors.surface,
    "--p-border": colors.border,
    "--p-primary": colors.primary,
    "--p-on-primary": colors.onPrimary,
    "--p-title": colors.title,
    "--p-accent": colors.accent,
    "--p-on-accent": colors.onAccent,
    "--p-accent-text": colors.accentText,
    "--p-decor": colors.decor,
    "--p-on-decor": colors.onDecor,
    "--p-display": FONT_FAMILY[look.font],
    "--p-display-scale": String(FONT_SCALE[look.font]),
    "--p-radius": RADIUS[look.corners].card,
    "--p-radius-button": RADIUS[look.corners].button,
    color: colors.text,
  } as CSSProperties;
}

export const gradientCss = (id: string) => GRADIENTS.find((item) => item.id === id)?.css ?? "none";

// Tamanho de título que acompanha a fonte escolhida (manuscrita e retrô parecem menores)
export const displaySize = (rem: number): CSSProperties => ({ fontSize: `calc(${rem}rem * var(--p-display-scale))` });

// Classes prontas com as variáveis. A dica "color:" evita que o Tailwind confunda cor com tamanho.
export const themed = {
  title: "text-[color:var(--p-title)] [font-family:var(--p-display)]",
  muted: "text-[color:var(--p-muted)]",
  primaryButton:
    "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--p-radius-button)] bg-[color:var(--p-primary)] px-4 text-sm font-semibold text-[color:var(--p-on-primary)] transition-[filter,transform] hover:brightness-95 active:scale-[0.98]",
  secondaryButton:
    "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--p-radius-button)] border border-[color:var(--p-border)] bg-[color:var(--p-bg)] px-4 text-sm font-semibold text-[color:var(--p-text)] transition-colors hover:bg-[color:var(--p-surface)] active:scale-[0.98]",
  iconButton:
    "flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--p-bg)] text-[color:var(--p-text)] shadow-md ring-1 ring-black/5 transition-transform hover:scale-105",
};
