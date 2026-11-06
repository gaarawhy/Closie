import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProfileAppearance } from "@/lib/appearance";
import { fullStorage, memoryStorage } from "../helpers/storage";

type Appearance = typeof import("@/lib/appearance");
type Social = typeof import("@/lib/social");
type StoriesDemo = typeof import("@/lib/stories/demo");

let ap: Appearance;
let social: Social;
let storiesDemo: StoriesDemo;

const NOW = Date.UTC(2026, 10, 5, 12, 0, 0);

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", memoryStorage());
  ap = await import("@/lib/appearance");
  social = await import("@/lib/social");
  storiesDemo = await import("@/lib/stories/demo");
});

describe("estilos", () => {
  it("são sete, e cada um muda a composição (momentos, fonte, moldura, textura), não só a cor", () => {
    expect(ap.PROFILE_STYLES).toEqual(["classico", "scrapbook", "y2k", "analog", "magazine", "minimal", "glitch"]);
    const looks = ap.PROFILE_STYLES.map((style) => ap.resolveAppearance(ap.chooseStyle(ap.defaultAppearance(), style)));
    const signatures = new Set(looks.map((look) => `${look.layout}|${look.font}|${look.frame}|${look.texture}`));
    expect(signatures.size).toBe(ap.PROFILE_STYLES.length);
  });

  it("sem personalização é o visual original da Closie", () => {
    expect(ap.resolveAppearance(null)).toMatchObject({ style: "classico", layout: "cartoes", font: "moderna", stickers: [] });
  });

  it("o que a pessoa escolhe por cima do estilo vale; o resto vem do estilo", () => {
    const look = { ...ap.chooseStyle(ap.defaultAppearance(), "analog"), font: "manuscrita" as const };
    expect(ap.resolveAppearance(look)).toMatchObject({ style: "analog", font: "manuscrita", layout: "filme" });
  });

  it("trocar de estilo volta as escolhas para as do novo estilo, mas mantém a foto da capa e os adesivos", () => {
    let look: ProfileAppearance = {
      ...ap.defaultAppearance(),
      font: "retro",
      cover: { kind: "imagem", url: "https://picsum.photos/1200/400", x: 50, y: 30 },
    };
    look = ap.addSticker(look, "estrela");
    const switched = ap.chooseStyle(look, "magazine");
    expect(switched).toMatchObject({ style: "magazine", font: null, cover: { kind: "imagem" } });
    expect(switched.stickers).toHaveLength(1);
    expect(ap.chooseStyle({ ...look, cover: { kind: "cor", color: "#112233" } }, "y2k").cover).toEqual({ kind: "padrao" });
  });
});

describe("adesivos", () => {
  it("entram dentro da capa, movem sem sair das bordas e saem", () => {
    let look = ap.addSticker(ap.defaultAppearance(), "coracao");
    const [sticker] = look.stickers;
    expect(sticker.x).toBeGreaterThanOrEqual(4);
    expect(sticker.x).toBeLessThanOrEqual(96);
    look = ap.moveSticker(look, sticker.id, 150, -20);
    expect(look.stickers[0]).toMatchObject({ x: 96, y: 4 });
    look = ap.removeSticker(look, sticker.id);
    expect(look.stickers).toEqual([]);
  });

  it("no máximo 12, para não poluir o perfil", () => {
    let look = ap.defaultAppearance();
    for (let index = 0; index < 15; index += 1) look = ap.addSticker(look, "brilho");
    expect(look.stickers).toHaveLength(ap.STICKERS_MAX);
  });

  it("tamanho e giro têm limite", () => {
    let look = ap.addSticker(ap.defaultAppearance(), "flor");
    look = ap.updateSticker(look, look.stickers[0].id, { scale: 9, rotate: 200 });
    expect(look.stickers[0]).toMatchObject({ scale: 1.8, rotate: 45 });
  });

  it("ignora adesivo que não existe na biblioteca", () => {
    expect(ap.addSticker(ap.defaultAppearance(), "nao-existe").stickers).toEqual([]);
  });
});

describe("cores e contraste", () => {
  it("escolhe o texto legível sobre o fundo", () => {
    expect(ap.readableTextOn("#FFFFFF")).toBe("#111111");
    expect(ap.readableTextOn("#0B0B12")).toBe("#FFFFFF");
    expect(ap.contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });

  it("cor principal sem contraste com o fundo não vira título ilegível", () => {
    const colors = ap.themeColors({ primary: "#FFFFFF", accent: "#FFFF00", background: "#FFFFFF", decor: "#EEEEEE" });
    expect(ap.contrastRatio(colors.title, "#FFFFFF")).toBeGreaterThanOrEqual(3);
    expect(ap.contrastRatio(colors.accentText, "#FFFFFF")).toBeGreaterThanOrEqual(3);
    expect(ap.contrastRatio(colors.text, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(ap.contrastRatio(colors.onPrimary, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });

  it("todos os estilos prontos têm texto legível", () => {
    for (const style of ap.PROFILE_STYLES) {
      const { palette } = ap.resolveAppearance(ap.chooseStyle(ap.defaultAppearance(), style));
      const colors = ap.themeColors(palette);
      expect(ap.contrastRatio(colors.text, palette.background)).toBeGreaterThanOrEqual(4.5);
      expect(ap.contrastRatio(colors.muted, palette.background)).toBeGreaterThanOrEqual(3);
      expect(ap.contrastRatio(colors.title, palette.background)).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("salvar", () => {
  it("cada pessoa tem a sua; uma não mexe na outra", () => {
    expect(ap.saveAppearance("ana", ap.chooseStyle(ap.defaultAppearance(), "glitch"))).toBe(true);
    expect(ap.loadAppearance("ana")?.style).toBe("glitch");
    expect(ap.loadAppearance("bia")).toBeNull();
  });

  it("dados estranhos no armazenamento viram o padrão, sem quebrar", () => {
    localStorage.setItem(
      "closie:aparencia:v1",
      JSON.stringify({
        ana: {
          style: "inexistente",
          palette: { primary: "vermelho" },
          stickers: [{ kind: "x" }],
          cover: { kind: "imagem", url: "javascript:alert(1)" },
        },
      }),
    );
    expect(ap.loadAppearance("ana")).toMatchObject({ style: "classico", palette: null, stickers: [], cover: { kind: "padrao" } });
  });

  it("armazenamento cheio: avisa que não salvou", () => {
    vi.stubGlobal("localStorage", fullStorage());
    expect(ap.saveAppearance("ana", ap.defaultAppearance())).toBe(false);
  });

  it("voltar ao original apaga a personalização salva", () => {
    ap.saveAppearance("ana", ap.chooseStyle(ap.defaultAppearance(), "y2k"));
    ap.resetAppearance("ana");
    expect(ap.loadAppearance("ana")).toBeNull();
  });
});

describe("perfis de exemplo", () => {
  it("ganham estilos diferentes, sem sobrescrever o que já foi salvo", () => {
    storiesDemo.seedDemoNetwork("eu", NOW);
    ap.saveAppearance("demo-mari", ap.chooseStyle(ap.defaultAppearance(), "minimal"));
    ap.seedDemoAppearances();
    expect(ap.loadAppearance("demo-mari")?.style).toBe("minimal");
    const styles = new Set(["demo-davi", "demo-bela", "demo-jo", "demo-rafa", "demo-lia"].map((id) => ap.loadAppearance(id)?.style));
    expect(styles.size).toBe(5);
    expect(social.getPerson("demo-davi")).not.toBeNull();
  });
});
