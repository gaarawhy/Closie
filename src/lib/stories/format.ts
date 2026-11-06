// Textos de tempo para a tela ("há 2 h", "expira em 22 h"). Recebem o `now` de quem chama.

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function timeAgo(iso: string, now: number): string {
  // Relógio do aparelho atrasado: nunca "há -5 min"
  const diff = Math.max(0, now - Date.parse(iso));
  if (diff < MIN) return "agora";
  if (diff < HOUR) return `há ${Math.floor(diff / MIN)} min`;
  if (diff < DAY) return `há ${Math.floor(diff / HOUR)} h`;
  const days = Math.floor(diff / DAY);
  return days === 1 ? "ontem" : `há ${days} dias`;
}

export function timeLeft(expiresAt: string, now: number): string {
  const diff = Date.parse(expiresAt) - now;
  if (diff <= 0) return "expirado";
  if (diff < HOUR) return `expira em ${Math.max(1, Math.ceil(diff / MIN))} min`;
  return `expira em ${Math.ceil(diff / HOUR)} h`;
}
