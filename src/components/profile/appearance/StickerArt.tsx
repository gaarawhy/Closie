import { useId, type CSSProperties, type ReactNode } from "react";
import type { StickerKind } from "@/lib/appearance";

// Biblioteca de adesivos (desenhos próprios em SVG). As cores vêm do perfil (--p-*), então
// o mesmo adesivo combina com qualquer estilo.

const C = {
  accent: "var(--p-accent)",
  onAccent: "var(--p-on-accent)",
  decor: "var(--p-decor)",
  onDecor: "var(--p-on-decor)",
  text: "var(--p-text)",
  bg: "var(--p-bg)",
  primary: "var(--p-primary)",
};

export const STICKER_LABEL: Record<StickerKind, string> = {
  brilho: "Brilho",
  estrela: "Estrela",
  coracao: "Coração",
  sorriso: "Carinha sorrindo",
  flor: "Flor",
  raio: "Raio",
  lua: "Lua",
  brilhos: "Brilhinhos",
  oi: "Adesivo oi!",
  amor: "Adesivo amor",
  xoxo: "Adesivo xoxo",
  vibes: "Adesivo vibes",
  ano: "Selo do ano",
  uau: "Adesivo uau!",
  selo: "Selo postal",
  onda: "Rabisco de onda",
  espiral: "Espiral",
  seta: "Seta rabiscada",
  circulo: "Círculo rabiscado",
  sublinhado: "Sublinhado",
  coroa: "Coroa",
  "fita-listrada": "Fita listrada",
  "fita-poa": "Fita de poá",
  "fita-lisa": "Fita lisa",
  "fita-xadrez": "Fita xadrez",
  filme: "Pedaço de filme",
  camera: "Câmera",
  rec: "Gravando",
  data: "Data de câmera",
  diafragma: "Diafragma",
  cantoneiras: "Cantoneiras de foto",
  "coracao-pixel": "Coração de pixel",
  cursor: "Cursor",
  "estrela-cromada": "Estrela cromada",
  pontos: "Pontinhos",
  mais: "Sinais de mais",
  "codigo-barras": "Código de barras",
};

// Tamanho de cada um com escala 1 (largura × altura em px)
const SIZE: Partial<Record<StickerKind, [number, number]>> = {
  oi: [84, 44],
  amor: [96, 42],
  xoxo: [88, 42],
  vibes: [96, 40],
  onda: [84, 30],
  sublinhado: [84, 26],
  "fita-listrada": [104, 30],
  "fita-poa": [104, 30],
  "fita-lisa": [104, 30],
  "fita-xadrez": [104, 30],
  filme: [100, 44],
  rec: [80, 30],
  data: [104, 30],
  "codigo-barras": [76, 34],
};

export const stickerSize = (kind: StickerKind): [number, number] => SIZE[kind] ?? [58, 58];

// Estrela de quatro pontas (lados côncavos), centrada em cx/cy
const sparkle = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;

const TAPE = "M4 3L100 1L98 8L101 15L98 22L100 29L4 28L6 21L3 14L6 7Z";

const PIXEL_HEART = [
  "011000110",
  "111101111",
  "111111111",
  "111111111",
  "011111110",
  "001111100",
  "000111000",
  "000010000",
];

const font = (family: string, size: number, weight = 800): CSSProperties => ({
  fontFamily: family,
  fontSize: size,
  fontWeight: weight,
});

const SANS = "var(--font-sora), sans-serif";
const RETRO = "var(--font-retro), monospace";

export function StickerArt({ kind, today, className }: { kind: StickerKind; today: { year: string; stamp: string }; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const [width, height] = stickerSize(kind);
  const box = (viewBox: string, children: ReactNode) => (
    <svg aria-hidden width={width} height={height} viewBox={viewBox} className={className} style={{ overflow: "visible" }}>
      {children}
    </svg>
  );
  const ink = { stroke: C.text, strokeWidth: 2.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const doodle = { fill: "none", stroke: C.accent, strokeWidth: 3.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (kind) {
    case "brilho":
      return box("0 0 64 64", <path d={sparkle(32, 32, 28)} style={{ fill: C.accent }} />);
    case "estrela":
      return box(
        "0 0 64 64",
        <path d="M32 5l7.9 16.6 18.1 2.3-13.3 12.6 3.4 18-16.1-8.8-16.1 8.8 3.4-18L6 23.9l18.1-2.3z" style={{ fill: C.decor }} {...ink} />,
      );
    case "coracao":
      return box(
        "0 0 64 64",
        <path d="M32 56S6 40 6 22.5C6 14 12.5 8 20 8c5.2 0 9.4 2.8 12 7 2.6-4.2 6.8-7 12-7 7.5 0 14 6 14 14.5C58 40 32 56 32 56z" style={{ fill: C.accent }} {...ink} />,
      );
    case "sorriso":
      return box(
        "0 0 64 64",
        <>
          <circle cx="32" cy="32" r="26" style={{ fill: C.decor }} {...ink} />
          <circle cx="24" cy="27" r="3" style={{ fill: C.text }} />
          <circle cx="40" cy="27" r="3" style={{ fill: C.text }} />
          <path d="M21 37c3 6 7.5 9 11 9s8-3 11-9" fill="none" {...ink} strokeWidth={3} />
        </>,
      );
    case "flor":
      return box(
        "0 0 64 64",
        <>
          {[
            [32, 19],
            [44.4, 28],
            [39.6, 42.5],
            [24.4, 42.5],
            [19.6, 28],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="11" style={{ fill: C.accent }} {...ink} strokeWidth={2} />
          ))}
          <circle cx="32" cy="32" r="8" style={{ fill: C.decor }} {...ink} strokeWidth={2} />
        </>,
      );
    case "raio":
      return box("0 0 64 64", <path d="M37 4L14 36h14l-6 24 25-34H33l4-22z" style={{ fill: C.decor }} {...ink} />);
    case "lua":
      return box("0 0 64 64", <path d="M40 7a25 25 0 1 0 17 38A21 21 0 1 1 40 7z" style={{ fill: C.decor }} {...ink} />);
    case "brilhos":
      return box(
        "0 0 64 64",
        <>
          <path d={sparkle(24, 32, 20)} style={{ fill: C.accent }} />
          <path d={sparkle(48, 14, 10)} style={{ fill: C.decor }} />
          <path d={sparkle(50, 46, 8)} style={{ fill: C.primary }} />
        </>,
      );
    case "oi":
      return box(
        "0 0 84 44",
        <>
          <rect x="2" y="2" width="80" height="40" rx="20" style={{ fill: C.accent }} {...ink} />
          <text x="42" y="29" textAnchor="middle" style={{ ...font(SANS, 20), fill: C.onAccent }}>
            oi!
          </text>
        </>,
      );
    case "amor":
      return box(
        "0 0 96 42",
        <>
          <rect x="2" y="2" width="92" height="38" rx="8" style={{ fill: C.bg, stroke: C.accent, strokeWidth: 3 }} />
          <text x="48" y="27" textAnchor="middle" style={{ ...font(SANS, 17), fill: C.accent }}>
            amor ♥
          </text>
        </>,
      );
    case "xoxo":
      return box(
        "0 0 88 42",
        <>
          <rect x="2" y="2" width="84" height="38" rx="19" style={{ fill: C.decor }} {...ink} />
          <text x="44" y="27" textAnchor="middle" style={{ ...font(SANS, 18), fill: C.onDecor }}>
            xoxo
          </text>
        </>,
      );
    case "vibes":
      return box(
        "0 0 96 40",
        <>
          <rect x="2" y="2" width="92" height="36" rx="6" style={{ fill: C.text }} />
          <text x="48" y="26" textAnchor="middle" style={{ ...font(SANS, 16), fill: C.bg, letterSpacing: 3 }}>
            VIBES
          </text>
        </>,
      );
    case "ano":
      return box(
        "0 0 64 64",
        <>
          <circle cx="32" cy="32" r="28" style={{ fill: C.accent }} {...ink} />
          <circle cx="32" cy="32" r="22" fill="none" style={{ stroke: C.onAccent }} strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="32" y="37" textAnchor="middle" style={{ ...font(SANS, 14), fill: C.onAccent }}>
            {today.year}
          </text>
        </>,
      );
    case "uau":
      return box(
        "0 0 64 64",
        <>
          <path
            d="M32 2l6 10 11-5-1 12 12 1-6 10 8 8-11 4 2 12-11-4-5 11-6-10-10 6v-12L5 46l7-9-8-9 11-3-2-12 11 3z"
            style={{ fill: C.decor }}
            {...ink}
            strokeWidth={2}
          />
          <text x="32" y="37" textAnchor="middle" style={{ ...font(SANS, 13), fill: C.onDecor }}>
            UAU!
          </text>
        </>,
      );
    case "selo":
      return box(
        "0 0 64 64",
        <>
          <rect x="6" y="6" width="52" height="52" style={{ fill: C.decor, stroke: C.bg }} strokeWidth="6" strokeDasharray="2 4" />
          <rect x="12" y="12" width="40" height="40" fill="none" style={{ stroke: C.text }} strokeWidth="1.5" />
          <path d="M32 44s-11-7-11-14c0-3.5 2.6-6 5.6-6 2.3 0 4.2 1.3 5.4 3 1.2-1.7 3.1-3 5.4-3 3 0 5.6 2.5 5.6 6 0 7-11 14-11 14z" style={{ fill: C.accent }} />
        </>,
      );
    case "onda":
      return box("0 0 84 30", <path d="M4 15c8-10 14-10 20 0s12 10 18 0 12-10 18 0 12 10 20 0" {...doodle} />);
    case "espiral":
      return box(
        "0 0 64 64",
        <path d="M33 33c0-3 4-3.5 4.5-.5s-3 6.5-7 5.5-6-6.5-2-11 12-3.5 13.5 3-3 13-11 13.5-15-6-13-14 9-15 18-13 15 9 13 18" {...doodle} />,
      );
    case "seta":
      return box(
        "0 0 64 64",
        <>
          <path d="M8 50c8-22 26-32 44-27" {...doodle} style={{ stroke: C.text }} />
          <path d="M43 13l10 10-13 4" {...doodle} style={{ stroke: C.text }} />
        </>,
      );
    case "circulo":
      return box("0 0 64 64", <path d="M12 30C12 16 26 8 36 9s22 9 20 23-16 23-30 21S6 42 12 25c3-8 11-12 22-11" {...doodle} />);
    case "sublinhado":
      return box(
        "0 0 84 26",
        <>
          <path d="M4 9c22-4 48-5 76-2" {...doodle} />
          <path d="M12 18c18-3 40-4 62-1" {...doodle} />
        </>,
      );
    case "coroa":
      return box("0 0 64 64", <path d="M10 48L6 18l14 12 12-20 12 20 14-12-4 30z" style={{ fill: C.decor }} {...ink} />);
    case "fita-listrada":
    case "fita-poa":
    case "fita-lisa":
    case "fita-xadrez": {
      const pattern = `${uid}-tape`;
      return box(
        "0 0 104 30",
        <>
          <defs>
            {kind === "fita-listrada" && (
              <pattern id={pattern} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="10" height="10" style={{ fill: C.decor }} />
                <rect width="4" height="10" style={{ fill: C.accent }} opacity="0.55" />
              </pattern>
            )}
            {kind === "fita-poa" && (
              <pattern id={pattern} width="9" height="9" patternUnits="userSpaceOnUse">
                <rect width="9" height="9" style={{ fill: C.decor }} />
                <circle cx="4.5" cy="4.5" r="1.8" style={{ fill: C.bg }} />
              </pattern>
            )}
            {kind === "fita-xadrez" && (
              <pattern id={pattern} width="12" height="12" patternUnits="userSpaceOnUse">
                <rect width="12" height="12" style={{ fill: C.bg }} />
                <rect width="6" height="12" style={{ fill: C.accent }} opacity="0.45" />
                <rect width="12" height="6" style={{ fill: C.accent }} opacity="0.45" />
              </pattern>
            )}
          </defs>
          <path d={TAPE} style={{ fill: kind === "fita-lisa" ? C.accent : `url(#${pattern})` }} opacity="0.85" />
        </>,
      );
    }
    case "filme":
      return box(
        "0 0 100 44",
        <>
          <rect width="100" height="44" rx="3" fill="#17130F" />
          {Array.from({ length: 9 }, (_, index) => (
            <g key={index}>
              <rect x={5 + index * 10.5} y="3" width="5" height="4" rx="1" fill="#F3EEE4" />
              <rect x={5 + index * 10.5} y="37" width="5" height="4" rx="1" fill="#F3EEE4" />
            </g>
          ))}
          <rect x="6" y="10" width="40" height="24" rx="1.5" style={{ fill: C.decor }} opacity="0.9" />
          <rect x="54" y="10" width="40" height="24" rx="1.5" style={{ fill: C.accent }} opacity="0.85" />
        </>,
      );
    case "camera":
      return box(
        "0 0 64 64",
        <>
          <rect x="20" y="10" width="18" height="10" rx="3" style={{ fill: C.text }} />
          <rect x="6" y="18" width="52" height="36" rx="7" style={{ fill: C.text }} />
          <circle cx="32" cy="36" r="12" style={{ fill: C.bg, stroke: C.text }} strokeWidth="2" />
          <circle cx="32" cy="36" r="6.5" style={{ fill: C.accent }} />
          <rect x="46" y="23" width="7" height="4" rx="1.5" style={{ fill: C.decor }} />
        </>,
      );
    case "rec":
      return box(
        "0 0 80 30",
        <>
          <rect width="80" height="30" rx="7" fill="rgba(0,0,0,0.7)" />
          <circle cx="15" cy="15" r="6" fill="#FF3B30" />
          <text x="27" y="21" style={{ ...font(RETRO, 20, 400), fill: "#FFFFFF" }}>
            REC
          </text>
        </>,
      );
    case "data":
      return box(
        "0 0 104 30",
        <text x="4" y="23" style={{ ...font(RETRO, 25, 400), fill: "#FF8A1F", letterSpacing: 1 }}>
          {today.stamp}
        </text>,
      );
    case "diafragma":
      return box(
        "0 0 64 64",
        <>
          <circle cx="32" cy="32" r="26" style={{ fill: C.decor }} {...ink} />
          <path d="M32 6l9 18M58 32l-18 9M32 58l-9-18M6 32l18-9M51 13L37 25M51 51L39 37M13 51l14-12M13 13l12 14" {...ink} fill="none" strokeWidth={2} />
          <circle cx="32" cy="32" r="8" style={{ fill: C.text }} />
        </>,
      );
    case "cantoneiras":
      return box(
        "0 0 64 64",
        <>
          <path d="M4 4h18L4 22z" style={{ fill: C.text }} />
          <path d="M60 4H42l18 18z" style={{ fill: C.text }} />
          <path d="M4 60h18L4 42z" style={{ fill: C.text }} />
          <path d="M60 60H42l18-18z" style={{ fill: C.text }} />
        </>,
      );
    case "coracao-pixel":
      return box(
        "0 0 9 8",
        <g style={{ fill: C.accent }} shapeRendering="crispEdges">
          {PIXEL_HEART.flatMap((row, y) =>
            [...row].map((cell, x) => (cell === "1" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null)),
          )}
        </g>,
      );
    case "cursor":
      return box("0 0 64 64", <path d="M14 4v44l11-10 8 19 8-3.4-8-18.6h16z" fill="#FFFFFF" stroke="#111111" strokeWidth="3" strokeLinejoin="round" />);
    case "estrela-cromada": {
      const gradient = `${uid}-chrome`;
      return box(
        "0 0 64 64",
        <>
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.35" stopColor="#B8C1CC" />
              <stop offset="0.55" stopColor="#FFFFFF" />
              <stop offset="0.8" stopColor="#8D97A5" />
              <stop offset="1" stopColor="#E9EDF2" />
            </linearGradient>
          </defs>
          <path d={sparkle(32, 32, 29)} fill={`url(#${gradient})`} stroke="#7D8794" strokeWidth="1.5" />
        </>,
      );
    }
    case "pontos":
      return box(
        "0 0 64 64",
        <g style={{ fill: C.decor }}>
          {[12, 32, 52].flatMap((x) => [12, 32, 52].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" />))}
        </g>,
      );
    case "mais":
      return box(
        "0 0 64 64",
        <g style={{ stroke: C.accent }} strokeWidth="4" strokeLinecap="round">
          <path d="M16 8v16M8 16h16" />
          <path d="M44 20v22M33 31h22" />
          <path d="M22 44v12M16 50h12" />
        </g>,
      );
    case "codigo-barras":
      return box(
        "0 0 76 34",
        <g style={{ fill: C.text }}>
          {[2, 3, 1, 2, 1, 3, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 2].reduce<{ x: number; bars: ReactNode[] }>(
            (acc, w, index) => ({
              x: acc.x + w * 1.6 + 2,
              bars: index % 2 === 0 ? [...acc.bars, <rect key={index} x={acc.x} y="2" width={w * 1.6} height="30" />] : acc.bars,
            }),
            { x: 2, bars: [] },
          ).bars}
        </g>,
      );
  }
}
