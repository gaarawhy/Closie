"use client";

import clsx from "clsx";
import { Camera, ChevronLeft, ImagePlus, Images, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { checkPostFiles, preparePostPhoto } from "@/lib/postMedia";
import { POST_CAPTION_MAX, POST_PHOTOS_MAX, createPost, type NewPhoto } from "@/lib/posts";
import { Notice, RoundButton, useFilePicker } from "./pickers";

type MomentFlowProps = {
  viewerId: string;
  // Aba visível: ao aparecer vazia, já abre a galeria
  active: boolean;
  tabs: ReactNode;
  onClose: () => void;
  onPublished: () => void;
};

type DraftPhoto = NewPhoto & { key: string };

// Momento como o "Novo post" do Instagram: a galeria abre na hora; as fotos escolhidas aparecem
// numa prévia grande com a grade embaixo (numeradas na ordem do álbum; a 1ª é a capa).
// Avançar → legenda → publicar. O site não consegue listar a galeria sozinho: quem mostra as
// fotos do aparelho é o seletor do sistema, que abre assim que a aba aparece.
export function MomentFlow({ viewerId, active, tabs, onClose, onPublished }: MomentFlowProps) {
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "details">("select");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState<"preparing" | "publishing" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const captionId = useId();

  async function addFiles(files: File[]) {
    if (files.length === 0) return;
    const problem = checkPostFiles(files, photos.length);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy("preparing");
    try {
      const prepared: DraftPhoto[] = [];
      for (const file of files) prepared.push({ ...(await preparePostPhoto(file)), key: crypto.randomUUID() });
      setPhotos((current) => [...current, ...prepared]);
      setFocusKey(prepared[0]?.key ?? null);
    } catch {
      setError("Não deu pra abrir uma das fotos. Tente outra.");
    } finally {
      setBusy(null);
    }
  }

  const onFiles = (files: File[]) => void addFiles(files);
  const gallery = useFilePicker({ accept: "image/*", multiple: true, onFiles });
  const cameraApp = useFilePicker({ accept: "image/*", capture: true, onFiles });

  // A galeria abre sozinha quando a aba aparece sem fotos (uma vez por visita à aba)
  const autoOpened = useRef(false);
  const openGallery = gallery.open;
  useEffect(() => {
    if (!active) {
      autoOpened.current = false;
      return;
    }
    if (autoOpened.current || photos.length > 0) return;
    autoOpened.current = true;
    openGallery();
  }, [active, photos.length, openGallery]);

  const focusedIndex = Math.max(
    0,
    photos.findIndex((photo) => photo.key === focusKey),
  );
  const focused = photos[focusedIndex] ?? null;

  function remove(key: string) {
    setPhotos((current) => current.filter((photo) => photo.key !== key));
    setFocusKey(null);
  }

  function makeCover(key: string) {
    setPhotos((current) => {
      const chosen = current.find((photo) => photo.key === key);
      return chosen ? [chosen, ...current.filter((photo) => photo.key !== key)] : current;
    });
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onFiles([...(event.dataTransfer.files ?? [])]);
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

  const header = (left: ReactNode, right: ReactNode) => (
    <div className="grid h-14 shrink-0 grid-cols-[5.5rem_1fr_5.5rem] items-center px-2">
      <div className="justify-self-start">{left}</div>
      <h3 className="text-center text-base font-semibold">Novo momento</h3>
      <div className="justify-self-end">{right}</div>
    </div>
  );

  // ---------- Legenda e publicar ----------
  if (step === "details" && photos.length > 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-black">
        {header(
          <RoundButton label="Voltar para as fotos" onClick={() => setStep("select")} className="bg-transparent">
            <ChevronLeft aria-hidden className="size-6" />
          </RoundButton>,
          null,
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <div className="relative mx-auto mt-2 aspect-[4/5] w-44 overflow-hidden rounded-2xl bg-neutral-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[0].url} alt="Capa do momento" className="h-full w-full object-cover" />
            {photos.length > 1 && (
              <span className="absolute top-2 right-2 rounded-full bg-black/65 px-2 py-0.5 text-xs font-semibold">1/{photos.length}</span>
            )}
          </div>
          <label htmlFor={captionId} className="sr-only">
            Legenda (opcional)
          </label>
          <textarea
            id={captionId}
            rows={4}
            maxLength={POST_CAPTION_MAX}
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Adicione uma legenda…"
            className="mt-5 w-full resize-none rounded-2xl bg-white/[0.06] px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/45 focus-visible:ring-2 focus-visible:ring-white/60"
          />
          <p className="mt-1 text-right text-xs text-white/40">
            {caption.length}/{POST_CAPTION_MAX}
          </p>
          <p className="mt-3 text-sm text-white/60">
            {photos.length === 1 ? "1 foto" : `${photos.length} fotos`} · vai para Momentos, no seu perfil.
          </p>
          {error && (
            <div className="mt-4">
              <Notice tone="error">{error}</Notice>
            </div>
          )}
        </div>
        <div className="shrink-0 px-4 pt-2 pb-4">
          <button
            type="button"
            onClick={publish}
            disabled={busy !== null}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-closie-red font-semibold text-closie-on-red transition-colors hover:bg-closie-red-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
          >
            {busy === "publishing" && <Loader2 aria-hidden className="size-5 motion-safe:animate-spin" />}
            {busy === "publishing" ? "Publicando…" : "Publicar momento"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Escolher as fotos ----------
  const canAddMore = photos.length < POST_PHOTOS_MAX;
  const tile = "relative flex aspect-square w-full items-center justify-center overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-black" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
      {header(
        <RoundButton label="Fechar" onClick={onClose} className="bg-transparent">
          <X aria-hidden className="size-6" />
        </RoundButton>,
        <button
          type="button"
          onClick={() => setStep("details")}
          disabled={photos.length === 0 || busy !== null}
          className="h-10 rounded-full px-3 text-[15px] font-semibold text-closie-red transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white disabled:text-white/30 disabled:hover:bg-transparent"
        >
          Avançar
        </button>,
      )}

      <div className="relative aspect-[4/5] max-h-[46dvh] w-full shrink-0 bg-neutral-900">
        {focused ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={focused.url} alt={`Foto ${focusedIndex + 1} do momento`} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
              {focusedIndex === 0 ? (
                <span className="rounded-full bg-closie-red px-3 py-1.5 text-xs font-semibold text-closie-on-red">Capa</span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(focused.key)}
                  className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-white"
                >
                  Usar como capa
                </button>
              )}
              <RoundButton label={`Tirar a foto ${focusedIndex + 1}`} onClick={() => remove(focused.key)} className="size-9">
                <Trash2 aria-hidden className="size-4" />
              </RoundButton>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <Images aria-hidden className="size-10 text-white/75" />
            <p className="font-semibold">Escolha as fotos do álbum</p>
            <p className="text-sm text-white/60">Até {POST_PHOTOS_MAX} fotos. A primeira vira a capa.</p>
            <button
              type="button"
              onClick={gallery.open}
              className="mt-1 h-11 rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Abrir a galeria
            </button>
            <p className="text-xs text-white/45 [@media(pointer:coarse)]:hidden">ou arraste as fotos para cá</p>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-3 space-y-2">
          {busy === "preparing" && <Notice>Preparando as fotos…</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
        </div>
      </div>

      <div className="flex h-12 shrink-0 items-center justify-between px-4">
        <span className="text-sm font-semibold">
          Fotos <span className="font-normal text-white/55">{photos.length}/{POST_PHOTOS_MAX}</span>
        </span>
        {photos.length > 1 && <span className="text-xs text-white/55">a 1ª é a capa</span>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-24">
        <ul className="grid grid-cols-4 gap-0.5" aria-label="Fotos do momento">
          <li className="[@media(pointer:fine)]:hidden">
            <button type="button" onClick={cameraApp.open} disabled={!canAddMore || busy !== null} aria-label="Tirar foto com a câmera" className={clsx(tile, "bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40")}>
              <Camera aria-hidden className="size-7" />
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={gallery.open}
              disabled={!canAddMore || busy !== null}
              className={clsx(tile, "flex-col gap-1 bg-neutral-800 text-xs font-semibold hover:bg-neutral-700 disabled:opacity-40")}
            >
              {busy === "preparing" ? <Loader2 aria-hidden className="size-6 motion-safe:animate-spin" /> : <ImagePlus aria-hidden className="size-6" />}
              Galeria
            </button>
          </li>
          {photos.map((photo, position) => {
            const current = photo.key === focused?.key;
            return (
              <li key={photo.key}>
                <button type="button" onClick={() => setFocusKey(photo.key)} aria-label={`Ver a foto ${position + 1}`} aria-pressed={current} className={tile}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className={clsx("absolute inset-0 h-full w-full object-cover", current && "opacity-60")} />
                  <span
                    aria-hidden
                    className={clsx(
                      "absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border-2 border-white text-xs font-bold",
                      position === 0 ? "bg-closie-red" : "bg-black/45",
                    )}
                  >
                    {position + 1}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <div className="pointer-events-auto rounded-full bg-neutral-900/85 px-2 py-1 shadow-lg backdrop-blur">{tabs}</div>
      </div>
      {gallery.input}
      {cameraApp.input}
    </div>
  );
}
