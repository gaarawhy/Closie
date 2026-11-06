import type { Block, Follow, Mute, Person, SocialState, UserReport } from "./types";

// Persistência temporária das relações (localStorage). Para usar uma API, troque este arquivo
// mantendo as assinaturas; graph.ts e directory.ts só falam com ele.

const KEY = "closie:social:v1";
const CHANGE_EVENT = "closie:social-change";

// Cópia em memória para quando o localStorage estiver bloqueado (vale só nesta visita).
let memory: string | null = null;

function read(): string | null {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

const emptyState = (): SocialState => ({ people: [], follows: [], closeFriends: {}, blocks: [], mutes: [], reports: [] });

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isString = (value: unknown): value is string => typeof value === "string";

function isPerson(value: unknown): value is Person {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.username) &&
    (value.privacy === "public" || value.privacy === "private")
  );
}

function isFollow(value: unknown): value is Follow {
  return (
    isRecord(value) &&
    isString(value.followerId) &&
    isString(value.followingId) &&
    (value.status === "pending" || value.status === "approved")
  );
}

const isBlock = (value: unknown): value is Block =>
  isRecord(value) && isString(value.blockerId) && isString(value.blockedId);

const isMute = (value: unknown): value is Mute => isRecord(value) && isString(value.userId) && isString(value.mutedId);

const isReport = (value: unknown): value is UserReport =>
  isRecord(value) && isString(value.reporterId) && isString(value.targetId) && isString(value.reason);

// Lê e confere o formato; qualquer coisa estranha (JSON quebrado, campos faltando) vira vazio.
export function loadSocial(): SocialState {
  try {
    const raw = read();
    if (!raw) return emptyState();
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return emptyState();
    const closeFriends: Record<string, string[]> = {};
    if (isRecord(data.closeFriends)) {
      for (const [owner, ids] of Object.entries(data.closeFriends)) {
        if (Array.isArray(ids)) closeFriends[owner] = ids.filter(isString);
      }
    }
    return {
      people: Array.isArray(data.people) ? data.people.filter(isPerson) : [],
      follows: Array.isArray(data.follows) ? data.follows.filter(isFollow) : [],
      closeFriends,
      blocks: Array.isArray(data.blocks) ? data.blocks.filter(isBlock) : [],
      mutes: Array.isArray(data.mutes) ? data.mutes.filter(isMute) : [],
      reports: Array.isArray(data.reports) ? data.reports.filter(isReport) : [],
    };
  } catch {
    return emptyState();
  }
}

// Grava e avisa quem está ouvindo. Devolve false se o localStorage recusou (fica só a cópia em memória).
export function saveSocial(state: SocialState): boolean {
  const value = JSON.stringify(state);
  memory = value;
  let saved = true;
  try {
    localStorage.setItem(KEY, value);
  } catch {
    saved = false;
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
  return saved;
}

export function updateSocial(change: (state: SocialState) => SocialState): boolean {
  return saveSocial(change(loadSocial()));
}

// Para o useSyncExternalStore: muda sempre que as relações mudam.
export function socialSnapshot(): string {
  return read() ?? "";
}

export function subscribeSocial(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
