import type { DoodleKind } from "@/lib/appearance";

// Doodles coloridos com carinha (desenhos próprios da Closie): contorno escuro, cores vivas,
// brilho branco e bochechas — o estilo de adesivo fofo das fotos com "doodles".

const INK = "#1F1F1F";
const LINE = { stroke: INK, strokeWidth: 3.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export const DOODLE_LABEL: Record<DoodleKind, string> = {
  "flor-branca": "Florzinha branca",
  "flor-rosa": "Florzinha rosa",
  "flor-vermelha": "Florzinha vermelha",
  "estrela-sorriso": "Estrela sorrindo",
  "coracao-brilho": "Coração brilhante",
  caracol: "Caracol",
  "nuvem-sorriso": "Nuvem sorrindo",
  "sol-sorriso": "Sol sorrindo",
};

// Carinha: olhos fechados felizes, sorriso e bochechas (opcional: narizinho colorido)
function Face({ x, y, size = 1, nose }: { x: number; y: number; size?: number; nose?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path d="M-8 -2.5q2.6 -3.6 5.2 0M2.8 -2.5q2.6 -3.6 5.2 0" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M-4.2 3.2q4.2 4.2 8.4 0" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <ellipse cx={-9.5} cy={3.5} rx={2.8} ry={1.7} fill="#FF8FB1" opacity={0.8} />
      <ellipse cx={9.5} cy={3.5} rx={2.8} ry={1.7} fill="#FF8FB1" opacity={0.8} />
      {nose && <ellipse cx={0} cy={0.6} rx={2.6} ry={2} fill={nose} stroke={INK} strokeWidth={1.4} />}
    </g>
  );
}

function Flower({ petal, center, nose }: { petal: string; center: string; nose?: string }) {
  return (
    <>
      {[0, 72, 144, 216, 288].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 50 50)`}>
          <ellipse cx="50" cy="26" rx="15" ry="19" fill={petal} {...LINE} />
          <ellipse cx="44.5" cy="19.5" rx="3" ry="6" fill="#FFFFFF" opacity={0.75} />
        </g>
      ))}
      <circle cx="50" cy="50" r="15" fill={center} {...LINE} />
      <Face x={50} y={50} size={0.95} nose={nose} />
    </>
  );
}

function Art({ kind }: { kind: DoodleKind }) {
  switch (kind) {
    case "flor-branca":
      return <Flower petal="#FFFFFF" center="#FFFFFF" nose="#7CC8FF" />;
    case "flor-rosa":
      return <Flower petal="#F7A8E0" center="#FFE066" />;
    case "flor-vermelha":
      return <Flower petal="#FF4B4B" center="#FF8A80" />;
    case "estrela-sorriso":
      return (
        <>
          <path d="M50 6l12.4 26 28.3 3.6-20.8 19.7 5.3 28.1L50 69.6 24.8 83.4l5.3-28.1L9.3 35.6l28.3-3.6z" fill="#FFD43B" {...LINE} />
          <ellipse cx="38" cy="30" rx="3.5" ry="6" transform="rotate(25 38 30)" fill="#FFFFFF" opacity={0.75} />
          <Face x={50} y={52} />
        </>
      );
    case "coracao-brilho":
      return (
        <>
          <path d="M50 88C22 70 8 52 10 34 12 18 30 10 42 18c4 3 6 6 8 10 2-4 4-7 8-10 12-8 30 0 32 16 2 18-12 36-40 54z" fill="#FF7EB9" {...LINE} />
          <ellipse cx="28" cy="32" rx="5" ry="9" transform="rotate(30 28 32)" fill="#FFFFFF" opacity={0.85} />
          <circle cx="36" cy="22" r="2.6" fill="#FFFFFF" opacity={0.85} />
        </>
      );
    case "caracol":
      return (
        <>
          <path d="M8 82c0-12 6-22 16-24 10-2 14 6 14 14l42 2c10 0 14 6 10 12l-74 2c-5 0-8-2-8-6z" fill="#FFD43B" {...LINE} />
          <circle cx="62" cy="52" r="24" fill="#8FD3FF" {...LINE} />
          <path d="M64 54c0-4-6-4-6 0 0 6 10 6 10-1 0-10-16-10-16 1 0 13 22 14 22-2" fill="none" {...LINE} />
          <ellipse cx="52" cy="38" rx="4" ry="7" transform="rotate(-35 52 38)" fill="#FFFFFF" opacity={0.75} />
          <path d="M19 58l-4-14M28 57l2-14" fill="none" {...LINE} />
          <circle cx="15" cy="42" r="3.4" fill={INK} />
          <circle cx="30" cy="41" r="3.4" fill={INK} />
          <Face x={23} y={70} size={0.62} />
        </>
      );
    case "nuvem-sorriso":
      return (
        <>
          <path d="M24 76C9 76 7 55 21 52c0-18 21-24 31-12 6-14 30-12 30 8 15 2 13 28-3 28z" fill="#FFFFFF" {...LINE} />
          <Face x={50} y={60} nose="#FFB3C7" />
        </>
      );
    case "sol-sorriso":
      return (
        <>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <path key={angle} d="M50 6v13" transform={`rotate(${angle} 50 50)`} stroke="#FFA41B" strokeWidth={6} strokeLinecap="round" />
          ))}
          <circle cx="50" cy="50" r="25" fill="#FFD43B" {...LINE} />
          <ellipse cx="40" cy="38" rx="4" ry="7" transform="rotate(35 40 38)" fill="#FFFFFF" opacity={0.75} />
          <Face x={50} y={53} />
        </>
      );
  }
}

export function DoodleArt({ kind, width, height, className }: { kind: DoodleKind; width: number; height: number; className?: string }) {
  return (
    <svg aria-hidden width={width} height={height} viewBox="0 0 100 100" className={className} style={{ overflow: "visible" }}>
      <Art kind={kind} />
    </svg>
  );
}
