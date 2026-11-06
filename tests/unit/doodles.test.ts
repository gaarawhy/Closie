import { describe, expect, it } from "vitest";
import {
  HISTORY_MAX,
  addItem,
  addStroke,
  emptyDoodles,
  fitBox,
  hasChanges,
  removeItem,
  undo,
  updateItem,
  type DoodleItem,
  type Stroke,
} from "@/components/create/doodles/model";

const stroke = (id: string, points: [number, number][] = [[0.1, 0.1], [0.2, 0.2]]): Stroke => ({ id, brush: "caneta", color: "#FF3FA4", size: 0.014, points });
const sticker = (id: string): DoodleItem => ({ id, type: "sticker", kind: "coracao", x: 0.5, y: 0.5, scale: 1, rotate: 0 });

describe("doodles", () => {
  it("cada traço e cada adesivo vira um passo; desfazer volta um passo por vez", () => {
    let state = addStroke(emptyDoodles(), stroke("a"));
    state = addItem(state, sticker("b"));
    expect(state.strokes).toHaveLength(1);
    expect(state.items).toHaveLength(1);
    state = undo(state);
    expect(state.items).toHaveLength(0);
    expect(state.strokes).toHaveLength(1);
    state = undo(state);
    expect(state.strokes).toHaveLength(0);
    expect(undo(state)).toEqual(state);
  });

  it("toque sem nenhum ponto não vira traço", () => {
    expect(addStroke(emptyDoodles(), stroke("a", []))).toEqual(emptyDoodles());
  });

  it("mover, girar e aumentar ficam dentro dos limites", () => {
    const state = updateItem(addItem(emptyDoodles(), sticker("b")), "b", { x: 2, y: -1, scale: 10, rotate: 400 }, { record: true });
    expect(state.items[0]).toMatchObject({ x: 1, y: 0, scale: 4, rotate: 40 });
    expect(updateItem(state, "b", { scale: 0.01, rotate: -200 }, { record: true }).items[0]).toMatchObject({ scale: 0.3, rotate: 160 });
  });

  it("arrastar grava o histórico só no começo do gesto (um desfazer volta tudo)", () => {
    let state = addItem(emptyDoodles(), sticker("b"));
    state = updateItem(state, "b", { x: 0.6 }, { record: true });
    state = updateItem(state, "b", { x: 0.7 }, { record: false });
    state = updateItem(state, "b", { x: 0.8 }, { record: false });
    expect(state.items[0].x).toBe(0.8);
    expect(undo(state).items[0].x).toBe(0.5);
  });

  it("apagar um adesivo e desfazer traz ele de volta", () => {
    let state = addItem(emptyDoodles(), sticker("b"));
    state = removeItem(state, "b");
    expect(state.items).toHaveLength(0);
    expect(undo(state).items).toHaveLength(1);
  });

  it("o histórico guarda no máximo 50 passos", () => {
    let state = emptyDoodles();
    for (let index = 0; index < HISTORY_MAX + 10; index += 1) state = addStroke(state, stroke(`t${index}`));
    expect(state.past).toHaveLength(HISTORY_MAX);
  });

  it("sem nada desenhado não há mudança para salvar", () => {
    expect(hasChanges(emptyDoodles())).toBe(false);
    expect(hasChanges(addStroke(emptyDoodles(), stroke("a")))).toBe(true);
  });

  it("a foto cabe na área da tela sem distorcer", () => {
    expect(fitBox(400, 800, 3 / 4)).toEqual({ width: 400, height: 400 / (3 / 4) });
    expect(fitBox(1000, 500, 3 / 4)).toEqual({ width: 375, height: 500 });
    expect(fitBox(0, 500, 1)).toBeNull();
  });
});
