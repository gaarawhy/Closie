// Traduz um toque/arraste no leitor em uma ação. Puro (sem DOM), para dar pra testar.

export type Gesture = "prev_story" | "next_story" | "prev_user" | "next_user" | "close" | "none";

// Segurar mais que isso conta como "pausar", não como toque
export const HOLD_MS = 250;
const SWIPE_PX = 60;
const CLOSE_PX = 90;
// Tremidinha do dedo que ainda vale como toque
const TAP_SLOP_PX = 12;
// Toque nos primeiros 30% da largura volta; o resto avança
const BACK_ZONE = 0.3;

export function classifyGesture(input: {
  dx: number;
  dy: number;
  durationMs: number;
  startX: number;
  width: number;
  held: boolean;
}): Gesture {
  const { dx, dy, durationMs, startX, width, held } = input;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (dy > CLOSE_PX && dy > ax) return "close";
  if (ax > SWIPE_PX && ax > ay) return dx < 0 ? "next_user" : "prev_user";
  if (held || durationMs >= HOLD_MS) return "none";
  if (ax > TAP_SLOP_PX || ay > TAP_SLOP_PX) return "none";
  return startX < width * BACK_ZONE ? "prev_story" : "next_story";
}
