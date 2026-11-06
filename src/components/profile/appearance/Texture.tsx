import clsx from "clsx";
import type { CSSProperties } from "react";
import type { TextureId } from "@/lib/appearance";

// Texturas por cima do fundo (papel, grão de filme, pontilhado, grade, linhas de TV, holográfico).
// Camada decorativa: não recebe clique nem aparece para leitor de tela.

const noise = (frequency: number, alpha: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${frequency}' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${alpha} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  )}")`;

export const TEXTURE_STYLE: Record<Exclude<TextureId, "nenhuma">, CSSProperties> = {
  papel: { backgroundImage: noise(0.9, 0.16), opacity: 0.55, mixBlendMode: "multiply" },
  grao: { backgroundImage: noise(1.4, 0.5), opacity: 0.22, mixBlendMode: "multiply" },
  pontilhado: {
    backgroundImage: "radial-gradient(var(--p-border) 1.1px, transparent 1.4px)",
    backgroundSize: "14px 14px",
  },
  grade: {
    backgroundImage: "linear-gradient(var(--p-border) 1px, transparent 1px), linear-gradient(90deg, var(--p-border) 1px, transparent 1px)",
    backgroundSize: "24px 24px",
    opacity: 0.7,
  },
  scanlines: {
    backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px)",
  },
  holografico: {
    backgroundImage:
      "linear-gradient(115deg, rgba(255,79,216,0.16) 0%, rgba(45,226,230,0.14) 30%, rgba(255,240,120,0.12) 55%, rgba(91,43,255,0.14) 80%, rgba(255,79,216,0.12) 100%)",
  },
};

export function TextureLayer({ texture, className }: { texture: TextureId; className?: string }) {
  if (texture === "nenhuma") return null;
  return <div aria-hidden className={clsx("pointer-events-none absolute inset-0", className)} style={TEXTURE_STYLE[texture]} />;
}
