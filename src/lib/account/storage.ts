import { DEFAULT_PROFILE_PRIVACY } from "@/lib/profile";
import { isProfilePrivacy } from "@/lib/validation";
import type { Profile } from "./types";

// Persistência temporária: tudo fica no localStorage deste navegador.
// Para usar uma API real, troque as funções deste arquivo (mesmas assinaturas)
// ou o service.ts inteiro; as telas só conhecem o que sai de "@/lib/account".

export type StoredAccount = {
  id: string;
  email: string;
  birthdate: string;
  passwordHash: string;
  createdAt: string;
  profile: Profile;
};

const ACCOUNTS_KEY = "closie:contas";
const SESSION_KEY = "closie:sessao";
const CHANGE_EVENT = "closie:sessao-change";

// Cópias em memória para quando o localStorage estiver bloqueado (valem só nesta visita).
const memory: Record<string, string | null> = { [ACCOUNTS_KEY]: null, [SESSION_KEY]: null };

function read(key: string) {
  try {
    return localStorage.getItem(key) ?? memory[key];
  } catch {
    return memory[key];
  }
}

function write(key: string, value: string | null) {
  memory[key] = value;
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Sem storage (ou cheio), fica só a cópia em memória.
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const text = (value: unknown) => (typeof value === "string" ? value : null);

// Aceita também o formato do mock anterior ({ username, email, birthdate, passwordHash }),
// que vira uma conta com o onboarding por fazer. O id é derivado do e-mail para a leitura
// continuar sem efeitos colaterais.
function toAccount(raw: unknown): StoredAccount | null {
  if (!isRecord(raw)) return null;
  const email = text(raw.email);
  const passwordHash = text(raw.passwordHash);
  if (!email || !passwordHash) return null;
  const stored = isRecord(raw.profile) ? raw.profile : {};
  const profile: Profile = {
    username: text(stored.username) ?? text(raw.username),
    displayName: text(stored.displayName),
    bio: text(stored.bio),
    avatar: text(stored.avatar),
    privacy: isProfilePrivacy(stored.privacy) ? stored.privacy : DEFAULT_PROFILE_PRIVACY,
    onboardingCompletedAt: text(stored.onboardingCompletedAt),
  };
  return {
    id: text(raw.id) ?? `legacy:${email}`,
    email,
    birthdate: text(raw.birthdate) ?? "",
    passwordHash,
    createdAt: text(raw.createdAt) ?? "",
    profile,
  };
}

export function loadAccounts(): StoredAccount[] {
  try {
    const data: unknown = JSON.parse(read(ACCOUNTS_KEY) ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.map(toAccount).filter((account): account is StoredAccount => account !== null);
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: StoredAccount[]) {
  write(ACCOUNTS_KEY, JSON.stringify(accounts));
}

// Sessão = id da conta. O formato antigo guardava uma cópia da conta; aí vale o e-mail dela.
export function loadSessionId(): string | null {
  try {
    const data: unknown = JSON.parse(read(SESSION_KEY) ?? "null");
    if (!isRecord(data)) return null;
    const id = text(data.id);
    if (id) return id;
    const email = text(data.email);
    return email ? (loadAccounts().find((account) => account.email === email)?.id ?? null) : null;
  } catch {
    return null;
  }
}

export function saveSessionId(id: string | null) {
  write(SESSION_KEY, id === null ? null : JSON.stringify({ id }));
}

// Para o useSyncExternalStore: muda sempre que a sessão ou as contas mudam.
export function snapshot() {
  return `${read(SESSION_KEY) ?? ""}\n${read(ACCOUNTS_KEY) ?? ""}`;
}

export function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
