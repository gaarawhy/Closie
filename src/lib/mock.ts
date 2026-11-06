// Dados mock do Closie. Não há backend: tudo aqui é fictício.

export type Visibility = "public" | "friends" | "private";

export const visibilityLabels: Record<Visibility, string> = {
  public: "Público",
  friends: "Só amigos",
  private: "Só eu",
};

export const DEFAULT_VISIBILITY: Visibility = "friends";

export type Photo = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Dump = {
  id: string;
  date: string; // data local AAAA-MM-DD (sem fuso); não use new Date(date) direto
  caption?: string;
  visibility: Visibility;
  photos: Photo[];
};

export type Profile = {
  username: string;
  name: string;
  bio?: string;
  avatar: string;
  visibility: Visibility;
};

export function picsum(seed: string, width = 800, height = 1000) {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

function photo(id: string, seed: string, alt: string, width = 800, height = 1000): Photo {
  return { id, src: picsum(seed, width, height), alt, width, height };
}

// Cria a data à meia-noite local (new Date("AAAA-MM-DD") seria UTC e mostraria o dia anterior em UTC-3).
// Lança erro se a string não estiver no formato AAAA-MM-DD ou se a data não existir (ex.: 2026-02-31).
export function parseDumpDate(date: string): Date {
  const invalid = () => new Error(`Data inválida (esperado AAAA-MM-DD): "${date}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw invalid();
  const [y, m, d] = date.split("-").map(Number);
  const result = new Date(y, m - 1, d);
  if (result.getFullYear() !== y || result.getMonth() !== m - 1 || result.getDate() !== d) {
    throw invalid();
  }
  return result;
}

// Só para exibição (sem esquema); não usar em href
export function displayProfileUrl(username: string) {
  return `closie.co/@${username}`;
}

export const mockProfile: Profile = {
  username: "lua",
  name: "Lua Martins",
  bio: "photo dumps sem filtro ✶",
  avatar: picsum("closie-lua-avatar", 200, 200),
  visibility: DEFAULT_VISIBILITY,
};

export const mockDumps: Dump[] = [
  {
    id: "d1",
    date: "2026-11-01",
    caption: "domingo lento",
    visibility: "friends",
    photos: [
      photo("p1", "closie-1", "Café da manhã na mesa da varanda"),
      photo("p2", "closie-2", "Amigas rindo no sofá"),
      photo("p3", "closie-3", "Pôr do sol visto da janela"),
    ],
  },
  {
    id: "d2",
    date: "2026-11-03",
    caption: "look do dia + festa",
    visibility: "public",
    photos: [
      photo("p4", "closie-4", "Look do dia no espelho"),
      photo("p5", "closie-5", "Luzes da festa desfocadas"),
    ],
  },
];

// @ de contas fictícias que "já existem" (simulação de disponibilidade, sem backend).
// Os @ reservados (closie, admin, suporte…) ficam em RESERVED_USERNAMES, em validation.ts.
export const mockTakenUsernames = ["ana", "bia", "lua"];
