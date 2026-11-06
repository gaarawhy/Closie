"use client";

import { Info } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { fieldIconButton } from "./TextField";

type InfoTipProps = {
  // Nome do botão para leitor de tela (ex.: "Ajuda sobre a senha")
  label: string;
  children: ReactNode;
};

// Botão (i) com balão de ajuda. Abre no hover, no clique/toque e no Enter;
// fecha com Esc, clique fora ou quando o foco sai. O texto entra numa região
// role="status" para o leitor de tela ler quando o balão abre.
export function InfoTip({ label, children }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const bubbleId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span
      ref={rootRef}
      className="relative flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={bubbleId}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={fieldIconButton}
      >
        <Info aria-hidden className="size-5" />
      </button>
      <span
        id={bubbleId}
        role="status"
        className={
          open
            ? "absolute top-full right-0 z-30 mt-2 w-64 rounded-2xl bg-closie-text px-4 py-3 text-left text-sm leading-relaxed text-closie-bg shadow-lg motion-safe:animate-[fade-up_150ms_ease-out]"
            : "sr-only"
        }
      >
        {open ? children : null}
      </span>
    </span>
  );
}
