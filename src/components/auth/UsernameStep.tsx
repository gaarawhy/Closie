"use client";

import clsx from "clsx";
import { ArrowLeft, Check, CircleAlert, Loader2 } from "lucide-react";
import { useId, type FormEvent, type ReactNode, type Ref } from "react";
import { Button } from "@/components/ui/Button";
import { TextField, fieldIconButton } from "@/components/ui/TextField";
import { USERNAME_MAX, USERNAME_MIN, checkUsernameFormat } from "@/lib/validation";
import type { Availability } from "./useUsernameAvailability";

type UsernameStepProps = {
  username: string;
  // Disponibilidade simulada (src/components/auth/useUsernameAvailability.ts)
  availability: Availability;
  // Sugestões de @ livres para mostrar como atalho
  suggestions: string[];
  // Texto pequeno acima do título (ex.: "Último passo" no cadastro); opcional
  kicker?: string;
  submitLabel: string;
  // Mostrado no botão enquanto `loading`; padrão: submitLabel + "…"
  loadingLabel?: string;
  // Erro do envio (aparece como alerta); formato inválido é mostrado por conta própria
  error?: string;
  errorKey?: number;
  loading: boolean;
  ref?: Ref<HTMLInputElement>;
  onChange: (value: string) => void;
  // Sem onBack, o botão de voltar não aparece (ex.: primeiro passo do onboarding)
  onBack?: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const RULES = `${USERNAME_MIN} a ${USERNAME_MAX} caracteres: letras, números, ponto e underline.`;

type Status = { tone: "hint" | "checking" | "ok" | "error"; message: ReactNode };

function statusFor(username: string, availability: Availability): Status {
  const format = checkUsernameFormat(username);
  if (!format.ok) {
    if (format.problem === "empty" || format.problem === "short") return { tone: "hint", message: RULES };
    return { tone: "error", message: format.message };
  }
  const handle = <strong className="font-semibold">@{username}</strong>;
  if (availability === "available") return { tone: "ok", message: <>Boa escolha! {handle} está disponível.</> };
  if (availability === "taken") return { tone: "error", message: <>{handle} já está em uso.</> };
  if (availability === "error") {
    return { tone: "hint", message: "Não deu pra verificar agora, mas você pode tentar continuar." };
  }
  // "checking", ou "idle" antes da primeira consulta
  return { tone: "checking", message: <>Verificando se {handle} está disponível…</> };
}

// Escolha do @ no estilo do VSCO: o link closie.co/@ vai se montando no próprio campo enquanto
// a pessoa digita, com aviso de disponível/em uso e sugestões de @ livres.
// Componente de apresentação: quem decide disponibilidade e sugestões é quem usa este componente
// (o cadastro e o onboarding; ambos usam useUsernameAvailability/useAvailableSuggestions).
export function UsernameStep({
  username,
  availability,
  suggestions,
  kicker,
  submitLabel,
  loadingLabel,
  error,
  errorKey,
  loading,
  ref,
  onChange,
  onBack,
  onSubmit,
}: UsernameStepProps) {
  const inputId = useId();
  const statusId = useId();
  const status = statusFor(username, availability);

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col">
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Voltar" className={clsx(fieldIconButton, "-ml-2 size-11")}>
          <ArrowLeft aria-hidden className="size-6" />
        </button>
      )}
      {kicker && (
        <p className={clsx("text-sm font-semibold text-closie-muted", onBack ? "mt-3" : undefined)}>{kicker}</p>
      )}
      <h1
        className={clsx(
          "text-[26px] leading-tight font-semibold tracking-tight sm:text-[28px]",
          kicker ? "mt-1" : onBack ? "mt-3" : undefined,
        )}
      >
        Escolha seu @
      </h1>
      <p className="mt-1.5">É assim que seus amigos vão te achar. Ele também vira o seu link pra colocar na bio.</p>

      <TextField
        ref={ref}
        id={inputId}
        className="mt-6"
        label="Seu @"
        prefix="closie.co/@"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={USERNAME_MAX}
        value={username}
        invalid={Boolean(error) || status.tone === "error"}
        aria-describedby={statusId}
        actions={
          !error && status.tone === "ok" ? <Check aria-hidden className="mr-2 size-5 text-closie-success" /> : undefined
        }
        onChange={(e) => onChange(e.target.value)}
      />

      {/* Status ao vivo (polite) enquanto digita; erro do envio entra como alerta, com key nova a cada tentativa */}
      {error ? (
        <p
          key={`error-${errorKey ?? ""}`}
          id={statusId}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 px-1 text-sm text-closie-red-hover"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : (
        <p
          key="live"
          id={statusId}
          aria-live="polite"
          className={clsx(
            "mt-1.5 flex items-start gap-1.5 px-1 text-sm",
            status.tone === "ok" && "text-closie-success",
            status.tone === "error" && "text-closie-red-hover",
            status.tone === "checking" && "text-closie-muted",
            status.tone === "hint" && "text-xs text-closie-muted",
          )}
        >
          {status.tone === "ok" && <Check aria-hidden className="mt-0.5 size-4 shrink-0" />}
          {status.tone === "error" && <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />}
          {status.tone === "checking" && <Loader2 aria-hidden className="mt-0.5 size-4 shrink-0 motion-safe:animate-spin" />}
          <span className="min-w-0 break-words">{status.message}</span>
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
          <span className="text-sm text-closie-muted">{username ? "Que tal:" : "Sugestões:"}</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                onChange(suggestion);
                // O botão some depois da escolha; o foco volta para o campo
                document.getElementById(inputId)?.focus();
              }}
              className="rounded-full bg-closie-panel px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-closie-panel-strong"
            >
              @{suggestion}
            </button>
          ))}
        </div>
      )}

      <Button type="submit" size="lg" loading={loading} className="mt-6 w-full">
        {loading ? (loadingLabel ?? `${submitLabel}…`) : submitLabel}
      </Button>
    </form>
  );
}
