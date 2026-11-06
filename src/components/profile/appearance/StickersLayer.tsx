"use client";

import clsx from "clsx";
import { Minus, Plus, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { createContext, useContext, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { Sticker } from "@/lib/appearance";
import { STICKER_LABEL, StickerArt } from "./StickerArt";

export type Today = { year: string; stamp: string };

// Data de "hoje" no jeito de câmera antiga ('26 11 06) e o ano, para os adesivos de data
export function todayStamp(now: number): Today {
  const date = new Date(now);
  const two = (value: number) => String(value).padStart(2, "0");
  return {
    year: String(date.getFullYear()),
    stamp: `'${two(date.getFullYear() % 100)} ${two(date.getMonth() + 1)} ${two(date.getDate())}`,
  };
}

export type StickerEditing = {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onUpdate: (id: string, patch: { scale?: number; rotate?: number }) => void;
  onRemove: (id: string) => void;
};

// Escala da prévia encolhida (a personalização desenha o perfil menor): a barrinha do adesivo
// compensa para ficar sempre do mesmo tamanho na tela.
export const PreviewScaleContext = createContext(1);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
    >
      {children}
    </button>
  );
}

const place = (sticker: Sticker): CSSProperties => ({
  left: `${sticker.x}%`,
  top: `${sticker.y}%`,
  transform: `translate(-50%, -50%) rotate(${sticker.rotate}deg) scale(${sticker.scale})`,
});

// Adesivos na capa. No perfil: decoração pura (sem clique, sem leitor de tela), então nunca
// atrapalham. Na prévia da personalização: arrastar move; setas também; Delete remove.
export function StickersLayer({ stickers, today, editing }: { stickers: Sticker[]; today: Today; editing?: StickerEditing }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const previewScale = useContext(PreviewScaleContext);

  if (!editing) {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
        {stickers.map((sticker) => (
          <span key={sticker.id} className="absolute drop-shadow-[0_2px_3px_rgba(0,0,0,0.18)]" style={place(sticker)}>
            <StickerArt kind={sticker.kind} today={today} />
          </span>
        ))}
      </div>
    );
  }

  const edit = editing;

  function startDrag(event: PointerEvent<HTMLButtonElement>, sticker: Sticker) {
    edit.onSelect(sticker.id);
    const layer = layerRef.current;
    if (!layer || event.button !== 0) return;
    event.preventDefault();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    // Medido na hora: funciona mesmo com a prévia encolhida (escala)
    const rect = layer.getBoundingClientRect();
    const move = (moveEvent: globalThis.PointerEvent) => {
      edit.onMove(sticker.id, ((moveEvent.clientX - rect.left) / rect.width) * 100, ((moveEvent.clientY - rect.top) / rect.height) * 100);
    };
    const stop = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", stop);
      target.removeEventListener("pointercancel", stop);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", stop);
    target.addEventListener("pointercancel", stop);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, sticker: Sticker) {
    const step = event.shiftKey ? 6 : 2;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = moves[event.key];
    if (delta) {
      event.preventDefault();
      edit.onSelect(sticker.id);
      edit.onMove(sticker.id, sticker.x + delta[0], sticker.y + delta[1]);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      edit.onRemove(sticker.id);
    }
  }

  const selected = stickers.find((sticker) => sticker.id === edit.selectedId) ?? null;
  // Barrinha embaixo do adesivo (ou em cima, se ele estiver perto da borda de baixo da capa)
  const below = selected ? selected.y < 55 : true;
  const gap = selected ? 34 * selected.scale + 6 : 0;

  return (
    <div
      ref={layerRef}
      className="absolute inset-0 z-10"
      onPointerDown={(event) => {
        // Tocar na capa vazia tira a seleção
        if (event.target === event.currentTarget) edit.onSelect(null);
      }}
    >
      {stickers.map((sticker) => {
        const selected = edit.selectedId === sticker.id;
        return (
          <button
            key={sticker.id}
            type="button"
            aria-label={`${STICKER_LABEL[sticker.kind]}: arraste ou use as setas para mover, Delete para tirar`}
            aria-pressed={selected}
            onPointerDown={(event) => startDrag(event, sticker)}
            onKeyDown={(event) => onKeyDown(event, sticker)}
            className={clsx(
              "absolute cursor-grab touch-none rounded-xl p-1 drop-shadow-[0_2px_3px_rgba(0,0,0,0.18)] active:cursor-grabbing",
              selected && "outline-2 outline-offset-2 outline-[color:var(--p-accent)] outline-dashed",
            )}
            style={place(sticker)}
          >
            <StickerArt kind={sticker.kind} today={today} />
          </button>
        );
      })}
      {selected && (
        <div
          role="toolbar"
          aria-label={"Mexer em " + STICKER_LABEL[selected.kind]}
          className="absolute z-20 flex gap-0.5 rounded-full bg-[#1A1A1A]/90 p-1 shadow-lg backdrop-blur-sm"
          style={{
            left: clamp(selected.x, 26, 74) + "%",
            top: selected.y + "%",
            transform: "translate(-50%, " + (below ? gap + "px" : "calc(-100% - " + gap + "px)") + ") scale(" + 1 / previewScale + ")",
            transformOrigin: below ? "top center" : "bottom center",
          }}
        >
          <ToolbarButton label="Diminuir" onClick={() => edit.onUpdate(selected.id, { scale: selected.scale - 0.15 })}>
            <Minus aria-hidden className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Aumentar" onClick={() => edit.onUpdate(selected.id, { scale: selected.scale + 0.15 })}>
            <Plus aria-hidden className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Girar para a esquerda" onClick={() => edit.onUpdate(selected.id, { rotate: selected.rotate - 10 })}>
            <RotateCcw aria-hidden className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Girar para a direita" onClick={() => edit.onUpdate(selected.id, { rotate: selected.rotate + 10 })}>
            <RotateCw aria-hidden className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Tirar adesivo" onClick={() => edit.onRemove(selected.id)}>
            <Trash2 aria-hidden className="size-4" />
          </ToolbarButton>
        </div>
      )}
    </div>
  );
}
