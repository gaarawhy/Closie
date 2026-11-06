"use client";

import { CalendarDays } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { InfoTip } from "@/components/ui/InfoTip";
import { TextField, fieldIconButton } from "@/components/ui/TextField";

type BirthdateInputProps = Omit<ComponentProps<typeof TextField>, "type" | "prefix" | "actions"> & {
  info?: ReactNode;
};

// Data de nascimento com <input type="date"> (valor AAAA-MM-DD; o navegador mostra dd/mm/aaaa).
// O ícone nativo é escondido no CSS e trocado por este botão de calendário, ao lado do (i).
export function BirthdateInput({ info, id, ...props }: BirthdateInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  function openPicker() {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      // Navegador sem showPicker: pelo menos leva o foco para o campo
      input.focus();
    }
  }

  return (
    <TextField
      {...props}
      id={inputId}
      type="date"
      min="1900-01-01"
      max="9999-12-31"
      actions={
        <>
          {info && <InfoTip label="Por que pedimos sua data de nascimento">{info}</InfoTip>}
          <button
            type="button"
            onClick={openPicker}
            aria-label="Abrir calendário"
            className={`closie-date-button ${fieldIconButton}`}
          >
            <CalendarDays aria-hidden className="size-5" />
          </button>
        </>
      }
    />
  );
}
