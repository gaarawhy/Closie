"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { InfoTip } from "@/components/ui/InfoTip";
import { TextField, fieldIconButton } from "@/components/ui/TextField";

type PasswordInputProps = Omit<ComponentProps<typeof TextField>, "type" | "prefix" | "actions"> & {
  // Texto do balão (i); sem ele o botão de ajuda não aparece
  info?: ReactNode;
};

export function PasswordInput({ info, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      actions={
        <>
          {info && <InfoTip label="Ajuda sobre a senha">{info}</InfoTip>}
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label="Mostrar senha"
            aria-pressed={visible}
            className={fieldIconButton}
          >
            {visible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        </>
      }
    />
  );
}
