"use client";

import clsx from "clsx";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { followMessage } from "@/components/daily/messages";
import { firstName } from "@/components/stories/StoriesRail";
import { Avatar } from "@/components/ui/Avatar";
import {
  follow,
  followerIds,
  followingIds,
  getPerson,
  isBlockedEitherWay,
  normalizeSearch,
  relationship,
  unfollow,
  useSocialSnapshot,
  type Person,
} from "@/lib/social";
import { profileHref } from "./links";

export type ConnectionsTab = "followers" | "following";

type ConnectionsSheetProps = {
  owner: Person;
  viewerId: string;
  viewerUsername: string | null;
  initialTab: ConnectionsTab;
  onClose: () => void;
  onNotify: (message: string) => void;
};

// Seguidores e seguindo de um perfil, numa janela própria: abas, pesquisa na lista e seguir /
// deixar de seguir / cancelar pedido em cada pessoa. Quem tem bloqueio com você não aparece.
export function ConnectionsSheet({ owner, viewerId, viewerUsername, initialTab, onClose, onNotify }: ConnectionsSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const social = useSocialSnapshot();
  const [tab, setTab] = useState<ConnectionsTab>(initialTab);
  const [query, setQuery] = useState("");
  // Quem está com "Deixar de seguir?" aberto (confirma antes, para não ser sem querer)
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const lists = useMemo(() => {
    void social;
    const people = (ids: string[]) =>
      ids
        .filter((id) => id === viewerId || !isBlockedEitherWay(viewerId, id))
        .map(getPerson)
        .filter((person): person is Person => person !== null);
    return { followers: people(followerIds(owner.id)), following: people(followingIds(owner.id)) };
  }, [social, owner.id, viewerId]);

  const term = normalizeSearch(query);
  const shown = lists[tab].filter(
    (person) => !term || normalizeSearch(person.username).includes(term) || normalizeSearch(person.displayName ?? "").includes(term),
  );

  const status = useMemo(() => {
    void social;
    return new Map([...lists.followers, ...lists.following].map((person) => [person.id, relationship(viewerId, person.id)]));
  }, [social, lists, viewerId]);

  const followsMe = useMemo(() => {
    void social;
    return new Set(followerIds(viewerId));
  }, [social, viewerId]);

  function doFollow(person: Person) {
    onNotify(followMessage(follow(viewerId, person.id), firstName(person)));
  }

  function doUnfollow(person: Person, wasRequest: boolean) {
    unfollow(viewerId, person.id);
    setConfirming(null);
    onNotify(wasRequest ? "Pedido cancelado." : `Você deixou de seguir ${firstName(person)}.`);
  }

  const tabs: { value: ConnectionsTab; label: string; count: number }[] = [
    { value: "followers", label: "Seguidores", count: lists.followers.length },
    { value: "following", label: "Seguindo", count: lists.following.length },
  ];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-0 mt-auto h-[88dvh] max-h-none w-full max-w-none rounded-t-[28px] bg-closie-bg p-0 text-closie-text backdrop:bg-black/50 sm:m-auto sm:h-[min(80dvh,680px)] sm:w-[min(92vw,460px)] sm:rounded-[28px] sm:shadow-2xl"
    >
      <div className="flex h-full flex-col">
        <div className="px-5 pt-3">
          <span aria-hidden className="mx-auto mb-3 block h-1 w-10 rounded-full bg-closie-border-strong/50 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="truncate text-lg font-semibold">
              @{owner.username}
            </h2>
            <button type="button" onClick={onClose} aria-label="Fechar" className="-mr-2 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-closie-panel">
              <X aria-hidden className="size-5" />
            </button>
          </div>

          <div role="tablist" aria-label="Conexões" className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-closie-panel p-1">
            {tabs.map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={tab === item.value}
                onClick={() => {
                  setTab(item.value);
                  setConfirming(null);
                }}
                className={clsx(
                  "h-10 rounded-full text-sm font-semibold transition-colors",
                  tab === item.value ? "bg-closie-bg text-closie-text shadow-sm" : "text-closie-muted hover:text-closie-text",
                )}
              >
                {item.label} <span className={clsx(tab === item.value ? "text-closie-red" : "text-closie-muted")}>{item.count}</span>
              </button>
            ))}
          </div>

          <label className="mt-3 flex h-11 items-center gap-2 rounded-full border border-closie-border-strong/50 px-4 focus-within:border-closie-text">
            <Search aria-hidden className="size-4 shrink-0 text-closie-muted" />
            <span className="sr-only">Pesquisar nesta lista</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar nesta lista"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-closie-muted sm:text-sm"
            />
          </label>
        </div>

        <div role="tabpanel" aria-label={tab === "followers" ? "Seguidores" : "Seguindo"} className="mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-5">
          {shown.length === 0 ? (
            <p className="px-2 py-10 text-center text-sm text-closie-muted">
              {term
                ? `Ninguém com “${query.trim()}” nesta lista.`
                : tab === "followers"
                  ? `Ninguém segue @${owner.username} ainda.`
                  : `@${owner.username} ainda não segue ninguém.`}
            </p>
          ) : (
            <ul>
              {shown.map((person) => {
                const name = person.displayName ?? person.username;
                const state = status.get(person.id) ?? "none";
                return (
                  <li key={person.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-closie-panel/60">
                    <Link href={profileHref(person.username, viewerUsername)} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={name} src={person.avatar ?? undefined} size={44} />
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate text-sm font-semibold">{name}</span>
                        <span className="block truncate text-xs text-closie-muted">@{person.username}</span>
                      </span>
                    </Link>
                    {state === "self" ? (
                      <span className="shrink-0 px-2 text-xs font-semibold text-closie-muted">Você</span>
                    ) : confirming === person.id ? (
                      <span className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => doUnfollow(person, false)}
                          className="h-9 rounded-full bg-closie-red px-3 text-xs font-semibold text-closie-on-red hover:bg-closie-red-hover"
                        >
                          Deixar de seguir
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          aria-label="Manter"
                          className="flex size-9 items-center justify-center rounded-full text-closie-muted hover:bg-closie-panel"
                        >
                          <X aria-hidden className="size-4" />
                        </button>
                      </span>
                    ) : state === "following" ? (
                      <button
                        type="button"
                        onClick={() => setConfirming(person.id)}
                        className="h-9 shrink-0 rounded-full border border-closie-border-strong/60 px-4 text-xs font-semibold hover:bg-closie-panel"
                      >
                        Seguindo
                      </button>
                    ) : state === "requested" ? (
                      <button
                        type="button"
                        onClick={() => doUnfollow(person, true)}
                        className="h-9 shrink-0 rounded-full border border-closie-border-strong/60 px-4 text-xs font-semibold text-closie-muted hover:bg-closie-panel"
                      >
                        Pedido enviado
                      </button>
                    ) : state === "none" ? (
                      <button
                        type="button"
                        onClick={() => doFollow(person)}
                        className="h-9 shrink-0 rounded-full bg-closie-red px-4 text-xs font-semibold text-closie-on-red hover:bg-closie-red-hover"
                      >
                        {followsMe.has(person.id) ? "Seguir de volta" : "Seguir"}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  );
}
