import { picsum } from "@/lib/mock";
import { getPerson } from "@/lib/social";
import { addSticker, chooseStyle, defaultAppearance } from "./model";
import { loadAppearance, saveAppearance } from "./storage";
import type { ProfileAppearance } from "./types";

// MODO DEMONSTRAÇÃO: os perfis de exemplo usam os dois estilos (clássico e scrapbook), cada um com
// o seu jeito (cores, capa, adesivos). Nunca sobrescreve o que já foi salvo.

const withStickers = (look: ProfileAppearance, kinds: string[]) => kinds.reduce(addSticker, look);
const scrapbook = () => chooseStyle(defaultAppearance(), "scrapbook");

const DEMO_LOOKS: Record<string, () => ProfileAppearance> = {
  "demo-mari": () => withStickers(scrapbook(), ["fita-listrada", "coracao", "estrela", "onda", "flor"]),
  "demo-davi": () =>
    withStickers({ ...defaultAppearance(), palette: { primary: "#3B3127", accent: "#E07A1F", background: "#F3EEE4", decor: "#9BC1BC" } }, ["camera", "rec", "data"]),
  "demo-bela": () =>
    withStickers(
      {
        ...scrapbook(),
        palette: { primary: "#4A2040", accent: "#E84A8A", background: "#FCEFF3", decor: "#F7C6D9" },
        cover: { kind: "gradiente", gradient: "pessego" },
      },
      ["brilho", "coracao", "brilhos", "xoxo"],
    ),
  "demo-jo": () => withStickers({ ...defaultAppearance(), cover: { kind: "textura", texture: "pontilhado" } }, ["cursor", "coracao-pixel", "mais"]),
  "demo-rafa": () => ({
    ...defaultAppearance(),
    cover: { kind: "imagem", url: picsum("closie-capa-rafa-show", 1200, 500), x: 50, y: 40 },
  }),
  "demo-lia": () => withStickers({ ...scrapbook(), palette: { primary: "#2F2A24", accent: "#5B8C5A", background: "#F6F3EA", decor: "#D9CBA3" } }, ["flor", "lua"]),
};

export function seedDemoAppearances(): number {
  let created = 0;
  for (const [id, make] of Object.entries(DEMO_LOOKS)) {
    if (!getPerson(id) || loadAppearance(id) !== null) continue;
    if (saveAppearance(id, make())) created += 1;
  }
  return created;
}
