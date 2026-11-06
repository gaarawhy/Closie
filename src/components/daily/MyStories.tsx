"use client";

import { Eye, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { StoryCover } from "@/components/stories/StoryCover";
import { StoryInsights } from "@/components/stories/StoryInsights";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { useViewerState } from "@/components/stories/useViewerState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useSession } from "@/lib/account";
import {
  deleteStory,
  getStoryViewers,
  timeAgo,
  timeLeft,
  updateStoryPrivacy,
  useMyStories,
  useNow,
  useStoriesSnapshot,
  type FeedGroup,
  type Story,
  type StoryPrivacy,
} from "@/lib/stories";
import { useComposer, useNotify } from "./DailyShell";
import { privacyChangeMessage } from "./messages";

const PRIVACY_LABELS: Record<StoryPrivacy, string> = {
  followers: "Seguidores",
  close_friends: "Amigos próximos",
  public: "Público",
};

// Gestão dos próprios stories: no ar (quem viu, privacidade, excluir) e o histórico dos expirados.
export function MyStories() {
  return (
    <div className="mx-auto w-full max-w-2xl pt-6 md:pt-10">
      <h1 className="px-4 text-2xl font-bold tracking-tight">Meus stories</h1>
      <MyStoriesContent />
    </div>
  );
}

function MyStoriesContent() {
  const openComposer = useComposer();
  const session = useSession();
  const notify = useNotify();
  const { active, expired } = useMyStories();
  const stories = useStoriesSnapshot();
  const now = useNow(60_000);
  const { viewer, open, close } = useViewerState();
  const [insightsFor, setInsightsFor] = useState<Story | null>(null);
  const [deleting, setDeleting] = useState<Story | null>(null);

  const views = useMemo(() => {
    void stories;
    if (!session) return new Map<string, number>();
    return new Map(
      [...active, ...expired].map((story) => {
        const result = getStoryViewers(story.id, session.id);
        return [story.id, result.ok ? result.viewers.length : 0];
      }),
    );
  }, [stories, session, active, expired]);

  if (!session) return null;
  const { profile } = session;

  function openActive(index: number) {
    if (!session) return;
    const group: FeedGroup = {
      owner: {
        id: session.id,
        username: profile.username ?? "",
        displayName: profile.displayName,
        avatar: profile.avatar,
        privacy: profile.privacy,
      },
      stories: active,
      seenIds: [],
      status: "seen",
      startIndex: index,
      latestAt: active[active.length - 1].createdAt,
    };
    open([group], 0);
  }

  function changePrivacy(story: Story, privacy: StoryPrivacy) {
    if (!session) return;
    const result = updateStoryPrivacy(story.id, session.id, privacy);
    notify(
      result.ok
        ? privacyChangeMessage(privacy, profile.privacy === "private")
        : result.reason === "expired"
          ? "Esse story já expirou."
          : "Não deu pra mudar agora.",
    );
  }

  function confirmDelete() {
    if (!session || !deleting) return;
    const result = deleteStory(deleting.id, session.id);
    setDeleting(null);
    notify(result.ok ? "Story excluído." : "Não deu pra excluir esse story.");
  }

  const viewsLabel = (count: number) => `${count} ${count === 1 ? "visualização" : "visualizações"}`;

  return (
    <>
      <section className="px-4 pt-6" aria-labelledby="titulo-no-ar">
        <h2 id="titulo-no-ar" className="text-lg font-bold">
          No ar agora <span className="font-normal text-closie-muted">({active.length})</span>
        </h2>
        {active.length === 0 ? (
          <div className="mt-3 rounded-3xl bg-closie-panel p-6 text-center">
            <p className="font-semibold">Você não tem stories no ar.</p>
            <p className="mt-1 text-sm text-closie-muted">O que você publica fica 24 h no seu daily.</p>
            <Button size="sm" className="mt-4 rounded-full" onClick={() => openComposer("story")}>
              <Plus aria-hidden className="size-4" />
              Publicar agora
            </Button>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {active.map((story, index) => (
              <li key={story.id} className="flex items-center gap-3 rounded-3xl border border-closie-border p-3">
                <button
                  type="button"
                  onClick={() => openActive(index)}
                  aria-label="Ver esse story"
                  className="relative h-24 w-[54px] shrink-0 overflow-hidden rounded-xl bg-closie-text"
                >
                  <StoryCover story={story} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {timeAgo(story.createdAt, now)} <span className="font-normal text-closie-muted">· {timeLeft(story.expiresAt, now)}</span>
                  </p>
                  {story.caption && <p className="truncate text-sm text-closie-muted">{story.caption}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Quem pode ver esse story"
                      value={story.privacy}
                      onChange={(event) => changePrivacy(story, event.target.value as StoryPrivacy)}
                      className="h-9 rounded-full border border-closie-border-strong bg-closie-bg px-3 text-sm font-medium"
                    >
                      {(Object.keys(PRIVACY_LABELS) as StoryPrivacy[]).map((value) => (
                        <option key={value} value={value}>
                          {PRIVACY_LABELS[value]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setInsightsFor(story)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-closie-panel px-3 text-sm font-semibold hover:bg-closie-panel-strong"
                    >
                      <Eye aria-hidden className="size-4" />
                      {viewsLabel(views.get(story.id) ?? 0)}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleting(story)}
                  aria-label="Excluir esse story"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-closie-muted hover:bg-closie-panel hover:text-closie-red-hover"
                >
                  <Trash2 aria-hidden className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-4 pt-8" aria-labelledby="titulo-historico">
        <h2 id="titulo-historico" className="text-lg font-bold">
          Histórico
        </h2>
        <p className="text-sm text-closie-muted">Stories que já expiraram. Ninguém mais vê; ficam só aqui, para você.</p>
        {expired.length === 0 ? (
          <p className="mt-3 rounded-3xl bg-closie-panel p-6 text-center text-sm text-closie-muted">Nada no histórico ainda.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {expired.map((story) => (
              <li key={story.id}>
                <button
                  type="button"
                  onClick={() => setInsightsFor(story)}
                  aria-label={`Story de ${new Date(story.createdAt).toLocaleDateString("pt-BR")}, ${viewsLabel(views.get(story.id) ?? 0)}`}
                  className="relative block aspect-[9/16] w-full overflow-hidden rounded-xl bg-closie-text"
                >
                  <StoryCover story={story} className="opacity-80" />
                  <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-2 pt-8 pb-2 text-left text-white">
                    <span className="block text-xs font-semibold">
                      {new Date(story.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-white/85">
                      <Eye aria-hidden className="size-3" /> {views.get(story.id) ?? 0}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {insightsFor && (
        <Modal title="Quem viu" onClose={() => setInsightsFor(null)}>
          <StoryInsights storyId={insightsFor.id} ownerId={session.id} />
          <button
            type="button"
            onClick={() => {
              setDeleting(insightsFor);
              setInsightsFor(null);
            }}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-closie-red-hover hover:underline"
          >
            <Trash2 aria-hidden className="size-4" />
            Excluir esse story
          </button>
        </Modal>
      )}
      {deleting && (
        <Modal title="Excluir esse story?" onClose={() => setDeleting(null)}>
          <p className="text-sm text-closie-muted">Ele some para todo mundo agora, junto com as visualizações. Não dá pra desfazer.</p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button size="lg" className="flex-1" onClick={confirmDelete}>
              Excluir
            </Button>
          </div>
        </Modal>
      )}
      {viewer && (
        <StoryViewer viewerId={session.id} groups={viewer.groups} startGroupIndex={viewer.start} onClose={close} onNotify={notify} />
      )}
    </>
  );
}
