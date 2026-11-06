"use client";

import clsx from "clsx";
import { CameraOff, ChevronLeft, Globe, Images, Loader2, Star, SwitchCamera, Users, X } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { getCloseFriends } from "@/lib/social";
import { CAPTION_MAX, publishStory, type StoryMedia, type StoryPrivacy } from "@/lib/stories";
import { checkStoryFile, prepareStoryMedia } from "@/lib/storyMedia";
import { captureFrame, useCamera, type CameraStatus, type Facing } from "./camera";
import { Notice, RoundButton, useFilePicker } from "./pickers";

type StoryFlowProps = {
  viewerId: string;
  // O perfil privado muda o que "Público" significa (só seguidores veem)
  profilePrivate: boolean;
  // Aba visível: só aí a câmera liga
  active: boolean;
  tabs: ReactNode;
  onClose: () => void;
  onPublished: () => void;
};

// Story como no Instagram/Snapchat: abre direto na câmera. Tira a foto (ou escolhe da galeria),
// escreve por cima, escolhe quem vê e publica. Fica 24 h no ar.
export function StoryFlow({ viewerId, profilePrivate, active, tabs, onClose, onPublished }: StoryFlowProps) {
  const [media, setMedia] = useState<StoryMedia | null>(null);
  const [caption, setCaption] = useState("");
  const [privacy, setPrivacy] = useState<StoryPrivacy>("followers");
  const [busy, setBusy] = useState<"preparing" | "publishing" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [closeFriends] = useState(() => getCloseFriends(viewerId).length);
  // Celular começa na câmera de trás; computador, na webcam
  const [facing, setFacing] = useState<Facing>(() => (window.matchMedia("(pointer: coarse)").matches ? "environment" : "user"));
  const videoRef = useRef<HTMLVideoElement>(null);
  const camera = useCamera(videoRef, active && !media, facing);
  const captionId = useId();

  async function loadFile(file: File | undefined) {
    if (!file) return;
    const check = checkStoryFile(file);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setError(null);
    setBusy("preparing");
    try {
      setMedia(await prepareStoryMedia(file));
    } catch {
      setError("Não deu pra abrir esse arquivo. Tente outra foto ou vídeo.");
    } finally {
      setBusy(null);
    }
  }

  const onFiles = (files: File[]) => void loadFile(files[0]);
  const gallery = useFilePicker({ accept: "image/*,video/*", onFiles });
  const cameraApp = useFilePicker({ accept: "image/*,video/*", capture: true, onFiles });

  async function shoot() {
    const video = videoRef.current;
    if (!video || camera.status !== "ready" || busy) return;
    try {
      await loadFile(await captureFrame(video, facing === "user"));
    } catch {
      setError("Não deu pra tirar a foto. Tente de novo.");
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onFiles([...(event.dataTransfer.files ?? [])]);
  }

  function backToCamera() {
    setMedia(null);
    setCaption("");
    setError(null);
  }

  function publish() {
    if (!media) return;
    setBusy("publishing");
    const result = publishStory({ ownerId: viewerId, media, caption, privacy });
    setBusy(null);
    if (!result.ok) {
      setError(
        result.reason === "storage"
          ? "Não deu pra publicar: o armazenamento do navegador está cheio. Exclua stories antigos em Meus stories e tente de novo."
          : result.message,
      );
      return;
    }
    onPublished();
  }

  // ---------- Câmera ----------
  if (!media) {
    const mirror = facing === "user";
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-black" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-[28px] bg-neutral-900 sm:rounded-[28px]">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            aria-label="Câmera"
            className={clsx("absolute inset-0 h-full w-full object-cover", mirror && "-scale-x-100", camera.status !== "ready" && "opacity-0")}
          />
          {camera.status !== "ready" && <CameraNotice status={camera.status} onRetry={camera.retry} onGallery={gallery.open} onCameraApp={cameraApp.open} />}

          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
            <RoundButton label="Fechar" onClick={onClose}>
              <X aria-hidden className="size-6" />
            </RoundButton>
          </div>

          <div className="absolute inset-x-0 top-16 space-y-2">
            {busy === "preparing" && <Notice>Preparando…</Notice>}
            {error && <Notice tone="error">{error}</Notice>}
          </div>

          <div className="absolute inset-x-0 bottom-6 flex justify-center">
            <button
              type="button"
              onClick={() => void shoot()}
              disabled={camera.status !== "ready" || busy !== null}
              aria-label="Tirar foto"
              className="size-[78px] rounded-full border-[5px] border-white bg-white/30 shadow-lg backdrop-blur-sm transition-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-90 disabled:opacity-40"
            />
          </div>
        </div>

        <div className="flex h-20 shrink-0 items-center justify-between gap-2 px-5">
          <button
            type="button"
            onClick={gallery.open}
            aria-label="Escolher da galeria"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/85 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Images aria-hidden className="size-5" />
          </button>
          {tabs}
          <RoundButton
            label="Trocar de câmera"
            onClick={() => setFacing((current) => (current === "user" ? "environment" : "user"))}
            className="bg-white/15 [@media(pointer:fine)]:invisible"
          >
            <SwitchCamera aria-hidden className="size-5" />
          </RoundButton>
        </div>
        {gallery.input}
        {cameraApp.input}
      </div>
    );
  }

  // ---------- Revisar e publicar ----------
  const options: { value: StoryPrivacy; icon: typeof Users; label: string; text: string }[] = [
    { value: "followers", icon: Users, label: "Seguidores", text: "Só quem você aprovou como seguidor." },
    {
      value: "close_friends",
      icon: Star,
      label: "Próximos",
      text:
        closeFriends > 0
          ? `Só os seus amigos próximos (${closeFriends} ${closeFriends === 1 ? "pessoa" : "pessoas"}).`
          : "Sua lista de amigos próximos ainda está vazia.",
    },
    {
      value: "public",
      icon: Globe,
      label: "Público",
      text: profilePrivate ? "Seu perfil é privado, então só seguidores veem." : "Qualquer pessoa, inclusive no Descobrir.",
    },
  ];
  const selected = options.find((option) => option.value === privacy) ?? options[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-[28px] bg-neutral-900 sm:rounded-[28px]">
        {media.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt="Prévia do story" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <video src={media.url} autoPlay muted loop playsInline aria-label="Prévia do vídeo" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/45 to-transparent p-3">
          <RoundButton label="Voltar para a câmera" onClick={backToCamera}>
            <ChevronLeft aria-hidden className="size-6" />
          </RoundButton>
          <RoundButton label="Fechar" onClick={onClose}>
            <X aria-hidden className="size-6" />
          </RoundButton>
        </div>
        {error && (
          <div className="absolute inset-x-0 top-16">
            <Notice tone="error">{error}</Notice>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pt-12 pb-5">
          <label htmlFor={captionId} className="sr-only">
            Legenda (opcional)
          </label>
          <input
            id={captionId}
            value={caption}
            maxLength={CAPTION_MAX}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Escreva algo…"
            autoComplete="off"
            className="w-full rounded-2xl bg-transparent px-2 py-2 text-center text-lg font-semibold text-white outline-none [text-shadow:0_1px_8px_rgb(0_0_0/0.6)] placeholder:text-white/75 focus-visible:bg-black/25"
          />
        </div>
      </div>

      <div className="shrink-0 px-4 pt-4 pb-4">
        <fieldset>
          <legend className="sr-only">Quem pode ver</legend>
          <div className="grid grid-cols-3 gap-2">
            {options.map((option) => {
              const Icon = option.icon;
              const checked = privacy === option.value;
              return (
                <label
                  key={option.value}
                  className={clsx(
                    "flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-white",
                    checked ? "bg-closie-red text-closie-on-red" : "bg-white/10 text-white/80 hover:bg-white/15",
                  )}
                >
                  <input type="radio" name="privacidade-story" value={option.value} checked={checked} onChange={() => setPrivacy(option.value)} className="sr-only" />
                  <Icon aria-hidden className="size-4 shrink-0" />
                  {option.label}
                </label>
              );
            })}
          </div>
          <p className="mt-2 min-h-4 text-center text-xs text-white/60">
            {selected.text}
            {privacy === "close_friends" && closeFriends === 0 && (
              <>
                {" "}
                <Link href="/daily/amigos" onClick={onClose} className="font-semibold text-white underline underline-offset-2">
                  Escolher em Amigos
                </Link>
              </>
            )}
          </p>
        </fieldset>
        <button
          type="button"
          onClick={publish}
          disabled={busy !== null}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-closie-red font-semibold text-closie-on-red transition-colors hover:bg-closie-red-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
        >
          {busy === "publishing" && <Loader2 aria-hidden className="size-5 motion-safe:animate-spin" />}
          {busy === "publishing" ? "Publicando…" : "Publicar no seu daily"}
        </button>
      </div>
    </div>
  );
}

const NOTICES: Record<Exclude<CameraStatus, "ready">, { title: string; text: string }> = {
  starting: { title: "Abrindo a câmera…", text: "" },
  denied: { title: "Sem acesso à câmera", text: "Libere a câmera para a Closie no navegador (no ícone ao lado do endereço) e tente de novo. Ou escolha da galeria." },
  unavailable: { title: "Câmera indisponível por aqui", text: "Escolha uma foto ou vídeo da galeria." },
  busy: { title: "A câmera está ocupada", text: "Ela pode estar aberta em outro app. Feche e tente de novo, ou escolha da galeria." },
  error: { title: "A câmera não abriu", text: "Tente de novo ou escolha da galeria." },
};

function CameraNotice({
  status,
  onRetry,
  onGallery,
  onCameraApp,
}: {
  status: Exclude<CameraStatus, "ready">;
  onRetry: () => void;
  onGallery: () => void;
  onCameraApp: () => void;
}) {
  const notice = NOTICES[status];
  const pill = "h-11 w-full rounded-full text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
  return (
    <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-white">
      {status === "starting" ? <Loader2 aria-hidden className="size-8 text-white/80 motion-safe:animate-spin" /> : <CameraOff aria-hidden className="size-9 text-white/80" />}
      <p className="font-semibold">{notice.title}</p>
      {notice.text && <p className="max-w-72 text-sm text-white/70">{notice.text}</p>}
      {status !== "starting" && (
        <div className="mt-2 flex w-full max-w-60 flex-col gap-2">
          {status !== "unavailable" && (
            <button type="button" onClick={onRetry} className={clsx(pill, "bg-white text-black hover:bg-white/90")}>
              Tentar de novo
            </button>
          )}
          {status === "unavailable" && (
            <button type="button" onClick={onCameraApp} className={clsx(pill, "hidden bg-white text-black hover:bg-white/90 [@media(pointer:coarse)]:block")}>
              Abrir o app da câmera
            </button>
          )}
          <button type="button" onClick={onGallery} className={clsx(pill, "bg-white/15 text-white hover:bg-white/25")}>
            Escolher da galeria
          </button>
        </div>
      )}
    </div>
  );
}
