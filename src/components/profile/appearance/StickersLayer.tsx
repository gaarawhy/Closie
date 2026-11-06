"use client";

import clsx from "clsx";
import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
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
  onRemove: (id: string) => void;
};

const place = (sticker: Sticker): CSSProperties => ({
  left: `${sticker.x}%`,
  top: `${sticker.y}%`,
  transform: `translate(-50%, -50%) rotate(${sticker.rotate}deg) scale(${sticker.scale})`,
});

// Adesivos na capa. No perfil: decoração pura (sem clique, sem leitor de tela), então nunca
// atrapalham. Na prévia da personalização: arrastar move; setas também; Delete remove.
export function StickersLayer({ stickers, today, editing }: { stickers: Sticker[]; today: Today; editing?: StickerEditing }) {
  const layerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={layerRef} className="absolute inset-0 z-10">
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
    </div>
  );
}
