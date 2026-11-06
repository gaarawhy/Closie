import { sanitizeAppearance } from "./model";
import type { ProfileAppearance } from "./types";

// Persistência temporária da personalização (localStorage), uma por pessoa. Para usar uma API,
// troque este arquivo mantendo as assinaturas.

const KEY = "closie:aparencia:v1";
const CHANGE_EVENT = "closie:aparencia-change";

// Cópia em memória para quando o localStorage estiver bloqueado (vale só nesta visita).
let memory: string | null = null;

function read(): string | null {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function loadAll(): Record<string, unknown> {
  try {
    const data: unknown = JSON.parse(read() ?? "{}");
    return typeof data === "object" && data !== null && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// Grava tudo. Armazenamento cheio: devolve false e não muda nada (nem a memória).
function write(all: Record<string, unknown>): boolean {
  const value = JSON.stringify(all);
  try {
    localStorage.setItem(KEY, value);
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") return false;
  }
  memory = value;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
  return true;
}

// A personalização salva da pessoa, ou null (nunca personalizou: visual original).
export function loadAppearance(userId: string): ProfileAppearance | null {
  const raw = loadAll()[userId];
  return raw === undefined ? null : sanitizeAppearance(raw);
}

export function saveAppearance(userId: string, look: ProfileAppearance): boolean {
  return write({ ...loadAll(), [userId]: look });
}

// Volta ao visual original (apaga a personalização salva).
export function resetAppearance(userId: string): boolean {
  const all = loadAll();
  delete all[userId];
  return write(all);
}

// Para o useSyncExternalStore: muda sempre que alguém salva.
export function appearanceSnapshot(): string {
  return read() ?? "";
}

export function subscribeAppearance(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
