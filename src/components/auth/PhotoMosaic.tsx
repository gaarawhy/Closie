import clsx from "clsx";
import Image from "next/image";
import { picsum } from "@/lib/mock";

// Alturas das fotos (para 236px de largura), embaralhadas para parecer um mural.
const HEIGHTS = [320, 420, 280, 360, 300, 400, 260, 340];
// Sobra foto para telas altas; as que ficam fora da tela não carregam (next/image é lazy)
const PER_COLUMN = 6;
// Cada coluna começa numa altura diferente (efeito escada do mural)
const COLUMNS = [
  { offset: "-mt-24", show: "flex" },
  { offset: "-mt-6", show: "flex" },
  { offset: "-mt-40", show: "flex" },
  { offset: "-mt-14", show: "flex" },
  { offset: "-mt-32", show: "hidden md:flex" },
  { offset: "mt-0", show: "hidden lg:flex" },
  { offset: "-mt-20", show: "hidden xl:flex" },
];

// Fotos da campanha (geradas no Google Flow), em public/mural. Enquanto não chegam as 12, cada
// uma entra num dos lugares mais vistos do mural (o resto segue com as fotos de exemplo); com as
// 12, o mural inteiro passa a ser delas, espalhadas.
const CAMPAIGN = ["/mural/mural-01.jpg"];
const FULL_SET = 12;
// Posições (coluna × 6 + linha) que aparecem primeiro, das colunas do meio para as pontas
const FEATURED = [7, 12, 1, 19, 9, 14, 3, 21, 25, 32, 37, 27];

function campaignPhoto(index: number): string | null {
  if (CAMPAIGN.length >= FULL_SET) return CAMPAIGN[(index * 5) % CAMPAIGN.length];
  const slot = FEATURED.indexOf(index);
  return slot >= 0 && slot < CAMPAIGN.length ? CAMPAIGN[slot] : null;
}

// Mural de fotos escurecido atrás do cartão, no clima do feed do Pinterest.
// Puramente decorativo e só do tablet pra cima (no celular o cartão ocupa a tela toda).
export function PhotoMosaic() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 hidden overflow-hidden bg-closie-text sm:block">
      <div className="flex gap-4 px-4">
        {COLUMNS.map(({ offset, show }, column) => (
          <div key={column} className={clsx("min-w-0 flex-1 flex-col gap-4", offset, show)}>
            {Array.from({ length: PER_COLUMN }, (_, row) => {
              const index = column * PER_COLUMN + row;
              const height = HEIGHTS[(column * 3 + row * 5) % HEIGHTS.length];
              return (
                <Image
                  key={index}
                  src={campaignPhoto(index) ?? picsum(`closie-mural-${index}`, 236, height)}
                  alt=""
                  width={236}
                  height={height}
                  // Proporção fixa do lugar no mural: a foto se ajusta (recorta) sem quebrar o ritmo
                  style={{ aspectRatio: `236 / ${height}` }}
                  className="w-full rounded-2xl bg-closie-muted object-cover"
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
}
