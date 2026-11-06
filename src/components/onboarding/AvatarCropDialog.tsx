"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/Button";
import { cropAvatar, type CropArea } from "@/lib/avatar";

type AvatarCropDialogProps = {
  // Endereço da foto escolhida (URL.createObjectURL); o componente só existe enquanto há foto
  src: string;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

// Janela para enquadrar a foto antes de usar: arrastar move, o controle (ou a rodinha / pinça)
// aproxima, o círculo mostra como vai ficar. <dialog> nativo: prende o foco e fecha com Esc.
export function AvatarCropDialog({ src, onCancel, onConfirm }: AvatarCropDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const zoomId = useId();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [area, setArea] = useState<CropArea | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  async function confirm() {
    if (!area) return;
    setSaving(true);
    try {
      onConfirm(await cropAvatar(src, area));
    } catch {
      setSaving(false);
      setError("Não deu pra usar essa foto. Tente outra (JPG, PNG ou WebP).");
    }
  }

  const changeZoom = (value: number) => setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)));

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Esc: quem fecha é o pai (desmonta este componente)
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(92vw,420px)] rounded-[28px] bg-closie-bg p-6 text-closie-text shadow-2xl backdrop:bg-black/60"
    >
      <h2 id={titleId} className="text-xl font-semibold tracking-tight">
        Ajuste sua foto
      </h2>
      <p className="mt-1 text-sm text-closie-muted">Arraste para enquadrar e use o controle para aproximar.</p>

      <div className="relative mt-5 h-72 w-full overflow-hidden rounded-2xl bg-closie-text">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
          mediaProps={{ alt: "Foto escolhida para o perfil", onError: () => setError("Não deu pra abrir essa foto. Tente outra (JPG, PNG ou WebP).") }}
          cropperProps={{ "aria-label": "Área de recorte: use as setas para mover a foto" }}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          aria-label="Afastar"
          onClick={() => changeZoom(zoom - 0.2)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-closie-text hover:bg-closie-panel"
        >
          <Minus aria-hidden className="size-4" />
        </button>
        <label htmlFor={zoomId} className="sr-only">
          Zoom
        </label>
        <input
          id={zoomId}
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(event) => changeZoom(Number(event.target.value))}
          className="h-1.5 flex-1 cursor-pointer accent-closie-red"
        />
        <button
          type="button"
          aria-label="Aproximar"
          onClick={() => changeZoom(zoom + 0.2)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-closie-text hover:bg-closie-panel"
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-closie-red-hover">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="lg" className="flex-1" loading={saving} disabled={!area || Boolean(error)} onClick={confirm}>
          Usar foto
        </Button>
      </div>
    </dialog>
  );
}
