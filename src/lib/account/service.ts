import { mockTakenUsernames } from "@/lib/mock";
import { DEFAULT_PROFILE_PRIVACY } from "@/lib/profile";
import {
  checkUsernameFormat,
  isProfilePrivacy,
  normalizeUsername,
  validateBio,
  validateBirthdate,
  validateDisplayName,
  validateEmail,
  validatePassword,
} from "@/lib/validation";
import * as storage from "./storage";
import type {
  OnboardingInput,
  OnboardingResult,
  ProfileUpdateResult,
  Session,
  SignUpInput,
  SignUpResult,
} from "./types";

// Regras de negócio da conta. Hoje rodam no navegador sobre o storage.ts; com uma API,
// as mesmas regras passam a valer no servidor e estas funções viram chamadas a ela.

// Simula a ida ao servidor (nos testes não espera)
const FAKE_DELAY_MS = 600;
const CHECK_DELAY_MS = 250;
const MAX_CHECK = 10;

function wait(ms: number) {
  if (process.env.NODE_ENV === "test") return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Mesmo sendo mock, a senha não fica salva em texto puro.
async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function isUsernameTaken(username: string, accounts: storage.StoredAccount[], exceptId: string | null) {
  return (
    mockTakenUsernames.includes(username) ||
    accounts.some((account) => account.id !== exceptId && account.profile.username === username)
  );
}

function currentAccount(accounts = storage.loadAccounts()) {
  const id = storage.loadSessionId();
  return id ? (accounts.find((account) => account.id === id) ?? null) : null;
}

export function getSession(): Session | null {
  const account = currentAccount();
  return account ? { id: account.id, email: account.email, profile: account.profile } : null;
}

export function isOnboarded(session: Session) {
  return session.profile.onboardingCompletedAt !== null;
}

// Cria a conta com o @ escolhido no cadastro e já entra. O resto do perfil vem no onboarding.
export async function signUp(input: SignUpInput): Promise<SignUpResult> {
  await wait(FAKE_DELAY_MS);
  const email = input.email.trim().toLowerCase();
  const emailError = validateEmail(email);
  if (emailError) return { ok: false, field: "email", message: emailError };
  const accounts = storage.loadAccounts();
  if (accounts.some((account) => account.email === email)) {
    return { ok: false, field: "email", message: "Esse e-mail já tem conta. Que tal entrar?" };
  }
  const passwordError = validatePassword(input.password);
  if (passwordError) return { ok: false, field: "password", message: passwordError };
  const birthdateError = validateBirthdate(input.birthdate);
  if (birthdateError) return { ok: false, field: "birthdate", message: birthdateError };
  const username = normalizeUsername(input.username);
  const format = checkUsernameFormat(username);
  if (!format.ok) return { ok: false, field: "username", message: format.message };
  if (isUsernameTaken(username, accounts, null)) {
    return { ok: false, field: "username", message: "Esse @ já está em uso." };
  }

  const id = crypto.randomUUID();
  storage.saveAccounts([
    ...accounts,
    {
      id,
      email,
      birthdate: input.birthdate,
      passwordHash: await hashPassword(input.password),
      createdAt: new Date().toISOString(),
      profile: {
        username,
        displayName: null,
        bio: null,
        avatar: null,
        privacy: DEFAULT_PROFILE_PRIVACY,
        onboardingCompletedAt: null,
      },
    },
  ]);
  storage.saveSessionId(id);
  return { ok: true };
}

// "login" aceita e-mail ou @. Retorna false se não bater com nenhuma conta.
export async function signIn(login: string, password: string): Promise<boolean> {
  await wait(FAKE_DELAY_MS);
  const key = login.trim().toLowerCase().replace(/^@+/, "");
  const account = storage
    .loadAccounts()
    .find((candidate) => candidate.email === key || candidate.profile.username === key);
  if (!account || account.passwordHash !== (await hashPassword(password))) return false;
  storage.saveSessionId(account.id);
  return true;
}

export function signOut() {
  storage.saveSessionId(null);
}

// Simula a consulta de disponibilidade: devolve, na ordem e sem repetir, os @ com formato
// válido que não são de outra conta. O @ da própria sessão conta como livre.
export async function checkUsernamesAvailable(candidates: string[]): Promise<string[]> {
  if (candidates.length > MAX_CHECK) throw new Error(`Consulte no máximo ${MAX_CHECK} @ por vez.`);
  await wait(CHECK_DELAY_MS);
  const accounts = storage.loadAccounts();
  const sessionId = storage.loadSessionId();
  const names = [...new Set(candidates.map(normalizeUsername))];
  return names.filter((name) => checkUsernameFormat(name).ok && !isUsernameTaken(name, accounts, sessionId));
}

// Valida tudo de novo (a tela pode ter sido burlada) e grava o perfil de uma vez.
export async function completeOnboarding(input: OnboardingInput): Promise<OnboardingResult> {
  await wait(FAKE_DELAY_MS);
  const accounts = storage.loadAccounts();
  const account = currentAccount(accounts);
  if (!account) {
    return { ok: false, step: 1, message: "Sua sessão terminou. Entre de novo para continuar." };
  }

  const username = normalizeUsername(input.username);
  const format = checkUsernameFormat(username);
  if (!format.ok) return { ok: false, step: 1, field: "username", message: format.message };
  if (isUsernameTaken(username, accounts, account.id)) {
    return { ok: false, step: 1, field: "username", message: "Esse @ já está em uso." };
  }
  const nameError = validateDisplayName(input.displayName);
  if (nameError) return { ok: false, step: 2, field: "displayName", message: nameError };
  const bioError = validateBio(input.bio);
  if (bioError) return { ok: false, step: 2, field: "bio", message: bioError };
  if (input.avatar !== null && !input.avatar.startsWith("data:image/")) {
    return { ok: false, step: 2, field: "avatar", message: "Não deu pra usar essa foto. Escolha outra." };
  }
  if (!isProfilePrivacy(input.privacy)) {
    return { ok: false, step: 3, field: "privacy", message: "Escolha se o seu perfil é público ou privado." };
  }

  const bio = input.bio.trim();
  const profile = {
    username,
    displayName: input.displayName.trim().replace(/\s+/g, " "),
    bio: bio.length > 0 ? bio : null,
    avatar: input.avatar,
    privacy: input.privacy,
    onboardingCompletedAt: account.profile.onboardingCompletedAt ?? new Date().toISOString(),
  };
  storage.saveAccounts(accounts.map((item) => (item.id === account.id ? { ...item, profile } : item)));
  return { ok: true };
}

// Editar perfil (depois do onboarding): as mesmas regras e a mesma gravação do onboarding,
// sem duplicar nada; o erro só troca "passo" por "campo".
export async function updateProfile(input: OnboardingInput): Promise<ProfileUpdateResult> {
  const session = getSession();
  if (!session || !isOnboarded(session)) {
    return { ok: false, message: "Sua sessão terminou. Entre de novo para continuar." };
  }
  const result = await completeOnboarding(input);
  return result.ok ? { ok: true } : { ok: false, field: result.field, message: result.message };
}
