"use client";

import clsx from "clsx";
import { useCallback, useRef, type ReactNode } from "react";

// Abre o seletor de arquivos por um botão de verdade (o <input> fica escondido), então funciona
// com teclado e com foco visível. `capture` abre direto o app da câmera no celular.
export function useFilePicker({
  accept,
  multiple = false,
  capture = false,
  onFiles,
}: {
  accept: string;
  multiple?: boolean;
  capture?: boolean;
  onFiles: (files: File[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const open = useCallback(() => ref.current?.click(), []);
  const input = (
    <input
      ref={ref}
      type="file"
      accept={accept}
      multiple={multiple}
      capture={capture ? "environment" : undefined}
      hidden
      onChange={(event) => {
        const files = [...(event.target.files ?? [])];
        event.target.value = "";
        if (files.length > 0) onFiles(files);
      }}
    />
  );
  return { open, input };
}

// Botão redondo translúcido das telas escuras do Criar (fechar, voltar, trocar câmera…)
export function RoundButton({ label, onClick, children, className }: { label: string; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={clsx(
        "flex size-11 shrink-0 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        className,
      )}
    >
      {children}
    </button>
  );
}

// Aviso por cima da imagem (erros e "preparando…")
export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "error" }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className="mx-auto w-fit max-w-[min(100%-2rem,22rem)] rounded-2xl bg-black/75 px-4 py-2.5 text-center text-sm text-white backdrop-blur-sm"
    >
      {children}
    </p>
  );
}
