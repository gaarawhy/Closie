import { describe, expect, it } from "vitest";
import { clockStore } from "@/lib/stories/clock";

describe("relógio compartilhado (useNow)", () => {
  // Regressão: a inscrição era recriada a cada renderização; o React se reinscrevia sempre,
  // o relógio atualizava a hora a cada nova inscrição e a página entrava em laço infinito.
  it("usa sempre a mesma inscrição e o mesmo retrato para um intervalo", () => {
    const a = clockStore(60_000);
    const b = clockStore(60_000);
    expect(a.subscribe).toBe(b.subscribe);
    expect(a.getSnapshot).toBe(b.getSnapshot);
    expect(a.getSnapshot()).toBe(a.getSnapshot());
  });

  it("intervalos diferentes têm relógios separados", () => {
    expect(clockStore(1000)).not.toBe(clockStore(60_000));
  });
});
