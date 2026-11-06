"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import { signUp } from "@/lib/account";
import { normalizeUsername, usernameFromEmail, validateBirthdate, validateEmail, validatePassword } from "@/lib/validation";
import { BirthdateInput } from "./BirthdateInput";
import { SignupNotice } from "./LegalLinks";
import { PasswordInput } from "./PasswordInput";
import { GoogleButton, OrDivider } from "./SocialButtons";
import { UsernameStep } from "./UsernameStep";
import { useAvailableSuggestions, useUsernameAvailability } from "./useUsernameAvailability";

const MIN_AGE_HINT = "Você precisa ter pelo menos 13 anos para usar o Closie. Sua data de nascimento não aparece no seu perfil.";

type Step = "details" | "username";
type Field = "email" | "password" | "birthdate" | "username";
type Errors = Partial<Record<Field, string>>;

const DETAIL_FIELDS = ["email", "password", "birthdate"] as const;

// Cadastro em duas etapas: os dados da conta no estilo do Pinterest (e-mail, senha e
// nascimento, 13+) e depois a escolha do @ no estilo do VSCO. Ao concluir, quem navega
// para o onboarding é o RouteGuard (a sessão passa a existir sem onboarding concluído).
export function SignupFlow() {
  const [step, setStep] = useState<Step>("details");
  const [values, setValues] = useState<Record<Field, string>>({
    email: "",
    password: "",
    birthdate: "",
    username: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const [cameBack, setCameBack] = useState(false);
  const previousStep = useRef(step);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fieldRefs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});

  const availability = useUsernameAvailability(values.username);
  const suggestions = useAvailableSuggestions(
    values.username || usernameFromEmail(values.email),
    availability === "taken" || values.username.length === 0,
  );

  // Move o foco quando a pessoa troca de etapa (não ao abrir a página)
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    if (step === "username") fieldRefs.current.username?.focus();
    else headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  function update(field: Field, value: string) {
    setValues((v) => ({ ...v, [field]: field === "username" ? normalizeUsername(value) : value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function goTo(next: Step) {
    setErrors({});
    setCameBack(next === "details");
    setStep(next);
  }

  function handleDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {
      email: validateEmail(values.email) ?? undefined,
      password: validatePassword(values.password) ?? undefined,
      birthdate: validateBirthdate(values.birthdate) ?? undefined,
    };
    const firstInvalid = DETAIL_FIELDS.find((field) => next[field]);
    setErrors(next);
    setAttempt((n) => n + 1);
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }
    goTo("username");
  }

  async function handleUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempt((n) => n + 1);
    setLoading(true);
    const result = await signUp({
      email: values.email,
      password: values.password,
      birthdate: values.birthdate,
      username: values.username,
    });
    if (result.ok) {
      // Não desliga o loading: o RouteGuard troca a tela assim que a sessão aparecer.
      return;
    }
    setLoading(false);
    if (result.field === "username") {
      setErrors({ username: result.message });
      fieldRefs.current.username?.focus();
      return;
    }
    // E-mail, senha ou nascimento recusados ao criar a conta (ex.: e-mail cadastrado nesse meio-tempo):
    // volta ao passo 1; o foco vai para o título do passo, o erro aparece junto do campo.
    setErrors({ [result.field]: result.message });
    goTo("details");
  }

  if (step === "username") {
    return (
      <div className="fade-up">
        <UsernameStep
          username={values.username}
          availability={availability}
          suggestions={suggestions}
          kicker="Último passo"
          submitLabel="Criar conta"
          loadingLabel="Criando conta…"
          error={errors.username}
          errorKey={attempt}
          loading={loading}
          ref={(el) => {
            fieldRefs.current.username = el;
          }}
          onChange={(value) => update("username", value)}
          onBack={() => goTo("details")}
          onSubmit={handleUsername}
        />
      </div>
    );
  }

  return (
    <div className={cameBack ? "fade-up flex flex-col" : "flex flex-col"}>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-[26px] leading-tight font-semibold tracking-tight focus-visible:outline-none sm:text-[28px]"
      >
        Que bom ter você no Closie
      </h1>
      <p className="mt-1.5">Crie sua conta grátis e mostre seu daily só pra quem você escolher.</p>

      <form noValidate onSubmit={handleDetails} className="mt-6 flex flex-col gap-3">
        <TextField
          ref={(el) => {
            fieldRefs.current.email = el;
          }}
          label="E-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={values.email}
          error={errors.email}
          errorKey={attempt}
          onChange={(e) => update("email", e.target.value)}
        />
        <PasswordInput
          ref={(el) => {
            fieldRefs.current.password = el;
          }}
          label="Crie uma senha"
          autoComplete="new-password"
          value={values.password}
          error={errors.password}
          errorKey={attempt}
          hint="Use 8 ou mais letras, números e símbolos"
          info="Sua senha precisa ter pelo menos 8 caracteres. Misturar letras, números e símbolos deixa ela mais segura."
          onChange={(e) => update("password", e.target.value)}
        />
        <BirthdateInput
          ref={(el) => {
            fieldRefs.current.birthdate = el;
          }}
          label="Data de nascimento"
          autoComplete="bday"
          value={values.birthdate}
          error={errors.birthdate}
          errorKey={attempt}
          info={MIN_AGE_HINT}
          onChange={(e) => update("birthdate", e.target.value)}
        />
        <Button type="submit" size="lg" className="mt-2 w-full">
          Continuar
        </Button>
      </form>

      <OrDivider />
      <GoogleButton onPreview={setToast} />

      <p className="mt-6 text-sm">
        Já tem uma conta?{" "}
        <Link href="/entrar" className="rounded font-semibold underline underline-offset-2">
          Entrar
        </Link>
      </p>
      <SignupNotice className="mt-4" />
      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}
