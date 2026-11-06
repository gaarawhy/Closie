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
  it("são dois, o clássico (original) e o scrapbook, cada um com a sua composição (não só a cor)", () => {
    expect(ap.PROFILE_STYLES).toEqual(["classico", "scrapbook"]);
    const [classico, scrapbook] = ap.PROFILE_STYLES.map((style) => ap.resolveAppearance(ap.chooseStyle(ap.defaultAppearance(), style)));
    expect(scrapbook).toMatchObject({ style: "scrapbook", layout: "colagem", font: "manuscrita", frame: "polaroid", texture: "papel" });
    expect(`${classico.layout}|${classico.font}|${classico.frame}`).not.toBe(`${scrapbook.layout}|${scrapbook.font}|${scrapbook.frame}`);
  });

  it("sem personalização é o visual original da Closie (clássico, com a capa do estilo)", () => {
    expect(ap.resolveAppearance(null)).toMatchObject({
      style: "classico",
      cover: { kind: "padrao" },
      layout: "cartoes",
      font: "moderna",
      frame: "anel",
      texture: "nenhuma",
      stickers: [],
    });
  });

  it("o que a pessoa escolhe por cima do clássico vale; o resto vem dele", () => {
    const look: ProfileAppearance = { ...ap.defaultAppearance(), font: "manuscrita" };
    expect(ap.resolveAppearance(look)).toMatchObject({ style: "classico", font: "manuscrita", layout: "cartoes" });
  });

  it("trocar de estilo volta as escolhas para as do novo estilo, mas mantém a foto da capa e os adesivos", () => {
    let look: ProfileAppearance = {
      ...ap.defaultAppearance(),
      font: "retro",
      cover: { kind: "imagem", url: "https://picsum.photos/1200/400", x: 50, y: 30 },
    };
    look = ap.addSticker(look, "estrela");
    const switched = ap.chooseStyle(look, "scrapbook");
    expect(switched).toMatchObject({ style: "scrapbook", font: null, cover: { kind: "imagem" } });
    expect(switched.stickers).toHaveLength(1);
    expect(ap.chooseStyle({ ...look, cover: { kind: "cor", color: "#112233" } }, "classico").cover).toEqual({ kind: "padrao" });
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

  it("os doodles coloridos e os rabiscos à mão entram na capa e continuam lá depois de salvar", () => {
    expect(ap.STICKER_CATEGORIES.slice(0, 2).map((category) => category.id)).toEqual(["doodles", "rabiscos"]);
    let look = ap.addSticker(ap.defaultAppearance(), "flor-rosa");
    look = ap.addSticker(look, "dd-misc-30");
    expect(look.stickers.map((sticker) => sticker.kind)).toEqual(["flor-rosa", "dd-misc-30"]);
    ap.saveAppearance("ana", look);
    expect(ap.loadAppearance("ana")?.stickers.map((sticker) => sticker.kind)).toEqual(["flor-rosa", "dd-misc-30"]);
  });
});

describe("paletas prontas", () => {
  it("todas têm texto legível e cores válidas, e cada uma tem um nome", () => {
    expect(ap.PALETTES.length).toBeGreaterThanOrEqual(8);
    expect(new Set(ap.PALETTES.map((item) => item.id)).size).toBe(ap.PALETTES.length);
    for (const { palette, label } of ap.PALETTES) {
      expect(label.length).toBeGreaterThan(0);
      expect(Object.values(palette).every(ap.isHexColor)).toBe(true);
      const colors = ap.themeColors(palette);
      expect(ap.contrastRatio(colors.text, palette.background)).toBeGreaterThanOrEqual(4.5);
      expect(ap.contrastRatio(colors.title, palette.background)).toBeGreaterThanOrEqual(3);
    }
  });

  it("a primeira de cada estilo é a do próprio estilo", () => {
    expect(ap.PALETTES.find((item) => item.id === "classico")?.palette).toEqual(ap.STYLE_PRESETS.classico.palette);
    expect(ap.PALETTES.find((item) => item.id === "kraft")?.palette).toEqual(ap.STYLE_PRESETS.scrapbook.palette);
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

  it("os dois estilos têm texto legível", () => {
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
    expect(ap.saveAppearance("ana", { ...ap.defaultAppearance(), font: "retro" })).toBe(true);
    expect(ap.loadAppearance("ana")?.font).toBe("retro");
    expect(ap.loadAppearance("bia")).toBeNull();
  });

  it("o scrapbook salvo continua scrapbook; modelo que saiu (glitch, Y2K…) vira clássico, mantendo as escolhas", () => {
    localStorage.setItem(
      "closie:aparencia:v1",
      JSON.stringify({
        ana: { ...ap.defaultAppearance(), style: "scrapbook", stickers: [{ id: "a", kind: "coracao", x: 40, y: 30, rotate: 0, scale: 1 }] },
        bia: { ...ap.defaultAppearance(), style: "glitch", font: "retro", layout: "filme" },
      }),
    );
    expect(ap.loadAppearance("ana")).toMatchObject({ style: "scrapbook", cover: { kind: "padrao" } });
    expect(ap.loadAppearance("ana")?.stickers).toHaveLength(1);
    expect(ap.loadAppearance("bia")).toMatchObject({ style: "classico", font: "retro", layout: "filme" });
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
    ap.saveAppearance("ana", { ...ap.defaultAppearance(), font: "editorial" });
    ap.resetAppearance("ana");
    expect(ap.loadAppearance("ana")).toBeNull();
  });
});

describe("perfis de exemplo", () => {
  it("mostram os dois estilos, cada um com o seu jeito, sem sobrescrever o que já foi salvo", () => {
    storiesDemo.seedDemoNetwork("eu", NOW);
    ap.saveAppearance("demo-mari", { ...ap.defaultAppearance(), font: "moderna" });
    ap.seedDemoAppearances();
    expect(ap.loadAppearance("demo-mari")?.font).toBe("moderna");
    const others = ["demo-davi", "demo-bela", "demo-jo", "demo-rafa", "demo-lia"].map((id) => ap.loadAppearance(id));
    expect(new Set(others.map((look) => look?.style))).toEqual(new Set(["classico", "scrapbook"]));
    const signatures = new Set(others.map((look) => JSON.stringify([look?.palette, look?.cover.kind, look?.stickers.map((item) => item.kind)])));
    expect(signatures.size).toBe(5);
    expect(social.getPerson("demo-davi")).not.toBeNull();
  });
});
