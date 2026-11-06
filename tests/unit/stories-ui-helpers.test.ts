import { describe, expect, it } from "vitest";
import { classifyGesture } from "@/components/stories/gesture";
import { timeAgo, timeLeft } from "@/lib/stories/format";
import { checkStoryFile } from "@/lib/storyMedia";

const NOW = Date.UTC(2026, 10, 5, 12, 0, 0);
const MIN = 60_000;
const H = 60 * MIN;
const iso = (ms: number) => new Date(ms).toISOString();

describe("timeAgo", () => {
  it("agora, minutos, horas, ontem e dias", () => {
    expect(timeAgo(iso(NOW - 30_000), NOW)).toBe("agora");
    expect(timeAgo(iso(NOW - 5 * MIN), NOW)).toBe("há 5 min");
    expect(timeAgo(iso(NOW - 2 * H - 10 * MIN), NOW)).toBe("há 2 h");
    expect(timeAgo(iso(NOW - 25 * H), NOW)).toBe("ontem");
    expect(timeAgo(iso(NOW - 3 * 24 * H), NOW)).toBe("há 3 dias");
    // relógio do aparelho atrasado: nunca "há -5 min"
    expect(timeAgo(iso(NOW + 5 * MIN), NOW)).toBe("agora");
  });
});

describe("timeLeft", () => {
  it("horas para cima, minutos no fim e expirado", () => {
    expect(timeLeft(iso(NOW + 22 * H + 30 * MIN), NOW)).toBe("expira em 23 h");
    expect(timeLeft(iso(NOW + 30 * MIN), NOW)).toBe("expira em 30 min");
    expect(timeLeft(iso(NOW + 20_000), NOW)).toBe("expira em 1 min");
    expect(timeLeft(iso(NOW), NOW)).toBe("expirado");
  });
});

describe("classifyGesture", () => {
  const tap = { dx: 0, dy: 0, durationMs: 80, startX: 300, width: 400, held: false };

  it("toque rápido: direita avança, esquerda (primeiros 30%) volta", () => {
    expect(classifyGesture(tap)).toBe("next_story");
    expect(classifyGesture({ ...tap, startX: 100 })).toBe("prev_story");
  });

  it("segurar só pausa, não navega", () => {
    expect(classifyGesture({ ...tap, durationMs: 600 })).toBe("none");
    expect(classifyGesture({ ...tap, held: true })).toBe("none");
  });

  it("deslizar troca de pessoa ou fecha, mesmo devagar", () => {
    expect(classifyGesture({ ...tap, dx: -120, dy: 10 })).toBe("next_user");
    expect(classifyGesture({ ...tap, dx: 120, dy: -5 })).toBe("prev_user");
    expect(classifyGesture({ ...tap, dx: 20, dy: 150 })).toBe("close");
    expect(classifyGesture({ ...tap, dx: -120, durationMs: 900, held: true })).toBe("next_user");
  });

  it("tremidinha não vira toque e deslizar para cima não faz nada", () => {
    expect(classifyGesture({ ...tap, dx: 20, dy: 8 })).toBe("none");
    expect(classifyGesture({ ...tap, dy: -150 })).toBe("none");
  });
});

describe("checkStoryFile", () => {
  it("aceita foto e vídeo dentro do limite e recusa o resto", () => {
    expect(checkStoryFile({ type: "image/jpeg", size: 3_000_000 })).toEqual({ ok: true, kind: "image" });
    expect(checkStoryFile({ type: "video/mp4", size: 1_500_000 })).toEqual({ ok: true, kind: "video" });
    expect(checkStoryFile({ type: "image/png", size: 16 * 1024 * 1024 })).toMatchObject({ ok: false });
    expect(checkStoryFile({ type: "video/mp4", size: 3 * 1024 * 1024 })).toMatchObject({ ok: false });
    expect(checkStoryFile({ type: "application/pdf", size: 10 })).toEqual({
      ok: false,
      message: "Escolha uma foto ou um vídeo.",
    });
  });
});
