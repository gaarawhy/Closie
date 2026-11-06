import { describe, expect, it } from "vitest";
import { groupByMonth, momentDate } from "@/lib/posts/format";
import { checkPostFiles } from "@/lib/postMedia";

const NOW = Date.UTC(2026, 10, 20, 12, 0, 0); // 20 de novembro de 2026
const iso = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day, 12)).toISOString();

describe("datas dos momentos", () => {
  it("dia e mês; o ano só quando não é o atual", () => {
    expect(momentDate(iso(2026, 9, 12), NOW)).toBe("12 de outubro");
    expect(momentDate(iso(2025, 11, 3), NOW)).toBe("3 de dezembro de 2025");
  });

  it("agrupa por mês, do mais novo para o mais antigo, com 'Este mês' no atual", () => {
    const posts = [
      { id: "a", createdAt: iso(2026, 10, 18) },
      { id: "b", createdAt: iso(2026, 10, 2) },
      { id: "c", createdAt: iso(2026, 9, 30) },
      { id: "d", createdAt: iso(2025, 9, 1) },
    ];
    expect(groupByMonth(posts, NOW).map((group) => [group.label, group.items.map((item) => item.id)])).toEqual([
      ["Este mês", ["a", "b"]],
      ["Outubro", ["c"]],
      ["Outubro de 2025", ["d"]],
    ]);
  });
});

describe("fotos do novo momento", () => {
  const foto = { type: "image/jpeg", size: 2 * 1024 * 1024 };

  it("aceita fotos dentro dos limites", () => {
    expect(checkPostFiles([foto, foto], 0)).toBeNull();
  });

  it("recusa o que não é foto, foto grande demais e mais de 10 no total", () => {
    expect(checkPostFiles([{ type: "video/mp4", size: 1000 }], 0)).toBe("Um momento junta só fotos.");
    expect(checkPostFiles([{ type: "image/png", size: 16 * 1024 * 1024 }], 0)).toBe("Cada foto pode ter até 15 MB.");
    expect(checkPostFiles([foto, foto], 9)).toBe("Um momento tem até 10 fotos.");
  });
});
