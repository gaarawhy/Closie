"use client";

import clsx from "clsx";
import { Ban, Copy, Flag, LogOut, MoreHorizontal, Send, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { themed } from "./appearance/theme";

type ProfileCornerProps = {
  isOwn: boolean;
  blocked: boolean;
  firstName: string;
  onShare: () => void;
  onCopyLink: () => void;
  onSignOut: () => void;
  onReport: () => void;
  onBlock: () => void;
};

// Canto da capa: compartilhar e "mais opções". No seu perfil, o ⋯ guarda o que antes ficava no
// menu do avatar (copiar o link, Meus stories, Amigos e Sair); no de outra pessoa, denunciar e bloquear.
export function ProfileCorner({ isOwn, blocked, firstName, onShare, onCopyLink, onSignOut, onReport, onBlock }: ProfileCornerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const item = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-closie-panel focus-visible:bg-closie-panel";
  const close = () => setOpen(false);

  return (
    <>
      {!blocked && (
        <button type="button" onClick={onShare} aria-label={isOwn ? "Compartilhar meu perfil" : "Compartilhar perfil"} className={themed.iconButton}>
          <Send aria-hidden className="size-[18px]" />
        </button>
      )}
      <div ref={rootRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Mais opções"
          aria-expanded={open}
          className={themed.iconButton}
        >
          <MoreHorizontal aria-hidden className="size-5" />
        </button>
        {open && (
          <div className="absolute top-12 right-0 z-30 w-60 rounded-3xl border border-closie-border bg-closie-bg p-2 text-closie-text shadow-xl motion-safe:animate-[fade-up_150ms_ease-out]">
            {isOwn ? (
              <>
                <button
                  type="button"
                  className={item}
                  onClick={() => {
                    close();
                    onCopyLink();
                  }}
                >
                  <Copy aria-hidden className="size-4 text-closie-muted" />
                  Copiar meu link
                </button>
                <Link href="/daily/meus-stories" className={item} onClick={close}>
                  <Sparkles aria-hidden className="size-4 text-closie-muted" />
                  Meus stories
                </Link>
                <Link href="/daily/amigos" className={item} onClick={close}>
                  <Users aria-hidden className="size-4 text-closie-muted" />
                  Amigos
                </Link>
                <div className="my-1 h-px bg-closie-border" />
                <button type="button" className={clsx(item, "text-closie-red-hover")} onClick={onSignOut}>
                  <LogOut aria-hidden className="size-4" />
                  Sair
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={item}
                  onClick={() => {
                    close();
                    onReport();
                  }}
                >
                  <Flag aria-hidden className="size-4 text-closie-muted" />
                  Denunciar {firstName}
                </button>
                {!blocked && (
                  <button
                    type="button"
                    className={clsx(item, "text-closie-red-hover")}
                    onClick={() => {
                      close();
                      onBlock();
                    }}
                  >
                    <Ban aria-hidden className="size-4" />
                    Bloquear
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
