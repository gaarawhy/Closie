"use client";

import clsx from "clsx";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  Heart,
  Loader2,
  MoreHorizontal,
  Send,
  SmilePlus,
  Star,
  Trash2,
  Volume2,
  VolumeX,
  X,
  BellOff,
  Bell,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { followMessage } from "@/components/daily/messages";
import { Avatar } from "@/components/ui/Avatar";
import { block, follow, followStatus, isMuted, mute, unmute, useSocialSnapshot } from "@/lib/social";
import {
  REPORT_REASONS,
  STORY_REACTIONS,
  deleteStory,
  getStory,
  getStoryViewers,
  hasLiked,
  replyToStory,
  reportStory,
  sendStoryReaction,
  timeAgo,
  toggleStoryLike,
  useNow,
  useStoriesSnapshot,
  useStoryViewer,
  type FeedGroup,
  type InteractionFailure,
  type ViewerGroupRef,
} from "@/lib/stories";
import { classifyGesture, HOLD_MS, type Gesture } from "./gesture";
import { StoryInsights } from "./StoryInsights";
import { firstName } from "./StoriesRail";

type StoryViewerProps = {
  viewerId: string;
  groups: FeedGroup[];
  startGroupIndex: number;
  onClose: () => void;
  onNotify: (message: string) => void;
};

const REPORT_LABELS: Record<(typeof REPORT_REASONS)[number], string> = {
  spam: "Spam ou golpe",
  nudez: "Nudez ou conteúdo sexual",
  violencia: "Violência",
  assedio: "Assédio ou bullying",
  outro: "Outro motivo",
};

const UNAVAILABLE = {
  expired: "Esse story expirou.",
  deleted: "Esse story foi excluído.",
  blocked: "Você não pode ver esse story.",
  forbidden: "Você não tem permissão para ver esse story.",
} as const;

type Sheet = null | "menu" | "report" | "block" | "delete" | "insights";

// O que o Tab alcança dentro do leitor (o que está escondido nesta largura de tela fica de fora)
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
const focusables = (scope: HTMLElement) =>
  [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) => element.getClientRects().length > 0);

function failureText(reason: InteractionFailure["reason"]): string {
  switch (reason) {
    case "storage":
      return "Não deu pra salvar: o armazenamento do navegador está cheio.";
    case "expired":
      return "Esse story expirou.";
    case "deleted":
    case "not_found":
      return "Esse story não existe mais.";
    case "invalid":
      return "Não deu pra enviar. Confira e tente de novo.";
    default:
      return "Você não pode interagir com esse story.";
  }
}

// Leitor em tela cheia. Toque na direita avança, na esquerda volta, segurar pausa, deslizar para
// o lado troca de pessoa e para baixo fecha. Teclado: setas, espaço e Esc.
export function StoryViewer({ viewerId, groups, startGroupIndex, onClose, onNotify }: StoryViewerProps) {
  // Lista guardada na abertura: nada muda de lugar enquanto a pessoa assiste
  const [refs] = useState<ViewerGroupRef[]>(() =>
    groups.map((group) => ({
      ownerId: group.owner.id,
      storyIds: group.stories.map((story) => story.id),
      startIndex: group.startIndex,
    })),
  );
  const [snapshotOwners] = useState(() => new Map(groups.map((group) => [group.owner.id, group.owner])));
  const viewer = useStoryViewer(viewerId, refs, startGroupIndex);
  const { story, status, hold, release, nextStory, prevStory, close: closeViewer } = viewer;
  const social = useSocialSnapshot();
  const stories = useStoriesSnapshot();
  const now = useNow(60_000);

  const owner = viewer.owner ?? (story ? (snapshotOwners.get(story.ownerId) ?? null) : null);
  const ownerName = owner ? (owner.displayName ?? owner.username) : "";
  const ownerFirst = owner ? firstName(owner) : "";
  const isOwn = story?.ownerId === viewerId;
  const unavailable = status === "expired" || status === "deleted" || status === "blocked" || status === "forbidden";
  const groupSize = refs[viewer.groupIndex]?.storyIds.length ?? 0;

  const [sheet, setSheet] = useState<Sheet>(null);
  const [typing, setTyping] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const uiPaused = sheet !== null || typing || reactionsOpen;

  const dialogRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const press = useRef<{ x: number; y: number; time: number; left: number; width: number; held: boolean; timer: number } | null>(null);

  const relation = useMemo(() => {
    void social;
    if (!story || isOwn) return { follow: null, muted: false };
    return { follow: followStatus(viewerId, story.ownerId), muted: isMuted(viewerId, story.ownerId) };
  }, [social, story, isOwn, viewerId]);

  const own = useMemo(() => {
    void stories;
    if (!story) return { liked: false, views: 0 };
    const views = isOwn ? getStoryViewers(story.id, viewerId) : null;
    return { liked: !isOwn && hasLiked(story.id, viewerId), views: views?.ok ? views.viewers.length : 0 };
  }, [stories, story, isOwn, viewerId]);

  // Terminou ou fechou: volta para o feed
  useEffect(() => {
    if (status === "finished" || status === "closed") onClose();
  }, [status, onClose]);

  // Tela cheia de verdade: sem rolar a página por baixo; foco entra e depois volta
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  // Responder, reagir ou abrir um menu pausa o story; fechar retoma
  useEffect(() => {
    if (uiPaused) hold();
    else release();
  }, [uiPaused, hold, release]);

  // O vídeo acompanha o estado do leitor (pausa junto, volta junto)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (status === "playing") video.play().catch(() => {});
    else video.pause();
  }, [status, story?.id]);

  // Deixa a próxima foto carregando enquanto esta toca
  useEffect(() => {
    const ids = refs[viewer.groupIndex]?.storyIds;
    const nextGroup = refs[viewer.groupIndex + 1];
    const nextId = ids?.[viewer.storyIndex + 1] ?? nextGroup?.storyIds[nextGroup.startIndex];
    const next = nextId ? getStory(nextId) : null;
    if (next?.media.type === "image") new Image().src = next.media.url;
  }, [refs, viewer.groupIndex, viewer.storyIndex]);

  const closeUi = useCallback(() => {
    setSheet(null);
    setReactionsOpen(false);
    setTyping(false);
  }, []);

  // Folha aberta: o foco entra nela. Fechou ou trocou: se o foco ficou perdido (o botão
  // clicado sumiu), volta para o leitor.
  useEffect(() => {
    if (!sheet) return;
    const root = dialogRef.current;
    const scope = sheetRef.current;
    if (scope) (focusables(scope)[0] ?? scope).focus();
    return () => {
      if (root?.isConnected && !root.contains(document.activeElement)) root.focus();
    };
  }, [sheet]);

  // Teclado no documento todo, não só no leitor: se o botão com foco some (folha fechou,
  // "Seguir" sumiu), as setas e o Esc continuam valendo. O Tab fica preso no leitor (ou na
  // folha aberta), sem cair na página escondida atrás.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const root = dialogRef.current;
      if (!root) return;
      if (event.key === "Tab") {
        const scope = sheetRef.current ?? root;
        const items = focusables(scope);
        const active = document.activeElement;
        const lost = !(active instanceof HTMLElement) || active === root || !scope.contains(active);
        if (items.length === 0) {
          event.preventDefault();
          scope.focus();
        } else if (event.shiftKey ? lost || active === items[0] : lost || active === items[items.length - 1]) {
          event.preventDefault();
          (event.shiftKey ? items[items.length - 1] : items[0]).focus();
        }
        return;
      }
      if (event.target instanceof HTMLInputElement) {
        if (event.key === "Escape") event.target.blur();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (sheet || reactionsOpen) closeUi();
        else closeViewer();
      } else if (event.key === "ArrowRight") {
        closeUi();
        nextStory();
      } else if (event.key === "ArrowLeft") {
        closeUi();
        prevStory();
      } else if (event.key === " " && (event.target === root || event.target === document.body)) {
        event.preventDefault();
        if (status === "paused") release();
        else hold();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sheet, reactionsOpen, status, hold, release, nextStory, prevStory, closeViewer, closeUi]);

  function run(gesture: Gesture) {
    if (gesture === "none") return;
    closeUi();
    if (gesture === "next_story") viewer.nextStory();
    else if (gesture === "prev_story") viewer.prevStory();
    else if (gesture === "next_user") viewer.nextUser();
    else if (gesture === "prev_user") viewer.prevUser();
    else viewer.close();
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    // Com teclado/menu aberto, o toque só fecha o que estiver aberto
    if (uiPaused) {
      (document.activeElement as HTMLElement | null)?.blur();
      closeUi();
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    const current = { x: event.clientX, y: event.clientY, time: performance.now(), left: rect.left, width: rect.width, held: false, timer: 0 };
    current.timer = window.setTimeout(() => {
      current.held = true;
      hold();
    }, HOLD_MS);
    press.current = current;
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const current = press.current;
    press.current = null;
    if (!current) return;
    window.clearTimeout(current.timer);
    if (current.held) release();
    run(
      classifyGesture({
        dx: event.clientX - current.x,
        dy: event.clientY - current.y,
        durationMs: performance.now() - current.time,
        startX: current.x - current.left,
        width: current.width,
        held: current.held,
      }),
    );
  }

  function onPointerCancel() {
    const current = press.current;
    press.current = null;
    if (!current) return;
    window.clearTimeout(current.timer);
    if (current.held) release();
  }

  function toggleLike() {
    if (!story) return;
    const result = toggleStoryLike(story.id, viewerId);
    if (!result.ok) onNotify(failureText(result.reason));
  }

  function react(emoji: string) {
    if (!story) return;
    const result = sendStoryReaction(story.id, viewerId, emoji);
    setReactionsOpen(false);
    if (!result.ok) onNotify(failureText(result.reason));
    else onNotify(result.added ? `Você reagiu com ${emoji}` : "Você já tinha mandado essa reação");
  }

  function reply(text: string): boolean {
    if (!story) return false;
    const result = replyToStory(story.id, viewerId, text);
    if (!result.ok) {
      onNotify(failureText(result.reason));
      return false;
    }
    onNotify(`Resposta enviada para ${ownerFirst}`);
    return true;
  }

  function followOwner() {
    if (!story) return;
    onNotify(followMessage(follow(viewerId, story.ownerId), ownerFirst));
  }

  function toggleMute() {
    if (!story) return;
    setSheet(null);
    if (relation.muted) {
      unmute(viewerId, story.ownerId);
      onNotify(`Os stories de ${ownerFirst} voltam a aparecer no seu daily.`);
      return;
    }
    mute(viewerId, story.ownerId);
    onNotify(`Você não vai mais ver os stories de ${ownerFirst} no seu daily.`);
    viewer.nextUser();
  }

  function report(reason: string) {
    if (!story) return;
    const result = reportStory(story.id, viewerId, reason);
    setSheet(null);
    if (!result.ok) {
      onNotify(failureText(result.reason));
      return;
    }
    onNotify("Obrigado por avisar. Esse story não vai mais aparecer pra você.");
    viewer.nextStory();
  }

  function blockOwner() {
    if (!story) return;
    block(viewerId, story.ownerId);
    setSheet(null);
    onNotify(`Você bloqueou ${ownerFirst}.`);
    viewer.nextUser();
  }

  function removeOwn() {
    if (!story) return;
    const result = deleteStory(story.id, viewerId);
    setSheet(null);
    onNotify(result.ok ? "Story excluído." : "Não deu pra excluir esse story.");
    if (result.ok) viewer.nextStory();
  }

  const sheetButton =
    "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-medium hover:bg-closie-panel focus-visible:bg-closie-panel";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={ownerName ? `Stories de ${ownerName}` : "Stories"}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white outline-none"
    >
      {/* Fundo desfocado com a própria foto (só no computador, onde sobra espaço) */}
      {story?.media.type === "image" && !unavailable && (
        // eslint-disable-next-line @next/next/no-img-element
        <img aria-hidden alt="" src={story.media.url} className="absolute inset-0 hidden h-full w-full scale-110 object-cover opacity-30 blur-3xl sm:block" />
      )}

      <button
        type="button"
        onClick={() => viewer.close()}
        aria-label="Fechar stories"
        className="absolute top-5 right-5 z-10 hidden size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:flex"
      >
        <X aria-hidden className="size-6" />
      </button>
      <button
        type="button"
        onClick={() => run("prev_story")}
        aria-label="Story anterior"
        className="absolute left-5 z-10 hidden size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:flex"
      >
        <ChevronLeft aria-hidden className="size-6" />
      </button>
      <button
        type="button"
        onClick={() => run("next_story")}
        aria-label="Próximo story"
        className="absolute right-5 z-10 hidden size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:flex"
      >
        <ChevronRight aria-hidden className="size-6" />
      </button>

      <div className="relative h-full w-full overflow-hidden bg-black sm:aspect-[9/16] sm:h-[min(92dvh,860px)] sm:w-auto sm:rounded-3xl">
        {/* Área dos gestos e a mídia */}
        <div
          className="absolute inset-0 touch-none select-none [-webkit-touch-callout:none]"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onContextMenu={(event) => event.preventDefault()}
        >
          {story && !unavailable && story.media.type === "image" && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img aria-hidden alt="" src={story.media.url} className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={story.id}
                src={story.media.url}
                alt={story.caption ?? `Story de ${ownerName}`}
                draggable={false}
                onLoad={() => viewer.onMediaLoad()}
                onError={viewer.onMediaError}
                className="relative h-full w-full object-contain"
              />
            </>
          )}
          {story && !unavailable && story.media.type === "video" && (
            <video
              key={story.id}
              ref={videoRef}
              src={story.media.url}
              playsInline
              muted={muted}
              preload="auto"
              onLoadedMetadata={(event) => viewer.onMediaLoad(event.currentTarget.duration)}
              onError={viewer.onMediaError}
              className="h-full w-full object-contain"
            />
          )}
        </div>

        {/* Topo: progresso e quem postou */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-linear-to-b from-black/60 to-transparent px-3 pt-3 pb-12">
          <div className="flex gap-1" aria-hidden>
            {viewer.progress.map((value, index) => (
              <span key={index} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
                <span className="block h-full rounded-full bg-white" style={{ width: `${value * 100}%` }} />
              </span>
            ))}
          </div>
          <div className="pointer-events-auto mt-3 flex items-center gap-2">
            {owner && <Avatar name={ownerName} src={owner.avatar ?? undefined} size={34} />}
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold">{isOwn ? "Seu daily" : ownerName}</p>
              <p className="flex items-center gap-1 text-xs text-white/75">
                {story && timeAgo(story.createdAt, now)}
                {story?.privacy === "close_friends" && (
                  <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
                    <Star aria-hidden className="size-2.5 fill-current" /> Amigos próximos
                  </span>
                )}
              </p>
            </div>
            {!isOwn && story && relation.follow !== "approved" && (
              <button
                type="button"
                onClick={followOwner}
                disabled={relation.follow === "pending"}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black disabled:bg-white/30 disabled:text-white"
              >
                {relation.follow === "pending" ? "Pedido enviado" : "Seguir"}
              </button>
            )}
            {story?.media.type === "video" && !unavailable && (
              <button
                type="button"
                onClick={() => setMuted((value) => !value)}
                aria-label={muted ? "Ligar o som" : "Desligar o som"}
                className="flex size-9 items-center justify-center rounded-full hover:bg-white/15"
              >
                {muted ? <VolumeX aria-hidden className="size-5" /> : <Volume2 aria-hidden className="size-5" />}
              </button>
            )}
            {story && (
              <button
                type="button"
                onClick={() => setSheet("menu")}
                aria-label="Mais opções"
                className="flex size-9 items-center justify-center rounded-full hover:bg-white/15"
              >
                <MoreHorizontal aria-hidden className="size-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => viewer.close()}
              aria-label="Fechar stories"
              className="flex size-9 items-center justify-center rounded-full hover:bg-white/15 sm:hidden"
            >
              <X aria-hidden className="size-6" />
            </button>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {ownerName && `${isOwn ? "Seu story" : ownerName}, ${viewer.storyIndex + 1} de ${groupSize}`}
          {status === "paused" && ", pausado"}
        </p>

        {/* Estados */}
        {status === "loading" && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <Loader2 aria-hidden className="size-9 text-white/80 motion-safe:animate-spin" />
          </div>
        )}
        {status === "paused" && !uiPaused && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-24 z-10 flex justify-center">
            <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold">Pausado</span>
          </div>
        )}
        {(status === "error" || unavailable) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-8">
            <div className="w-full max-w-xs rounded-3xl bg-white/10 p-5 text-center backdrop-blur">
              <p className="font-semibold">
                {status === "error" ? "Não deu pra carregar esse story." : UNAVAILABLE[status as keyof typeof UNAVAILABLE]}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {status === "error" && (
                  <button type="button" onClick={viewer.retry} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
                    Tentar de novo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => run("next_story")}
                  className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"
                >
                  {status === "error" ? "Pular" : "Continuar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Legenda */}
        {story?.caption && !unavailable && (
          <p className="pointer-events-none absolute inset-x-0 bottom-24 z-10 px-6 text-center text-lg font-semibold [text-shadow:0_1px_8px_rgb(0_0_0/0.6)]">
            {story.caption}
          </p>
        )}

        {/* Rodapé: responder/curtir/reagir (dos outros) ou visualizações (seu) */}
        {story && !unavailable &&
          (isOwn ? (
            <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between bg-linear-to-t from-black/60 to-transparent px-4 pt-12 pb-5">
              <button
                type="button"
                onClick={() => setSheet("insights")}
                className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"
              >
                <Eye aria-hidden className="size-4" />
                {own.views} {own.views === 1 ? "visualização" : "visualizações"}
              </button>
              <button
                type="button"
                onClick={() => setSheet("delete")}
                aria-label="Excluir story"
                className="flex size-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
              >
                <Trash2 aria-hidden className="size-5" />
              </button>
            </div>
          ) : (
            <ReplyBar
              key={story.id}
              name={ownerFirst}
              liked={own.liked}
              reactionsOpen={reactionsOpen}
              onTyping={setTyping}
              onSend={reply}
              onToggleLike={toggleLike}
              onToggleReactions={() => setReactionsOpen((value) => !value)}
              onReact={react}
            />
          ))}

        {/* Folhas: menu, denúncia, confirmações e visualizações */}
        {sheet && story && (
          <div
            className="absolute inset-0 z-20 flex items-end bg-black/40"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setSheet(null);
            }}
          >
            <div
              ref={sheetRef}
              role="dialog"
              aria-label="Opções do story"
              tabIndex={-1}
              className="w-full rounded-t-3xl bg-closie-bg p-4 pb-6 text-closie-text outline-none"
            >
              <span aria-hidden className="mx-auto mb-3 block h-1 w-10 rounded-full bg-closie-border-strong/50" />
              {sheet === "menu" &&
                (isOwn ? (
                  <>
                    <button type="button" className={sheetButton} onClick={() => setSheet("insights")}>
                      <Eye aria-hidden className="size-5 text-closie-muted" /> Ver quem viu
                    </button>
                    <button type="button" className={clsx(sheetButton, "text-closie-red-hover")} onClick={() => setSheet("delete")}>
                      <Trash2 aria-hidden className="size-5" /> Excluir story
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className={sheetButton} onClick={toggleMute}>
                      {relation.muted ? <Bell aria-hidden className="size-5 text-closie-muted" /> : <BellOff aria-hidden className="size-5 text-closie-muted" />}
                      {relation.muted ? `Voltar a ver os stories de ${ownerFirst}` : `Silenciar ${ownerFirst}`}
                    </button>
                    <button type="button" className={sheetButton} onClick={() => setSheet("report")}>
                      <Flag aria-hidden className="size-5 text-closie-muted" /> Denunciar story
                    </button>
                    <button type="button" className={clsx(sheetButton, "text-closie-red-hover")} onClick={() => setSheet("block")}>
                      <Ban aria-hidden className="size-5" /> Bloquear {ownerFirst}
                    </button>
                  </>
                ))}
              {sheet === "report" && (
                <>
                  <p className="px-3 pb-2 font-semibold">Por que você está denunciando?</p>
                  {REPORT_REASONS.map((reason) => (
                    <button key={reason} type="button" className={sheetButton} onClick={() => report(reason)}>
                      {REPORT_LABELS[reason]}
                    </button>
                  ))}
                </>
              )}
              {sheet === "block" && (
                <Confirm
                  title={`Bloquear ${ownerFirst}?`}
                  text="Vocês deixam de se seguir e não vão ver nem interagir com os stories um do outro. Dá pra desbloquear em Amigos."
                  confirm="Bloquear"
                  onConfirm={blockOwner}
                  onCancel={() => setSheet(null)}
                />
              )}
              {sheet === "delete" && (
                <Confirm
                  title="Excluir esse story?"
                  text="Ele some agora para todo mundo, junto com as visualizações."
                  confirm="Excluir"
                  onConfirm={removeOwn}
                  onCancel={() => setSheet(null)}
                />
              )}
              {sheet === "insights" && <StoryInsights storyId={story.id} ownerId={viewerId} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Confirm({ title, text, confirm, onConfirm, onCancel }: { title: string; text: string; confirm: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="px-2">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-closie-muted">{text}</p>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onCancel} className="h-12 flex-1 rounded-2xl border border-closie-border-strong font-semibold hover:bg-closie-panel">
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} className="h-12 flex-1 rounded-2xl bg-closie-red font-semibold text-closie-on-red hover:bg-closie-red-hover">
          {confirm}
        </button>
      </div>
    </div>
  );
}

type ReplyBarProps = {
  name: string;
  liked: boolean;
  reactionsOpen: boolean;
  onTyping: (typing: boolean) => void;
  onSend: (text: string) => boolean;
  onToggleLike: () => void;
  onToggleReactions: () => void;
  onReact: (emoji: string) => void;
};

// Rodapé para stories dos outros. O texto some ao trocar de story (o pai usa key).
function ReplyBar({ name, liked, reactionsOpen, onTyping, onSend, onToggleLike, onToggleReactions, onReact }: ReplyBarProps) {
  const [text, setText] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (text.trim() && onSend(text)) {
      setText("");
      (document.activeElement as HTMLElement | null)?.blur();
    }
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/70 to-transparent px-3 pt-14 pb-4">
      {reactionsOpen && (
        <div className="mb-3 flex justify-center gap-1" role="group" aria-label="Reações rápidas">
          {STORY_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(emoji)}
              aria-label={`Reagir com ${emoji}`}
              className="flex size-12 items-center justify-center rounded-full bg-black/30 text-2xl transition-transform hover:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onFocus={() => onTyping(true)}
          onBlur={() => onTyping(false)}
          maxLength={500}
          placeholder={`Responder ${name}…`}
          aria-label={`Responder ao story de ${name}`}
          className="h-11 min-w-0 flex-1 rounded-full border border-white/50 bg-black/25 px-4 text-sm text-white placeholder:text-white/70 focus-visible:border-white focus-visible:outline-none"
        />
        {text.trim() ? (
          <button type="submit" aria-label="Enviar resposta" className="flex size-11 items-center justify-center rounded-full bg-white text-black">
            <Send aria-hidden className="size-5" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onToggleLike}
              aria-label="Curtir"
              aria-pressed={liked}
              className="flex size-11 items-center justify-center rounded-full hover:bg-white/15"
            >
              <Heart aria-hidden className={clsx("size-6", liked && "fill-closie-red text-closie-red")} />
            </button>
            <button
              type="button"
              onClick={onToggleReactions}
              aria-label="Reações rápidas"
              aria-expanded={reactionsOpen}
              className="flex size-11 items-center justify-center rounded-full hover:bg-white/15"
            >
              <SmilePlus aria-hidden className="size-6" />
            </button>
          </>
        )}
      </form>
    </div>
  );
}
