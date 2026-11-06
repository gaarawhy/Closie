import { describe, expect, it } from "vitest";
import { checkAvatarFile } from "@/lib/avatar";

describe("checkAvatarFile", () => {
  it("recusa arquivo que não é imagem", () => {
    expect(checkAvatarFile({ type: "application/pdf", size: 1000 })).toBe("Escolha uma imagem (JPG, PNG ou WebP).");
  });

  it("recusa imagem maior que 10 MB", () => {
    expect(checkAvatarFile({ type: "image/jpeg", size: 11 * 1024 * 1024 })).toBe(
      "Essa foto é grande demais. Escolha uma de até 10 MB.",
    );
  });

  it("aceita imagem dentro do limite", () => {
    expect(checkAvatarFile({ type: "image/png", size: 200_000 })).toBeNull();
    expect(checkAvatarFile({ type: "image/webp", size: 10 * 1024 * 1024 })).toBeNull();
  });
});
