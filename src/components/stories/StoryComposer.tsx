"use client";

import clsx from "clsx";
import { Globe, ImagePlus, Loader2, Star, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { getCloseFriends } from "@/lib/social";
import { CAPTION_MAX, publishStory, type StoryMedia, type StoryPrivacy } from "@/lib/stories";
import { checkStoryFile, prepareStoryMedia } from "@/lib/storyMedia";

type StoryComposerProps = {
  viewerId: string;
  // O perfil privado muda o que "Público" significa (só seguidores veem)
  profilePrivate: boolean;
  onClose: () => void;
  onPublished: () => void;
};

// Publicar um story: escolher (ou arrastar) foto/vídeo, ver a prévia, legenda opcional e quem pode ver.
// <dialog> nativo: prende o foco e fecha com Esc. No celular ocupa a tela toda.
export function StoryComposer({ viewerId, profilePrivate, onClose, onPublished }: StoryComposerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputId = useId();
  const titleId = useId();
  const [media, setMedia] = useState<StoryMedia | null>(null);
  const [caption, setCaption] = useState("");
  const [privacy, setPrivacy] = useState<StoryPrivacy>("followers");
  const [busy, setBusy] = useState<"preparing" | "publishing" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [closeFriends] = useState(() => getCloseFriends(viewerId).length);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

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

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    void loadFile(file);
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    void loadFile(event.dataTransfer.files?.[0]);
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

  const options: { value: StoryPrivacy; icon: typeof Users; label: string; text: string }[] = [
    { value: "followers", icon: Users, label: "Seguidores", text: "Só quem você aprovou como seguidor." },
    {
      value: "close_friends",
      icon: Star,
      label: "Amigos próximos",
      text: closeFriends > 0 ? `Só a sua lista (${closeFriends} ${closeFriends === 1 ? "pessoa" : "pessoas"}).` : "Sua lista ainda está vazia.",
    },
    {
      value: "public",
      icon: Globe,
      label: "Público",
      text: profilePrivate ? "Seu perfil é privado, então só seguidores veem." : "Qualquer pessoa, inclusive no Descobrir.",
    },
  ];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-closie-bg text-closie-text backdrop:bg-black/60 sm:m-auto sm:h-auto sm:max-h-[92dvh] sm:w-[min(92vw,440px)] sm:rounded-[28px] sm:shadow-2xl"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 id={titleId} className="text-xl font-semibold tracking-tight">
            Novo story
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="-mr-2 flex size-10 items-center justify-center rounded-full hover:bg-closie-panel">
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-5">
          {!media ? (
            <label
              htmlFor={inputId}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={clsx(
                "flex aspect-[9/14] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 text-center transition-colors",
                dragging ? "border-closie-red bg-closie-red-soft" : "border-closie-border-strong/60 bg-closie-panel hover:border-closie-text",
              )}
            >
              {busy === "preparing" ? (
                <Loader2 aria-hidden className="size-8 text-closie-muted motion-safe:animate-spin" />
              ) : (
                <ImagePlus aria-hidden className="size-9 text-closie-muted" />
              )}
              <span className="font-semibold">{busy === "preparing" ? "Preparando…" : "Escolher foto ou vídeo"}</span>
              <span className="text-sm text-closie-muted">ou arraste o arquivo para cá</span>
              <span className="text-xs text-closie-muted">Fotos até 15 MB · vídeos até 2 MB (modo de demonstração)</span>
            </label>
          ) : (
            <div className="relative mx-auto aspect-[9/16] w-full max-w-[220px] overflow-hidden rounded-3xl bg-closie-text">
              {media.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.url} alt="Prévia do story" className="h-full w-full object-cover" />
              ) : (
                <video src={media.url} autoPlay muted loop playsInline aria-label="Prévia do vídeo" className="h-full w-full object-cover" />
              )}
              <label
                htmlFor={inputId}
                className="absolute top-3 right-3 cursor-pointer rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/70"
              >
                Trocar
              </label>
              {caption.trim() && (
                <p className="absolute inset-x-0 bottom-6 px-4 text-center font-semibold text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.6)]">
                  {caption.trim()}
                </p>
              )}
            </div>
          )}
          <input id={inputId} type="file" accept="image/*,video/*" className="sr-only" onChange={onPick} />

          {media && (
            <>
              <TextArea
                className="mt-5"
                label="Legenda (opcional)"
                rows={2}
                maxLength={CAPTION_MAX}
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
              />
              <fieldset className="mt-5">
                <legend className="text-sm font-semibold">Quem pode ver</legend>
                <div className="mt-2 flex flex-col gap-2">
                  {options.map((option) => {
                    const Icon = option.icon;
                    const checked = privacy === option.value;
                    return (
                      <label
                        key={option.value}
                        className={clsx(
                          "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
                          checked ? "border-closie-text ring-1 ring-closie-text ring-inset" : "border-closie-border-strong/60 hover:border-closie-text",
                        )}
                      >
                        <input
                          type="radio"
                          name="privacidade-story"
                          value={option.value}
                          checked={checked}
                          onChange={() => setPrivacy(option.value)}
                          className="sr-only"
                        />
                        <Icon aria-hidden className={clsx("size-5 shrink-0", checked ? "text-closie-red" : "text-closie-muted")} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{option.label}</span>
                          <span className="block text-xs text-closie-muted">{option.text}</span>
                        </span>
                        <span
                          aria-hidden
                          className={clsx(
                            "size-5 shrink-0 rounded-full border-2",
                            checked ? "border-closie-red bg-closie-red shadow-[inset_0_0_0_3px_white]" : "border-closie-border-strong",
                          )}
                        />
                      </label>
                    );
                  })}
                </div>
                {privacy === "close_friends" && closeFriends === 0 && (
                  <p className="mt-2 text-xs text-closie-muted">
                    Escolha sua lista em{" "}
                    <Link href="/daily/amigos" className="font-semibold text-closie-link underline-offset-2 hover:underline">
                      Amigos
                    </Link>{" "}
                    (marque a estrela de quem é próximo).
                  </p>
                )}
              </fieldset>
            </>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-2xl bg-closie-red-soft px-4 py-3 text-sm text-closie-red-hover">
              {error}
            </p>
          )}
        </div>

        {media && (
          <div className="border-t border-closie-border px-5 py-4">
            <Button size="lg" className="w-full" loading={busy === "publishing"} onClick={publish}>
              {busy === "publishing" ? "Publicando…" : "Publicar no seu daily"}
            </Button>
          </div>
        )}
      </div>
    </dialog>
  );
}
