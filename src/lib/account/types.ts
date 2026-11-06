import type { ProfilePrivacy } from "@/lib/profile";

// Formato que as telas usam. Quando existir uma API, ela deve devolver estes mesmos dados.

export type Profile = {
  // Escolhido no cadastro e confirmado (ou trocado) no onboarding
  username: string | null;
  displayName: string | null;
  bio: string | null;
  // Hoje é uma data URL guardada no navegador; com a API será a URL da foto no storage
  avatar: string | null;
  privacy: ProfilePrivacy;
  // Data (ISO) em que o onboarding foi concluído; null = ainda falta
  onboardingCompletedAt: string | null;
};

export type Session = {
  id: string;
  email: string;
  profile: Profile;
};

export type SignUpInput = {
  email: string;
  password: string;
  // AAAA-MM-DD, do <input type="date">
  birthdate: string;
  username: string;
};

export type SignUpField = "email" | "password" | "birthdate" | "username";

export type SignUpResult = { ok: true } | { ok: false; field: SignUpField; message: string };

export type OnboardingStep = 1 | 2 | 3;

export type OnboardingField = "username" | "displayName" | "bio" | "avatar" | "privacy";

export type OnboardingInput = {
  username: string;
  displayName: string;
  bio: string;
  avatar: string | null;
  privacy: ProfilePrivacy;
};

// Em erro, diz para qual passo voltar e qual campo mostrar a mensagem.
export type OnboardingResult =
  | { ok: true }
  | { ok: false; step: OnboardingStep; field?: OnboardingField; message: string };

// Editar perfil: em erro, o campo que mostra a mensagem (sem campo = erro geral, ex. sessão).
export type ProfileUpdateResult = { ok: true } | { ok: false; field?: OnboardingField; message: string };
