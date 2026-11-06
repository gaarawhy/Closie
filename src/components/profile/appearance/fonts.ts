import { Caveat, Fraunces, VT323 } from "next/font/google";
import type { FontChoice } from "@/lib/appearance";

// Fontes da personalização. Só entram nas telas de perfil (nome, títulos e legendas);
// botões, números e textos de uso continuam na Sora.
const editorial = Fraunces({ subsets: ["latin"], variable: "--font-editorial", display: "swap" });
const handwritten = Caveat({ subsets: ["latin"], variable: "--font-handwritten", display: "swap" });
const retro = VT323({ subsets: ["latin"], weight: "400", variable: "--font-retro", display: "swap" });

export const profileFontVariables = `${editorial.variable} ${handwritten.variable} ${retro.variable}`;

export const FONT_FAMILY: Record<FontChoice, string> = {
  moderna: "var(--font-sora), ui-sans-serif, system-ui, sans-serif",
  editorial: "var(--font-editorial), Georgia, serif",
  manuscrita: "var(--font-handwritten), cursive",
  retro: "var(--font-retro), ui-monospace, monospace",
};

// Manuscrita e retrô parecem menores no mesmo tamanho: compensa nos títulos
export const FONT_SCALE: Record<FontChoice, number> = {
  moderna: 1,
  editorial: 1.04,
  manuscrita: 1.35,
  retro: 1.3,
};
