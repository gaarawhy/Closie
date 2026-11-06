// Regras do editor de Doodles (puras, testadas): traços de caneta, adesivos e textos por cima da
// foto, com histórico para desfazer. Posições e tamanhos são frações da foto (0–1), então o mesmo
// desenho sai igual na tela e na imagem final, em qualquer resolução.

export type Point = [x: number, y: number];
export type BrushKind = "caneta" | "neon" | "marcador" | "borracha";

export type Stroke = {
  id: string;
  brush: BrushKind;
  color: string;
  // Grossura como fração da largura da foto
  size: number;
  points: Point[];
};

type Placed = { id: string; x: number; y: number; scale: number; rotate: number };
export type DoodleItem =
  | (Placed & { type: "sticker"; kind: string })
  | (Placed & { type: "text"; text: string; color: string; font: "manuscrita" | "classica"; outline: boolean });

type Snapshot = { strokes: Stroke[]; items: DoodleItem[] };
export type DoodleState = Snapshot & { past: Snapshot[] };

export const HISTORY_MAX = 50;
const SCALE_MIN = 0.3;
const SCALE_MAX = 4;

export const emptyDoodles = (): DoodleState => ({ strokes: [], items: [], past: [] });

const remember = (state: DoodleState): Snapshot[] => [...state.past, { strokes: state.strokes, items: state.items }].slice(-HISTORY_MAX);

export function addStroke(state: DoodleState, stroke: Stroke): DoodleState {
  if (stroke.points.length === 0) return state;
  return { ...state, past: remember(state), strokes: [...state.strokes, stroke] };
}

export function addItem(state: DoodleState, item: DoodleItem): DoodleState {
  return { ...state, past: remember(state), items: [...state.items, clampItem(item)] };
}

// `record`: grava um passo no histórico. Num arraste, só o começo grava (um desfazer volta tudo).
export function updateItem(state: DoodleState, id: string, patch: Partial<Placed> & { text?: string }, { record }: { record: boolean }): DoodleState {
  if (!state.items.some((item) => item.id === id)) return state;
  return {
    ...state,
    past: record ? remember(state) : state.past,
    items: state.items.map((item) => (item.id === id ? clampItem({ ...item, ...patch } as DoodleItem) : item)),
  };
}

export function removeItem(state: DoodleState, id: string): DoodleState {
  if (!state.items.some((item) => item.id === id)) return state;
  return { ...state, past: remember(state), items: state.items.filter((item) => item.id !== id) };
}

export function undo(state: DoodleState): DoodleState {
  const previous = state.past.at(-1);
  if (!previous) return state;
  return { ...previous, past: state.past.slice(0, -1) };
}

export const hasChanges = (state: DoodleState) => state.strokes.length > 0 || state.items.length > 0;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
// Giro sempre entre -180° e 180°
const normalizeAngle = (degrees: number) => ((((degrees + 180) % 360) + 360) % 360) - 180;

function clampItem(item: DoodleItem): DoodleItem {
  return {
    ...item,
    x: clamp(item.x, 0, 1),
    y: clamp(item.y, 0, 1),
    scale: clamp(item.scale, SCALE_MIN, SCALE_MAX),
    rotate: normalizeAngle(item.rotate),
  };
}

// Maior caixa com a proporção da foto que cabe na área da tela (sem distorcer)
export function fitBox(areaWidth: number, areaHeight: number, aspect: number): { width: number; height: number } | null {
  if (areaWidth <= 0 || areaHeight <= 0 || aspect <= 0) return null;
  return areaWidth / areaHeight > aspect ? { width: areaHeight * aspect, height: areaHeight } : { width: areaWidth, height: areaWidth / aspect };
}
