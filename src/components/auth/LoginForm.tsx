"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import { signIn } from "@/lib/account";
import { LegalLinks } from "./LegalLinks";
import { PasswordInput } from "./PasswordInput";
import { GoogleButton, OrDivider } from "./SocialButtons";

type Errors = { login?: string; password?: string };

// Login no estilo do Pinterest: e-mail (ou @) + senha, Google e atalho para o cadastro.
// Depois de entrar, quem leva para /daily (ou /onboarding, se faltar) é o RouteGuard da página.
export function LoginForm() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const loginRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const ready = login.trim().length > 0 && password.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempt((n) => n + 1);
    if (!ready) {
      const next: Errors = {
        login: login.trim().length === 0 ? "Informe seu e-mail ou @." : undefined,
        password: password.length === 0 ? "Informe sua senha." : undefined,
      };
      setErrors(next);
      (next.login ? loginRef : passwordRef).current?.focus();
      return;
    }
    setLoading(true);
    const ok = await signIn(login, password);
    if (ok) {
      // Não desliga o loading: o RouteGuard troca a tela assim que a sessão aparecer.
      return;
    }
    setLoading(false);
    setErrors({ password: "E-mail, @ ou senha incorretos." });
    passwordRef.current?.focus();
  }

  return (
    <div className="flex flex-col">
      <h1 className="text-[26px] leading-tight font-semibold tracking-tight sm:text-[28px]">
        Que bom ter você no Closie
      </h1>
      <p className="mt-1.5">Faça login pra ver seu daily e o dos seus amigos.</p>

      <form noValidate onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <TextField
          ref={loginRef}
          label="E-mail ou @"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={login}
          error={errors.login}
          errorKey={attempt}
          onChange={(e) => {
            setLogin(e.target.value);
            setErrors({});
          }}
        />
        <PasswordInput
          ref={passwordRef}
          label="Senha"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          errorKey={attempt}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors({});
          }}
        />
        <button
          type="button"
          className="self-start rounded px-1 text-sm font-semibold text-closie-link hover:underline"
          onClick={() => setToast("Prévia: recuperar senha chega quando o Closie abrir.")}
        >
          Esqueceu sua senha?
        </button>
        <Button
          type="submit"
          size="lg"
          variant={ready ? "primary" : "inactive"}
          loading={loading}
          className="mt-2 w-full"
        >
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <OrDivider />
      <GoogleButton onPreview={setToast} />

      <p className="mt-6 text-sm">
        Primeira vez no Closie?{" "}
        <Link href="/cadastro" className="rounded font-semibold underline underline-offset-2">
          Cadastre-se gratuitamente
        </Link>
      </p>
      <LegalLinks className="mt-6" />
      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}
