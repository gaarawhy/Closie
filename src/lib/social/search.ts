import { listPeople } from "./directory";
import { isBlockedEitherWay } from "./graph";
import type { Person } from "./types";

// Para comparar: minúsculas, sem acento, sem @ na frente e sem espaços sobrando.
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/^@+/, "")
    .replace(/\s+/g, " ");
}

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

// Pesquisa por @ ou nome. Ordem: @ igual ao termo, @ começando com o termo, nome (ou sobrenome)
// começando com o termo e, por fim, o termo em qualquer lugar. Bloqueados (nos dois sentidos) não aparecem.
export function searchPeople(viewerId: string, query: string, limit = 20): Person[] {
  const term = normalizeSearch(query);
  if (!term) return [];
  const found: { person: Person; rank: number; key: string }[] = [];
  for (const person of listPeople()) {
    if (person.id !== viewerId && isBlockedEitherWay(viewerId, person.id)) continue;
    const username = normalizeSearch(person.username);
    const name = normalizeSearch(person.displayName ?? "");
    const rank =
      username === term
        ? 0
        : username.startsWith(term)
          ? 1
          : name.startsWith(term) || name.split(" ").some((word) => word.startsWith(term))
            ? 2
            : username.includes(term) || name.includes(term)
              ? 3
              : -1;
    if (rank >= 0) found.push({ person, rank, key: username });
  }
  return found
    .sort((a, b) => a.rank - b.rank || compare(a.key, b.key))
    .slice(0, limit)
    .map((item) => item.person);
}
