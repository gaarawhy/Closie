import { parseDumpDate } from "./mock";
import { PROFILE_PRIVACY_OPTIONS, type ProfilePrivacy } from "./profile";

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;
export const MIN_AGE = 13;
export const DISPLAY_NAME_MAX = 50;
export const BIO_MAX = 160;

// @ que ninguém pode usar: a marca, suporte e nomes de páginas do app.
export const RESERVED_USERNAMES: readonly string[] = [
  "closie",
  "admin",
  "administrador",
  "suporte",
  "support",
  "ajuda",
  "help",
  "daily",
  "oficial",
  "official",
  "root",
  "sistema",
  "system",
  "api",
  "auth",
  "www",
  "entrar",
  "cadastro",
  "onboarding",
  "termos",
  "privacidade",
  "configuracoes",
  "settings",
  "moderacao",
  "staff",
  // /daily/perfil/editar: com esse @, a página esconderia o perfil da pessoa
  "editar",
  "perfil",
  "personalizar",
];

// Converte para minúsculo e tira o "@" do começo (comum ao colar do Instagram).
export function normalizeUsername(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export type UsernameProblem = "empty" | "chars" | "dots" | "short" | "long" | "reserved";

export type UsernameCheck = { ok: true } | { ok: false; problem: UsernameProblem; message: string };

function problem(kind: UsernameProblem, message: string): UsernameCheck {
  return { ok: false, problem: kind, message };
}

// Checa só o formato do @, por partes, para a tela mostrar o status enquanto a pessoa digita.
// Se o @ está livre quem responde é o serviço de conta (src/lib/account.ts).
export function checkUsernameFormat(username: string): UsernameCheck {
  if (username.length === 0) return problem("empty", "Escolha seu @.");
  if (!/^[a-z0-9._]+$/.test(username)) {
    return problem("chars", "Use só letras sem acento, números, ponto e underline.");
  }
  if (username.startsWith(".") || username.endsWith(".")) {
    return problem("dots", "O @ não pode começar nem terminar com ponto.");
  }
  if (username.includes("..")) return problem("dots", "O @ não pode ter dois pontos seguidos.");
  if (username.length < USERNAME_MIN) {
    return problem("short", `O @ precisa ter pelo menos ${USERNAME_MIN} caracteres.`);
  }
  if (username.length > USERNAME_MAX) {
    return problem("long", `O @ pode ter no máximo ${USERNAME_MAX} caracteres.`);
  }
  if (RESERVED_USERNAMES.includes(username)) return problem("reserved", "Esse @ não está disponível.");
  return { ok: true };
}

// Retorna a mensagem de erro de formato, ou null se o formato do @ é válido.
export function validateUsername(username: string): string | null {
  const result = checkUsernameFormat(username);
  return result.ok ? null : result.message;
}

// Deixa qualquer texto no formato de @: sem acento, minúsculo, só letras, números, ponto e underline.
function toUsernameShape(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, USERNAME_MAX);
}

// Parte antes do "@" do e-mail, já no formato de @ (ponto de partida das sugestões).
export function usernameFromEmail(email: string) {
  return toUsernameShape(email.trim().split("@")[0] ?? "");
}

// Candidatos a @ a partir de um nome base (o @ em uso, ou o começo do e-mail), todos com formato
// válido e nenhum reservado. Quais estão livres quem diz é o serviço de conta.
export function suggestUsernames(base: string): string[] {
  const full = toUsernameShape(base);
  // Encurta para caber os finais sem passar do limite, de preferência num ponto ou underline
  // ("marcelo.coronet" vira "marcelo", não "marcelo.corone")
  const room = USERNAME_MAX - 6;
  const lastBreak = Math.max(full.lastIndexOf(".", room), full.lastIndexOf("_", room));
  const cut = full.length <= room ? full : lastBreak >= 3 ? full.slice(0, lastBreak) : full.slice(0, room);
  const stem = cut.replace(/[._]+$/, "");
  if (stem.length < 2) return [];
  const year = String(new Date().getFullYear()).slice(-2);
  const candidates = [full, `${stem}.daily`, `${stem}_${year}`, `${stem}.${year}`, `eu.${stem}`, `${stem}.dumps`];
  const valid = candidates.filter((candidate) => checkUsernameFormat(candidate).ok);
  return [...new Set(valid)].slice(0, 6);
}

export function validateDisplayName(value: string): string | null {
  const name = value.trim();
  if (name.length === 0) return "Diga como você quer ser chamado.";
  if (name.length > DISPLAY_NAME_MAX) return `O nome pode ter no máximo ${DISPLAY_NAME_MAX} caracteres.`;
  return null;
}

// Bio é opcional; o limite vale para o texto sem os espaços das pontas.
export function validateBio(value: string): string | null {
  if (value.trim().length > BIO_MAX) return `A bio pode ter no máximo ${BIO_MAX} caracteres.`;
  return null;
}

export function isProfilePrivacy(value: unknown): value is ProfilePrivacy {
  return typeof value === "string" && (PROFILE_PRIVACY_OPTIONS as readonly string[]).includes(value);
}

export function validateEmail(email: string): string | null {
  if (email.trim().length === 0) return "Informe seu e-mail.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Esse e-mail não parece válido.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length === 0) return "Crie uma senha.";
  if (password.length < PASSWORD_MIN) return `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`;
  return null;
}

// Recebe o valor do <input type="date"> (AAAA-MM-DD) e exige a idade mínima (13+).
export function validateBirthdate(value: string, today = new Date()): string | null {
  if (value.length === 0) return "Informe sua data de nascimento.";
  let birth: Date;
  try {
    birth = parseDumpDate(value);
  } catch {
    return "Essa data não parece válida.";
  }
  if (birth.getFullYear() < 1900) return "Essa data não parece válida.";
  if (birth > today) return "Essa data ainda não chegou.";
  const oldEnoughAt = new Date(birth.getFullYear() + MIN_AGE, birth.getMonth(), birth.getDate());
  if (oldEnoughAt > today) return `Você precisa ter pelo menos ${MIN_AGE} anos para usar o Closie.`;
  return null;
}
