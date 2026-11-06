"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { MomentFlow } from "./MomentFlow";
import { StoryFlow } from "./StoryFlow";

export type CreateMode = "story" | "momento";

// Na ordem da referência (POST · STORY): momento primeiro
const MODES: { id: CreateMode; label: string }[] = [
  { id: "momento", label: "Momento" },
  { id: "story", label: "Story" },
];

type CreateDialogProps = {
  viewerId: string;
  profilePrivate: boolean;
  initialMode: CreateMode;
  onClose: () => void;
  onPublished: (mode: CreateMode) => void;
};

// O "Criar", no modelo do Instagram: tela escura e cheia, abas MOMENTO · STORY embaixo.
// Story abre direto na câmera; Momento abre a galeria. As duas ficam montadas: trocar de aba
// não perde o que já foi escolhido (a câmera só fica ligada na aba Story).
// <dialog> nativo: prende o foco e fecha com Esc. No celular ocupa a tela toda.
export function CreateDialog({ viewerId, profilePrivate, initialMode, onClose, onPublished }: CreateDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const baseId = useId();
  const [mode, setMode] = useState<CreateMode>(initialMode);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const tabs = <ModeTabs baseId={baseId} mode={mode} onChange={setMode} />;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Fechar a galeria sem escolher dispara um "cancel" no <input type="file"> que sobe até
        // aqui. Só o Esc do próprio <dialog> fecha o Criar.
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        onClose();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-black p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-white backdrop:bg-black/80 sm:m-auto sm:h-[min(94dvh,860px)] sm:w-[min(94vw,430px)] sm:rounded-[28px] sm:p-0 sm:shadow-2xl"
    >
      <h2 id={titleId} className="sr-only">
        {mode === "story" ? "Novo story" : "Novo momento"}
      </h2>
      {MODES.map((item) => (
        <div
          key={item.id}
          id={`${baseId}-${item.id}-painel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-${item.id}`}
          className={item.id === mode ? "flex h-full flex-col" : "hidden"}
        >
          {item.id === "story" ? (
            <StoryFlow
              viewerId={viewerId}
              profilePrivate={profilePrivate}
              active={mode === "story"}
              tabs={mode === "story" ? tabs : null}
              onClose={onClose}
              onPublished={() => onPublished("story")}
            />
          ) : (
            <MomentFlow
              viewerId={viewerId}
              active={mode === "momento"}
              tabs={mode === "momento" ? tabs : null}
              onClose={onClose}
              onPublished={() => onPublished("momento")}
            />
          )}
        </div>
      ))}
    </dialog>
  );
}

// Abas MOMENTO · STORY (setas do teclado trocam). Cada tela desenha as abas no seu lugar, então
// o foco é devolvido à aba nova depois da troca.
function ModeTabs({ baseId, mode, onChange }: { baseId: string; mode: CreateMode; onChange: (mode: CreateMode) => void }) {
  function select(next: CreateMode) {
    if (next === mode) return;
    onChange(next);
    requestAnimationFrame(() => document.getElementById(`${baseId}-${next}`)?.focus({ preventScroll: true }));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    select(mode === "story" ? "momento" : "story");
  }

  return (
    <div role="tablist" aria-label="O que você quer criar" onKeyDown={onKeyDown} className="flex items-center gap-1">
      {MODES.map((item) => {
        const selected = item.id === mode;
        return (
          <button
            key={item.id}
            id={`${baseId}-${item.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${baseId}-${item.id}-painel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => select(item.id)}
            className={clsx(
              "rounded-full px-3 py-2 text-[13px] font-semibold tracking-[0.14em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-white",
              selected ? "text-white" : "text-white/45 hover:text-white/80",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
