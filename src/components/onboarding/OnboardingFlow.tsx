"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { UsernameStep } from "@/components/auth/UsernameStep";
import { useAvailableSuggestions, useUsernameAvailability } from "@/components/auth/useUsernameAvailability";
import { ONBOARDING_SUCCESS_KEY } from "@/components/daily/DailyHome";
import { Toast } from "@/components/ui/Toast";
import { completeOnboarding, signOut, useSession, type OnboardingField, type OnboardingInput } from "@/lib/account";
import { DEFAULT_PROFILE_PRIVACY } from "@/lib/profile";
import { checkUsernameFormat, normalizeUsername, usernameFromEmail, validateBio, validateDisplayName } from "@/lib/validation";
import { ProfileStep } from "./ProfileStep";
import { ReviewStep } from "./ReviewStep";

type Step = "username" | "profile" | "review";
type Errors = Partial<Record<OnboardingField, string>>;

// Para qual passo voltar quando completeOnboarding recusa um campo. A privacidade não tem
// tela no onboarding (vai para as configurações): fica no padrão e, se algo der errado, vira aviso.
const STEP_FOR_FIELD: Record<OnboardingField, Step> = {
  username: "username",
  displayName: "profile",
  bio: "profile",
  avatar: "profile",
  privacy: "review",
};

// Onboarding em 3 passos: @ (já vem com o escolhido no cadastro, pode trocar), perfil
// (nome obrigatório; foto com enquadramento e bio opcionais) e revisão com "Editar" por parte.
// Ao concluir, quem leva para /daily é o RouteGuard (o perfil passa a ter onboardingCompletedAt).
export function OnboardingFlow() {
  // Garantido não-nulo: o RouteGuard só monta este componente depois de confirmar a sessão.
  const session = useSession();
  const [step, setStep] = useState<Step>("username");
  // Começa com o @ escolhido no cadastro; lido uma vez, na primeira renderização (o RouteGuard
  // garante que a sessão já existe nesse momento, então dá pra ler direto, sem efeito).
  const [values, setValues] = useState<OnboardingInput>(() => ({
    username: session?.profile.username ?? "",
    displayName: "",
    bio: "",
    avatar: null,
    privacy: session?.profile.privacy ?? DEFAULT_PROFILE_PRIVACY,
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [attempt, setAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const previousStep = useRef<Step>(step);
  const usernameFieldRef = useRef<HTMLInputElement>(null);
  const nameFieldRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move o foco quando o passo muda (não na primeira renderização).
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    if (step === "username") usernameFieldRef.current?.focus();
    else if (step === "profile") nameFieldRef.current?.focus();
    else headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const availability = useUsernameAvailability(values.username);
  const suggestions = useAvailableSuggestions(
    values.username || usernameFromEmail(session?.email ?? ""),
    availability === "taken" || values.username.length === 0,
  );

  if (!session) return null;

  function update<K extends keyof OnboardingInput>(field: K, value: OnboardingInput[K]) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function goTo(next: Step) {
    setErrors({});
    setStep(next);
  }

  function handleUsernameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempt((n) => n + 1);
    const format = checkUsernameFormat(values.username);
    if (!format.ok) {
      setErrors({ username: format.message });
      return;
    }
    if (availability === "taken") {
      setErrors({ username: "Esse @ já está em uso. Escolha outro ou uma das sugestões." });
      return;
    }
    goTo("profile");
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempt((n) => n + 1);
    const nameError = validateDisplayName(values.displayName);
    const bioError = validateBio(values.bio);
    if (nameError || bioError) {
      setErrors({ displayName: nameError ?? undefined, bio: bioError ?? undefined });
      return;
    }
    goTo("review");
  }

  async function handleComplete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const result = await completeOnboarding(values);
    if (result.ok) {
      // Lido uma vez pelo DailyHome, para mostrar "Perfil pronto!" só nesta primeira chegada.
      try {
        sessionStorage.setItem(ONBOARDING_SUCCESS_KEY, "1");
      } catch {
        // Sem sessionStorage, só não mostra o aviso de sucesso.
      }
      // Não desliga o "enviando": o RouteGuard troca a tela assim que o onboarding aparecer concluído.
      return;
    }
    setSubmitting(false);
    setAttempt((n) => n + 1);
    const target = result.field ? STEP_FOR_FIELD[result.field] : "review";
    if (!result.field || target === "review") {
      // Sem campo para mostrar (ex.: a sessão terminou em outra aba): vira aviso.
      setToast(result.message);
      return;
    }
    setErrors({ [result.field]: result.message });
    setStep(target);
  }

  let content;
  if (step === "username") {
    content = (
      <UsernameStep
        username={values.username}
        availability={availability}
        suggestions={suggestions}
        submitLabel="Continuar"
        error={errors.username}
        errorKey={attempt}
        loading={false}
        ref={usernameFieldRef}
        onChange={(value) => update("username", normalizeUsername(value))}
        onSubmit={handleUsernameSubmit}
      />
    );
  } else if (step === "profile") {
    content = (
      <ProfileStep
        username={values.username}
        displayName={values.displayName}
        bio={values.bio}
        avatar={values.avatar}
        nameError={errors.displayName}
        bioError={errors.bio}
        avatarError={errors.avatar}
        errorKey={attempt}
        nameRef={nameFieldRef}
        onChangeName={(value) => update("displayName", value)}
        onChangeBio={(value) => update("bio", value)}
        onChangeAvatar={(value) => update("avatar", value)}
        onBack={() => goTo("username")}
        onSubmit={handleProfileSubmit}
      />
    );
  } else {
    content = (
      <ReviewStep
        username={values.username}
        displayName={values.displayName.trim().replace(/\s+/g, " ")}
        bio={values.bio}
        avatar={values.avatar}
        loading={submitting}
        headingRef={headingRef}
        onEditUsername={() => goTo("username")}
        onEditProfile={() => goTo("profile")}
        onBack={() => goTo("profile")}
        onSubmit={handleComplete}
      />
    );
  }

  return (
    <>
      {/* key: cada passo entra com a animação de novo */}
      <div key={step} className="fade-up">
        {content}
      </div>
      {/* Saída para quem entrou na conta errada: sem ela, só dava pra sair depois de concluir */}
      <p className="mt-6 text-center text-sm text-closie-muted">
        Não é {session.email}?{" "}
        <button type="button" onClick={() => signOut()} className="rounded font-semibold text-closie-text underline underline-offset-2">
          Sair
        </button>
      </p>
      <Toast message={toast} onClose={closeToast} />
    </>
  );
}
