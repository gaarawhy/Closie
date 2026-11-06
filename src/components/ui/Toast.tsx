"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type ToastProps = {
  message: string | null;
  onClose: () => void;
  duration?: number;
  // Distância do pé da tela (ex.: subir acima de uma barra de navegação embaixo)
  bottomClass?: string;
};

// Toast simples. A região role="status" fica sempre montada para o leitor de tela anunciar a mensagem.
export function Toast({ message, onClose, duration = 4000, bottomClass = "bottom-4" }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 ${bottomClass} z-50 flex justify-center px-4`}
    >
      {message && (
        <div className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl bg-closie-text px-4 py-3 text-sm text-closie-bg shadow-lg motion-safe:animate-[fade-up_200ms_ease-out]">
          <span>{message}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar aviso"
            className="rounded-full p-1 hover:bg-closie-bg/10"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
