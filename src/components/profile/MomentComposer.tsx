"use client";

import clsx from "clsx";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { checkPostFiles, preparePostPhoto } from "@/lib/postMedia";
import { POST_CAPTION_MAX, POST_PHOTOS_MAX, createPost, type NewPhoto } from "@/lib/posts";

type MomentComposerProps = {
  viewerId: string;
  onClose: () => void;
  onPublished: () => void;
};

// Novo momento: várias fotos viram UM álbum. A primeira é a capa (toque em outra para trocar).
// <dialog> nativo: prende o foco e fecha com Esc. No celular ocupa a tela toda.
export function MomentComposer({ viewerId, onClose, onPublished }: MomentComposerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputId = useId();
  const titleId = useId();
  const [photos, setPhotos] = useState<(NewPhoto & { key: string })[]>([]);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState<"preparing" | "publishing" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  async function addFiles(list: FileList | null | undefined) {
    const files = list ? [...list] : [];
    if (files.length === 0) return;
    const problem = checkPostFiles(files, photos.length);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy("preparing");
    try {
      const prepared: (NewPhoto & { key: string })[] = [];
      for (const file of files) prepared.push({ ...(await preparePostPhoto(file)), key: crypto.randomUUID() });
      setPhotos((current) => [...current, ...prepared]);
    } catch {
      setError("Não deu pra abrir uma das fotos. Tente outra.");
    } finally {
      setBusy(null);
    }
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    void addFiles(files).finally(() => {
      event.target.value = "";
    });
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    void addFiles(event.dataTransfer.files);
  }

  function makeCover(key: string) {
    setPhotos((current) => {
      const chosen = current.find((photo) => photo.key === key);
      return chosen ? [chosen, ...current.filter((photo) => photo.key !== key)] : current;
    });
  }

  function publish() {
    if (photos.length === 0) return;
    setBusy("publishing");
    const result = createPost({ ownerId: viewerId, photos: photos.map(({ url, width, height }) => ({ url, width, height })), caption });
    setBusy(null);
    if (!result.ok) {
      setError(
        result.reason === "storage"
          ? "Não deu pra publicar: o armazenamento do navegador está cheio. Tente com menos fotos ou exclua momentos antigos."
          : result.message,
      );
      return;
    }
    onPublished();
  }

  const canAddMore = photos.length < POST_PHOTOS_MAX;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-closie-bg p-0 text-closie-text backdrop:bg-black/60 sm:m-auto sm:h-auto sm:max-h-[92dvh] sm:w-[min(92vw,560px)] sm:rounded-[28px] sm:shadow-2xl"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 id={titleId} className="text-xl font-semibold tracking-tight">
              Novo momento
            </h2>
            <p className="text-sm text-closie-muted">Junte as fotos de um dia, de uma viagem ou de um rolê num álbum só.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="-mr-2 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-closie-panel">
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-5">
          {photos.length === 0 ? (
            <label
              htmlFor={inputId}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={clsx(
                "flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 text-center transition-colors",
                dragging ? "border-closie-red bg-closie-red-soft" : "border-closie-border-strong/60 bg-closie-panel hover:border-closie-text",
              )}
            >
              {busy === "preparing" ? (
                <Loader2 aria-hidden className="size-8 text-closie-muted motion-safe:animate-spin" />
              ) : (
                <ImagePlus aria-hidden className="size-9 text-closie-muted" />
              )}
              <span className="font-semibold">{busy === "preparing" ? "Preparando as fotos…" : "Escolher fotos"}</span>
              <span className="text-sm text-closie-muted">ou arraste para cá · até {POST_PHOTOS_MAX} fotos</span>
            </label>
          ) : (
            <>
              <ul className="scrollbar-none -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1" aria-label="Fotos do momento">
                {photos.map((photo, position) => (
                  <li key={photo.key} className="relative h-36 w-28 shrink-0">
                    <button
                      type="button"
                      onClick={() => makeCover(photo.key)}
                      disabled={position === 0}
                      aria-label={position === 0 ? "Capa do momento" : `Usar a foto ${position + 1} como capa`}
                      className={clsx(
                        "block h-full w-full overflow-hidden rounded-2xl bg-closie-panel",
                        position === 0 && "ring-2 ring-closie-red ring-offset-2 ring-offset-closie-bg",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt="" className="h-full w-full object-cover" />
                    </button>
                    {position === 0 && (
                      <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-closie-red px-2 py-0.5 text-[11px] font-semibold text-closie-on-red">
                        Capa
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPhotos((current) => current.filter((item) => item.key !== photo.key))}
                      aria-label={`Tirar a foto ${position + 1}`}
                      className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75"
                    >
                      <X aria-hidden className="size-4" />
                    </button>
                  </li>
                ))}
                {canAddMore && (
                  <li className="h-36 w-28 shrink-0">
                    <label
                      htmlFor={inputId}
                      className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-closie-border-strong/60 text-sm font-semibold text-closie-muted hover:border-closie-text hover:text-closie-text"
                    >
                      {busy === "preparing" ? <Loader2 aria-hidden className="size-5 motion-safe:animate-spin" /> : <Plus aria-hidden className="size-5" />}
                      Mais fotos
                    </label>
                  </li>
                )}
              </ul>
              <p className="mt-2 text-xs text-closie-muted">
                {photos.length} de {POST_PHOTOS_MAX} fotos · toque numa foto para fazer dela a capa
              </p>
              <TextArea
                className="mt-4"
                label="Legenda (opcional)"
                rows={3}
                maxLength={POST_CAPTION_MAX}
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
              />
            </>
          )}
          <input id={inputId} type="file" accept="image/*" multiple className="sr-only" onChange={onPick} />

          {error && (
            <p role="alert" className="mt-4 rounded-2xl bg-closie-red-soft px-4 py-3 text-sm text-closie-red-hover">
              {error}
            </p>
          )}
        </div>

        {photos.length > 0 && (
          <div className="border-t border-closie-border px-5 py-4">
            <Button size="lg" className="w-full" loading={busy === "publishing"} disabled={busy === "preparing"} onClick={publish}>
              {photos.length > 1 ? `Publicar momento com ${photos.length} fotos` : "Publicar momento"}
            </Button>
          </div>
        )}
      </div>
    </dialog>
  );
}
