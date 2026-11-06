import { describe, expect, it } from "vitest";
import { slideIndexFromScroll } from "@/components/ui/carousel";

describe("carrossel do álbum", () => {
  it("acha a foto pelo quanto rolou para o lado, sem passar das pontas", () => {
    expect(slideIndexFromScroll(0, 400, 3)).toBe(0);
    expect(slideIndexFromScroll(390, 400, 3)).toBe(1);
    expect(slideIndexFromScroll(610, 400, 3)).toBe(2);
    expect(slideIndexFromScroll(5000, 400, 3)).toBe(2);
    expect(slideIndexFromScroll(-20, 400, 3)).toBe(0);
  });

  it("sem largura (ainda não desenhado) fica na primeira", () => {
    expect(slideIndexFromScroll(100, 0, 3)).toBe(0);
  });
});
