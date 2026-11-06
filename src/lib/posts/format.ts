// Datas dos momentos, em português, no fuso de quem está vendo.

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// "12 de outubro"; com o ano quando não é o ano atual ("3 de dezembro de 2025").
export function momentDate(iso: string, now: number): string {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString(
    "pt-BR",
    sameYear ? { day: "numeric", month: "long" } : { day: "numeric", month: "long", year: "numeric" },
  );
}

// Agrupa por mês (do mais novo para o mais antigo): "Este mês", "Outubro", "Outubro de 2025".
export function groupByMonth<T extends { createdAt: string }>(items: T[], now: number): { key: string; label: string; items: T[] }[] {
  const today = new Date(now);
  const groups = new Map<string, { key: string; label: string; items: T[] }>();
  const sorted = [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  for (const item of sorted) {
    const date = new Date(item.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    let group = groups.get(key);
    if (!group) {
      const sameYear = date.getFullYear() === today.getFullYear();
      const month = capitalize(date.toLocaleDateString("pt-BR", { month: "long" }));
      const label =
        sameYear && date.getMonth() === today.getMonth() ? "Este mês" : sameYear ? month : `${month} de ${date.getFullYear()}`;
      group = { key, label, items: [] };
      groups.set(key, group);
    }
    group.items.push(item);
  }
  return [...groups.values()];
}
