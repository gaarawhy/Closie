"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

// Janela modal simples com <dialog> nativo (foco preso, Esc fecha). Clicar fora também fecha.
// Existe só enquanto aberta: quem usa monta e desmonta.
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Só o fundo é o próprio <dialog>; o conteúdo fica num div por dentro
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[min(92vw,440px)] rounded-[28px] bg-closie-bg p-0 text-closie-text shadow-2xl backdrop:bg-black/50"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="-mt-1 -mr-2 flex size-10 items-center justify-center rounded-full hover:bg-closie-panel">
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </dialog>
  );
}
