import { picsum } from "@/lib/mock";
import { getPerson } from "@/lib/social";
import { addSticker, chooseStyle, defaultAppearance } from "./model";
import { loadAppearance, saveAppearance } from "./storage";
import type { ProfileAppearance } from "./types";

// MODO DEMONSTRAÇÃO: cada perfil de exemplo com um estilo, para mostrar como dois perfis podem
// ser completamente diferentes. Nunca sobrescreve o que já foi salvo.

const withStickers = (look: ProfileAppearance, kinds: string[]) => kinds.reduce(addSticker, look);

const DEMO_LOOKS: Record<string, () => ProfileAppearance> = {
  "demo-mari": () => withStickers(chooseStyle(defaultAppearance(), "scrapbook"), ["fita-listrada", "coracao", "estrela", "onda", "flor"]),
  "demo-davi": () => withStickers(chooseStyle(defaultAppearance(), "analog"), ["rec", "data"]),
  "demo-bela": () => withStickers(chooseStyle(defaultAppearance(), "y2k"), ["brilho", "estrela-cromada", "brilhos", "coracao"]),
  "demo-jo": () => withStickers(chooseStyle(defaultAppearance(), "glitch"), ["cursor", "coracao-pixel", "mais"]),
  "demo-rafa": () => ({
    ...chooseStyle(defaultAppearance(), "magazine"),
    cover: { kind: "imagem", url: picsum("closie-capa-rafa-show", 1200, 500), x: 50, y: 40 },
  }),
  "demo-lia": () => chooseStyle(defaultAppearance(), "minimal"),
};

export function seedDemoAppearances(): number {
  let created = 0;
  for (const [id, make] of Object.entries(DEMO_LOOKS)) {
    if (!getPerson(id) || loadAppearance(id) !== null) continue;
    if (saveAppearance(id, make())) created += 1;
  }
  return created;
}
