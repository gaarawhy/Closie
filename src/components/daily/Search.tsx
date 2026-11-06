"use client";

import { Search as SearchIcon, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { profileHref } from "@/components/profile/links";
import { DumpGrid } from "@/components/stories/DumpGrid";
import { StoryRing, firstName } from "@/components/stories/StoriesRail";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { useViewerState } from "@/components/stories/useViewerState";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/account";
import { follow, followStatus, followerIds, searchPeople, useSocialSnapshot, type Person } from "@/lib/social";
import { buildPersonGroup, useDiscoverFeed, useNow, useStoriesSnapshot, type FeedGroup } from "@/lib/stories";
import { useNotify } from "./DailyShell";
import { followMessage } from "./messages";

const byLatestDesc = (a: FeedGroup, b: FeedGroup) => (a.latestAt < b.latestAt ? 1 : a.latestAt > b.latestAt ? -1 : 0);

// Pesquisa: achar pessoas pelo @ ou nome e, sem nada digitado, o Descobrir — os dumps de hoje
// de perfis públicos que você ainda não segue, nos mesmos cartões do Início.
export function Search() {
  const session = useSession();
  const viewerId = session?.id ?? null;
  const notify = useNotify();
  const social = useSocialSnapshot();
  const stories = useStoriesSnapshot();
  const now = useNow(60_000);
  const discover = useDiscoverFeed();
  const { viewer, open: openViewer, close: closeViewer } = useViewerState();
  const [query, setQuery] = useState("");
  // Quem você começou a seguir por aqui continua no lugar (com "Seguindo"), em vez de sumir
  const [followedHere, setFollowedHere] = useState<string[]>([]);
  const searching = query.trim().length > 0;

  const results = useMemo(() => {
    void social;
    void stories;
    if (!viewerId || !searching) return [];
    const followers = new Set(followerIds(viewerId));
    return searchPeople(viewerId, query).map((person) => ({
      person,
      status: person.id === viewerId ? ("self" as const) : followStatus(viewerId, person.id),
      followsYou: followers.has(person.id),
      group: buildPersonGroup(viewerId, person.id, now),
    }));
  }, [social, stories, viewerId, searching, query, now]);

  const cards = useMemo(() => {
    void social;
    void stories;
    if (!viewerId) return [];
    const shown = new Set(discover.groups.map((group) => group.owner.id));
    const kept = followedHere
      .filter((id) => !shown.has(id))
      .map((id) => buildPersonGroup(viewerId, id, now))
      .filter((group): group is FeedGroup => group !== null);
    return [...discover.groups, ...kept].sort(byLatestDesc);
  }, [social, stories, viewerId, discover.groups, followedHere, now]);

  const cardStatus = useMemo(() => {
    void social;
    return new Map(cards.map((group) => [group.owner.id, viewerId ? followStatus(viewerId, group.owner.id) : null]));
  }, [social, cards, viewerId]);

  if (!session || !viewerId) return null;
  const me = viewerId;

  function followPerson(person: Person) {
    const result = follow(me, person.id);
    if (result === "approved" || result === "pending") {
      setFollowedHere((ids) => (ids.includes(person.id) ? ids : [...ids, person.id]));
    }
    notify(followMessage(result, firstName(person), { hint: "home" }));
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="sr-only">Pesquisar</h1>
      <div className="sticky top-0 z-20 bg-closie-bg/95 px-4 pt-4 pb-3 backdrop-blur md:pt-6">
        <label className="flex h-12 items-center gap-2 rounded-full bg-closie-panel px-4 focus-within:ring-2 focus-within:ring-closie-text md:max-w-xl">
          <SearchIcon aria-hidden className="size-5 shrink-0 text-closie-muted" />
          <span className="sr-only">Pesquisar pessoas pelo @ ou nome</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar pelo @ ou nome"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-closie-muted [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpar pesquisa"
              className="-mr-2 flex size-8 items-center justify-center rounded-full text-closie-muted hover:bg-closie-panel-strong"
            >
              <X aria-hidden className="size-4" />
            </button>
          )}
        </label>
      </div>

      {searching ? (
        <section aria-label="Pessoas encontradas" className="px-4 md:max-w-xl">
          <p className="sr-only" aria-live="polite">
            {results.length === 0 ? "Ninguém encontrado" : `${results.length} ${results.length === 1 ? "pessoa encontrada" : "pessoas encontradas"}`}
          </p>
          {results.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-semibold">Ninguém encontrado para “{query.trim()}”.</p>
              <p className="mt-1 text-sm text-closie-muted">Confira o @ ou tente pelo nome.</p>
            </div>
          ) : (
            <ul>
              {results.map(({ person, status, followsYou, group }) => {
                const name = person.displayName ?? person.username;
                const note =
                  status === "self"
                    ? "você"
                    : followsYou
                      ? "segue você"
                      : person.privacy === "private" && status !== "approved"
                        ? "perfil privado"
                        : null;
                return (
                  <li key={person.id} className="flex items-center gap-3 py-2">
                    {group ? (
                      <button type="button" onClick={() => openViewer([group], 0)} aria-label={`Ver os stories de ${name}`} className="flex shrink-0 rounded-full">
                        <StoryRing state={group.status === "seen" ? "seen" : "new"}>
                          <Avatar name={name} src={person.avatar ?? undefined} size={44} />
                        </StoryRing>
                      </button>
                    ) : (
                      <StoryRing state="none">
                        <Avatar name={name} src={person.avatar ?? undefined} size={44} />
                      </StoryRing>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link href={profileHref(person.username, session.profile.username)} className="block truncate text-sm font-semibold hover:underline">
                        {name}
                      </Link>
                      <p className="truncate text-xs text-closie-muted">
                        @{person.username}
                        {note && ` · ${note}`}
                      </p>
                    </div>
                    {status === "self" ? null : status === "approved" ? (
                      <span className="text-sm font-semibold text-closie-muted">Seguindo</span>
                    ) : status === "pending" ? (
                      <span className="text-sm font-semibold text-closie-muted">Pedido enviado</span>
                    ) : (
                      <Button size="sm" className="rounded-full" onClick={() => followPerson(person)}>
                        {followsYou ? "Seguir de volta" : "Seguir"}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <section aria-labelledby="titulo-descobrir">
          <div className="px-4 pb-3">
            <h2 id="titulo-descobrir" className="text-lg font-bold tracking-tight">
              Descobrir
            </h2>
            <p className="text-sm text-closie-muted">Dumps de hoje de perfis públicos</p>
          </div>
          {discover.loading ? (
            <ul aria-hidden className="grid grid-cols-2 gap-2.5 px-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <li key={index} className="aspect-[3/5] rounded-2xl bg-closie-panel motion-safe:animate-pulse" />
              ))}
            </ul>
          ) : cards.length === 0 ? (
            <p className="mx-4 rounded-3xl bg-closie-panel p-6 text-center text-sm text-closie-muted md:max-w-xl">
              Nenhum dump público agora. Volte mais tarde.
            </p>
          ) : (
            <DumpGrid
              groups={cards}
              now={now}
              followState={(ownerId) => cardStatus.get(ownerId) ?? null}
              onFollow={(group) => followPerson(group.owner)}
              onOpen={(index) => openViewer(cards, index)}
            />
          )}
        </section>
      )}

      {viewer && (
        <StoryViewer viewerId={viewerId} groups={viewer.groups} startGroupIndex={viewer.start} onClose={closeViewer} onNotify={notify} />
      )}
    </div>
  );
}
