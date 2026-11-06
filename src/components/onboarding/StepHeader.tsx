import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import type { Ref } from "react";
import { fieldIconButton } from "@/components/ui/TextField";

type StepHeaderProps = {
  // Texto pequeno acima do título (opcional)
  kicker?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
};

// Cabeçalho dos passos do onboarding: título e, quando há para onde voltar, a setinha no canto
// (mesmo visual do passo do @ no cadastro).
export function StepHeader({ kicker, title, subtitle, onBack, headingRef }: StepHeaderProps) {
  return (
    <>
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Voltar" className={clsx(fieldIconButton, "-ml-2 size-11")}>
          <ArrowLeft aria-hidden className="size-6" />
        </button>
      )}
      {kicker && (
        <p className={clsx("text-sm font-semibold text-closie-muted", onBack ? "mt-3" : undefined)}>{kicker}</p>
      )}
      <h1
        ref={headingRef}
        tabIndex={-1}
        className={clsx(
          "text-[26px] leading-tight font-semibold tracking-tight focus-visible:outline-none sm:text-[28px]",
          kicker ? "mt-1" : onBack ? "mt-3" : undefined,
        )}
      >
        {title}
      </h1>
      {subtitle && <p className="mt-1.5">{subtitle}</p>}
    </>
  );
}
