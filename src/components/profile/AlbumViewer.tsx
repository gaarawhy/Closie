"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, Heart, MoreHorizontal, Pencil, Send, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { slideIndexFromScroll } from "@/components/ui/carousel";
import { TextArea } from "@/components/ui/TextArea";
import {
  POST_CAPTION_MAX,
  deletePost,
  hasLikedPost,
  momentDate,
  postLikeCount,
  togglePostLike,
  updatePostCaption,
  usePostsSnapshot,
  type Post,
} from "@/lib/posts";
import type { Person } from "@/lib/social";
import { profileHref, shareLink, shareableUrl } from "./links";

type AlbumViewerProps = {
  post: Post;
  owner: Person;
  viewerId: string;
  viewerUsername: string | null;
  now: number;
  onClose: () => void;
  onDeleted: () => void;
  onNotify: (message: string) => void;
};

type Panel = "view" | "menu" | "edit" | "delete";

// Um momento aberto: as fotos do álbum (arrasta para o lado, setas ou ← →), a legenda e a data,
// curtir, compartilhar e quem postou. O dono edita a legenda e exclui. <dialog> nativo: prende
// o foco e fecha com Esc. No celular ocupa a tela; no computador, foto à esquerda e detalhes à direita.
export function AlbumViewer({ post, owner, viewerId, viewerUsername, now, onClose, onDeleted, onNotify }: AlbumViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [index, setIndex] = useState(0);
  const [panel, setPanel] = useState<Panel>("view");
  const [draft, setDraft] = useState(post.caption ?? "");
  const [shareNote, setShareNote] = useState<string | null>(null);
  const snapshot = usePostsSnapshot();
  const isOwner = post.ownerId === viewerId;
  const name = owner.displayName ?? owner.username;
  const count = post.photos.length;
  const current = Math.min(index, count - 1);

  const likes = useMemo(() => {
    void snapshot;
    return { liked: hasLikedPost(post.id, viewerId), total: postLikeCount(post.id) };
  }, [snapshot, post.id, viewerId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function goTo(target: number) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const next = Math.max(0, Math.min(count - 1, target));
    scroller.scrollTo({ left: next * scroller.clientWidth, behavior: "smooth" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(current + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(current - 1);
    }
  }

  function toggleLike() {
    const result = togglePostLike(post.id, viewerId);
    if (!result.ok) onNotify(result.message);
  }

  async function share() {
    const path = `${profileHref(owner.username)}?momento=${post.id}`;
    const result = await shareLink(shareableUrl(path), `Momento de ${name} na Closie`);
    setShareNote(result === "copied" ? "Link copiado" : result === "failed" ? "Não deu pra compartilhar" : null);
    if (result !== "shared") window.setTimeout(() => setShareNote(null), 2200);
  }

  function saveCaption() {
    const result = updatePostCaption(post.id, viewerId, draft);
    if (!result.ok) {
      onNotify(result.message);
      return;
    }
    setPanel("view");
  }

  function remove() {
    const result = deletePost(post.id, viewerId);
    if (!result.ok) {
      onNotify(result.message);
      return;
    }
    onDeleted();
  }

  const date = momentDate(post.createdAt, now);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (panel !== "view") setPanel("view");
        else onClose();
      }}
      onKeyDown={onKeyDown}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-black p-0 text-white backdrop:bg-black/70 md:m-auto md:h-[min(88dvh,780px)] md:w-[min(94vw,1120px)] md:rounded-[28px]"
    >
      <div className="flex h-full flex-col md:flex-row">
        {/* Fotos */}
        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollerRef}
            onScroll={(event) => setIndex(slideIndexFromScroll(event.currentTarget.scrollLeft, event.currentTarget.clientWidth, count))}
            className="scrollbar-none flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          >
            {post.photos.map((photo, position) => (
              <div key={photo.id} className="flex h-full w-full shrink-0 snap-center snap-always items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`Foto ${position + 1} de ${count}${post.caption ? ` — ${post.caption}` : ""}`}
                  draggable={false}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-linear-to-b from-black/55 to-transparent p-3 pb-10">
            {count > 1 ? (
              <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-semibold">
                {current + 1} de {count}
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar momento"
              className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-black/45 hover:bg-black/60 md:hidden"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>

          {count > 1 && (
            <>
              {current > 0 && (
                <button
                  type="button"
                  onClick={() => goTo(current - 1)}
                  aria-label="Foto anterior"
                  className="absolute top-1/2 left-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-closie-text shadow-md hover:bg-white md:flex"
                >
                  <ChevronLeft aria-hidden className="size-5" />
                </button>
              )}
              {current < count - 1 && (
                <button
                  type="button"
                  onClick={() => goTo(current + 1)}
                  aria-label="Próxima foto"
                  className="absolute top-1/2 right-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-closie-text shadow-md hover:bg-white md:flex"
                >
                  <ChevronRight aria-hidden className="size-5" />
                </button>
              )}
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                {post.photos.map((photo, position) => (
                  <span
                    key={photo.id}
                    className={clsx("h-1.5 rounded-full transition-all", position === current ? "w-5 bg-white" : "w-1.5 bg-white/45")}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Detalhes */}
        <aside className="flex max-h-[46dvh] shrink-0 flex-col bg-closie-bg text-closie-text md:max-h-none md:w-[360px] md:border-l md:border-closie-border">
          <header className="flex items-center gap-3 border-b border-closie-border px-4 py-3">
            <Link
              href={profileHref(owner.username, viewerUsername)}
              onClick={onClose}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl"
            >
              <Avatar name={name} src={owner.avatar ?? undefined} size={40} />
              <span className="min-w-0 leading-tight">
                <span id={titleId} className="block truncate text-sm font-semibold hover:underline">
                  {name}
                </span>
                <span className="block truncate text-xs text-closie-muted">@{owner.username}</span>
              </span>
            </Link>
            {isOwner && (
              <button
                type="button"
                onClick={() => setPanel(panel === "menu" ? "view" : "menu")}
                aria-label="Opções do momento"
                aria-expanded={panel === "menu"}
                className="flex size-10 items-center justify-center rounded-full text-closie-muted hover:bg-closie-panel"
              >
                <MoreHorizontal aria-hidden className="size-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar momento"
              className="hidden size-10 items-center justify-center rounded-full text-closie-muted hover:bg-closie-panel md:flex"
            >
              <X aria-hidden className="size-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {panel === "menu" && (
              <div className="mb-4 flex flex-col gap-1 rounded-2xl bg-closie-panel p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(post.caption ?? "");
                    setPanel("edit");
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-closie-bg"
                >
                  <Pencil aria-hidden className="size-4 text-closie-muted" />
                  Editar legenda
                </button>
                <button
                  type="button"
                  onClick={() => setPanel("delete")}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-closie-red-hover hover:bg-closie-bg"
                >
                  <Trash2 aria-hidden className="size-4" />
                  Excluir momento
                </button>
              </div>
            )}

            {panel === "edit" ? (
              <div className="flex flex-col gap-3">
                <TextArea
                  label="Legenda"
                  rows={3}
                  maxLength={POST_CAPTION_MAX}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1 rounded-full" onClick={() => setPanel("view")}>
                    Cancelar
                  </Button>
                  <Button size="sm" className="flex-1 rounded-full" onClick={saveCaption}>
                    Salvar legenda
                  </Button>
                </div>
              </div>
            ) : panel === "delete" ? (
              <div className="rounded-2xl bg-closie-red-soft p-4">
                <p className="font-semibold">Excluir esse momento?</p>
                <p className="mt-1 text-sm text-closie-muted">
                  {count > 1 ? `As ${count} fotos e as curtidas somem.` : "A foto e as curtidas somem."} Não dá pra desfazer.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1 rounded-full" onClick={() => setPanel("view")}>
                    Cancelar
                  </Button>
                  <Button size="sm" className="flex-1 rounded-full" onClick={remove}>
                    Excluir
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {post.caption ? (
                  <p className="text-[15px] leading-relaxed whitespace-pre-line break-words">{post.caption}</p>
                ) : (
                  <p className="text-sm text-closie-muted">Sem legenda.</p>
                )}
                <p className="mt-2 text-xs text-closie-muted">
                  {date}
                  {post.editedAt && " · editado"}
                  {count > 1 && ` · ${count} fotos`}
                </p>
              </>
            )}
          </div>

          <footer className="flex items-center gap-1 border-t border-closie-border px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={toggleLike}
              aria-pressed={likes.liked}
              aria-label={likes.liked ? "Descurtir" : "Curtir"}
              className="flex h-11 items-center gap-2 rounded-full px-3 transition-colors hover:bg-closie-panel"
            >
              <Heart
                key={String(likes.liked)}
                aria-hidden
                className={clsx("size-6", likes.liked && "fill-closie-red text-closie-red motion-safe:animate-[like-pop_320ms_ease-out]")}
              />
              <span className="text-sm font-semibold">
                {likes.total} {likes.total === 1 ? "curtida" : "curtidas"}
              </span>
            </button>
            <button
              type="button"
              onClick={share}
              className="ml-auto flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors hover:bg-closie-panel"
            >
              <Send aria-hidden className="size-5" />
              <span aria-live="polite">{shareNote ?? "Compartilhar"}</span>
            </button>
          </footer>
        </aside>
      </div>
    </dialog>
  );
}
