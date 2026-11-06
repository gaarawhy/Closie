"use client";

import { ChevronRight, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Logo } from "@/components/brand/Logo";
import { DumpGrid } from "@/components/stories/DumpGrid";
import { StoriesRail } from "@/components/stories/StoriesRail";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { useViewerState } from "@/components/stories/useViewerState";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/account";
import { followingIds, useSocialSnapshot } from "@/lib/social";
import {
  followDemoFriends,
  hasDemoNetwork,
  refreshDemoStories,
  seedDemoNetwork,
  useNow,
  useStoriesFeed,
  type FeedGroup,
} from "@/lib/stories";
import { DAILY_PATHS, useComposer, useNotify } from "./DailyShell";
import { WELCOME_MESSAGE } from "./messages";
import { Suggestions } from "./Suggestions";

// Marcada pelo onboarding (OnboardingFlow) logo antes de concluir; lida (e apagada) uma vez aqui,
// para o "Perfil pronto!" aparecer só na primeira vez que a pessoa chega no daily.
export const ONBOARDING_SUCCESS_KEY = "closie:onboarding-sucesso";

const byLatestDesc = (a: FeedGroup, b: FeedGroup) => (a.latestAt < b.latestAt ? 1 : a.latestAt > b.latestAt ? -1 : 0);

// Início, no jeito da aba de histórias do Snapchat: em cima "Amigos" com as bolinhas grandes;
// embaixo os dumps de hoje dos amigos em cartões; no fim, sugestões de quem seguir.
// Só amigos e sugestões: gente nova fica na Pesquisa.
export function DailyHome() {
  // Garantida: o RouteGuard do layout só monta com sessão e onboarding concluído
  const session = useSession();
  const viewerId = session?.id ?? null;
  const notify = useNotify();
  const openComposer = useComposer();
  const feed = useStoriesFeed();
  const social = useSocialSnapshot();
  const now = useNow(60_000);
  const { viewer, open: openViewer, close: closeViewer } = useViewerState();

  // "Perfil pronto!" só na primeira chegada depois do onboarding
  useEffect(() => {
    try {
      if (sessionStorage.getItem(ONBOARDING_SUCCESS_KEY)) {
        sessionStorage.removeItem(ONBOARDING_SUCCESS_KEY);
        notify(WELCOME_MESSAGE);
      }
    } catch {
      // Sem sessionStorage, só não mostra o aviso.
    }
  }, [notify]);

  // Modo demonstração: cria os perfis de exemplo na primeira visita e renova os stories vencidos
  useEffect(() => {
    if (!viewerId) return;
    if (hasDemoNetwork()) refreshDemoStories();
    else seedDemoNetwork(viewerId);
  }, [viewerId]);

  // Bolinhas: não vistos primeiro. Cartões: atividade mais recente primeiro (assim eles não
  // trocam de lugar depois que você vê um dump).
  const railGroups = useMemo(() => [...feed.unseen, ...feed.seen], [feed]);
  const cards = useMemo(() => [...railGroups].sort(byLatestDesc), [railGroups]);
  const following = useMemo(() => {
    void social;
    return viewerId ? followingIds(viewerId).length : 0;
  }, [social, viewerId]);

  if (!session || !viewerId) return null;
  const me = {
    name: session.profile.displayName ?? session.profile.username ?? "Você",
    username: session.profile.username ?? "",
    avatar: session.profile.avatar,
  };

  function followExamples() {
    if (!viewerId) return;
    followDemoFriends(viewerId);
    notify("Pronto! Agora você segue os amigos de exemplo.");
  }

  return (
    <div className="mx-auto w-full max-w-5xl md:pt-4">
      <h1 className="sr-only">Início</h1>
      {/* No celular não há menu lateral: o logo fica no alto do Início */}
      <div className="flex h-14 items-center px-4 md:hidden">
        <Logo className="h-7 w-auto" />
      </div>
      <section aria-labelledby="titulo-amigos">
        <h2 id="titulo-amigos" className="px-4 pt-4">
          <Link href={DAILY_PATHS.friends} className="inline-flex items-center gap-0.5 text-lg font-bold tracking-tight hover:underline">
            Amigos
            <ChevronRight aria-hidden className="size-5 text-closie-muted" />
          </Link>
        </h2>
        <StoriesRail
          me={me}
          mine={feed.mine}
          groups={railGroups}
          loading={feed.loading}
          showFindFriends={following === 0}
          onOpenMine={() => feed.mine && openViewer([feed.mine], 0)}
          onOpenGroup={(index) => openViewer(railGroups, index)}
          onCreate={() => openComposer("story")}
        />
      </section>

      {!feed.loading && following === 0 && (
        <div className="mx-4 mb-2 rounded-3xl bg-closie-panel p-5 md:max-w-xl">
          <p className="font-semibold">Siga pessoas para ver os dumps delas aqui</p>
          <p className="mt-0.5 text-sm text-closie-muted">O Início mostra só quem você segue. Gente nova você acha na Pesquisa.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" className="rounded-full" onClick={followExamples}>
              <UserPlus aria-hidden className="size-4" />
              Seguir amigos de exemplo
            </Button>
            <Link
              href={DAILY_PATHS.search}
              className="inline-flex h-9 items-center rounded-full border border-closie-border-strong px-3 text-sm font-semibold hover:bg-closie-bg"
            >
              Pesquisar pessoas
            </Link>
          </div>
        </div>
      )}

      {(feed.loading || cards.length > 0 || following > 0) && (
        <section aria-labelledby="titulo-dumps">
          <h2 id="titulo-dumps" className="px-4 pt-3 pb-3 text-lg font-bold tracking-tight">
            Dumps de hoje
          </h2>
          {feed.loading ? (
            <ul aria-hidden className="grid grid-cols-2 gap-2.5 px-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <li key={index} className="aspect-[3/5] rounded-2xl bg-closie-panel motion-safe:animate-pulse" />
              ))}
            </ul>
          ) : cards.length > 0 ? (
            <DumpGrid groups={cards} now={now} onOpen={(index) => openViewer(cards, index)} />
          ) : (
            <p className="mx-4 rounded-3xl bg-closie-panel p-6 text-center text-sm text-closie-muted md:max-w-xl">
              Quem você segue ainda não postou hoje. Quando postar, aparece aqui.
            </p>
          )}
        </section>
      )}

      <Suggestions viewerId={viewerId} now={now} />

      {viewer && (
        <StoryViewer viewerId={viewerId} groups={viewer.groups} startGroupIndex={viewer.start} onClose={closeViewer} onNotify={notify} />
      )}
    </div>
  );
}
