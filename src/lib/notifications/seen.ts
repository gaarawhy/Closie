// Quando cada pessoa abriu as notificações pela última vez (decide a bolinha vermelha do sininho).
// Persistência temporária no localStorage; com backend, vira um campo do perfil.

const KEY = "closie:notificacoes:v1";
const CHANGE_EVENT = "closie:notificacoes-change";

// Cópia em memória para quando o localStorage estiver bloqueado (vale só nesta visita).
let memory: string | null = null;

function read(): string | null {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function load(): Record<string, string> {
  try {
    const data: unknown = JSON.parse(read() ?? "{}");
    if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
    return Object.fromEntries(
      Object.entries(data).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch {
    return {};
  }
}

export function getLastSeen(userId: string): string | null {
  return load()[userId] ?? null;
}

export function markNotificationsSeen(userId: string, now = Date.now()): void {
  const value = JSON.stringify({ ...load(), [userId]: new Date(now).toISOString() });
  memory = value;
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // Sem localStorage: fica só a cópia em memória.
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Para o useSyncExternalStore: muda sempre que alguém marca as notificações como vistas.
export function seenSnapshot(): string {
  return read() ?? "";
}

export function subscribeSeen(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
