"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { profileHref } from "@/components/profile/links";
import { firstName } from "@/components/stories/StoriesRail";
import { StoryCover } from "@/components/stories/StoryCover";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { useViewerState } from "@/components/stories/useViewerState";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/account";
import { getLastSeen, markNotificationsSeen, useNotifications, type NotificationItem } from "@/lib/notifications";
import { approveFollow, follow, followStatus, rejectFollow, useSocialSnapshot } from "@/lib/social";
import { buildPersonGroup, isExpired, timeAgo, useNow, type Story } from "@/lib/stories";
import { useNotify } from "./DailyShell";
import { followMessage, notificationText } from "./messages";

// Notificações: pedidos para seguir (aceitar/recusar) e o que aconteceu com você e seus stories.
// Abrir a página marca tudo como visto (a bolinha do sininho some).
export function Notifications() {
  const session = useSession();
  const userId = session?.id ?? null;
  const notify = useNotify();
  const social = useSocialSnapshot();
  const { items } = useNotifications();
  const now = useNow(60_000);
  const { viewer, open: openViewer, close: closeViewer } = useViewerState();
  // A visita anterior: o que chegou depois dela aparece em "Novas" enquanto você está aqui
  const [seenBefore] = useState(() => (userId ? getLastSeen(userId) : null));

  useEffect(() => {
    if (!userId) return;
    markNotificationsSeen(userId);
    // Ao sair, o que chegou com a página aberta também conta como visto
    return () => markNotificationsSeen(userId);
  }, [userId]);

  const followState = useMemo(() => {
    void social;
    return new Map(items.map((item) => [item.from.id, userId ? followStatus(userId, item.from.id) : null]));
  }, [social, items, userId]);

  if (!session || !userId) return null;
  const me = userId;

  const requests = items.filter((item) => item.kind === "follow_request");
  const activity = items.filter((item) => item.kind !== "follow_request");
  const isNew = (item: NotificationItem) => !seenBefore || item.at > seenBefore;
  const fresh = activity.filter(isNew);
  const older = activity.filter((item) => !isNew(item));

  function openStory(story: Story) {
    if (isExpired(story, now)) {
      notify("Esse story já expirou. Ele está no histórico, em Meus stories.");
      return;
    }
    const group = buildPersonGroup(me, me, now);
    const index = group ? group.stories.findIndex((item) => item.id === story.id) : -1;
    if (!group || index < 0) {
      notify("Esse story não está mais no ar.");
      return;
    }
    openViewer([{ ...group, status: "seen", startIndex: index }], 0);
  }

  function row(item: NotificationItem) {
    const name = item.from.displayName ?? item.from.username;
    const state = followState.get(item.from.id) ?? null;
    return (
      <li key={item.id} className="flex items-center gap-3 py-3">
        <Avatar name={name} src={item.from.avatar ?? undefined} size={44} />
        <p className="min-w-0 flex-1 text-sm break-words">
          <Link href={profileHref(item.from.username)} className="font-semibold hover:underline">
            {name}
          </Link>{" "}
          {notificationText(item)}{" "}
          <span className="whitespace-nowrap text-closie-muted">{timeAgo(item.at, now)}</span>
        </p>
        {item.kind === "follow_request" ? (
          <div className="flex shrink-0 gap-1.5">
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => {
                approveFollow(me, item.from.id);
                notify(`${firstName(item.from)} agora segue você.`);
              }}
            >
              Aceitar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={() => {
                rejectFollow(me, item.from.id);
                notify("Pedido recusado.");
              }}
            >
              Recusar
            </Button>
          </div>
        ) : item.kind === "like" || item.kind === "reply" || item.kind === "reaction" ? (
          <button
            type="button"
            onClick={() => openStory(item.story)}
            aria-label="Ver o story"
            className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-closie-text"
          >
            <StoryCover story={item.story} />
          </button>
        ) : item.kind === "new_follower" && state === null ? (
          <Button size="sm" className="shrink-0 rounded-full" onClick={() => notify(followMessage(follow(me, item.from.id), firstName(item.from)))}>
            Seguir de volta
          </Button>
        ) : item.kind === "new_follower" && state === "pending" ? (
          <span className="shrink-0 text-sm font-semibold text-closie-muted">Pedido enviado</span>
        ) : null}
      </li>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 md:pt-10">
      <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>

      {items.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-closie-panel p-6 text-center">
          <p className="font-semibold">Nada por aqui ainda.</p>
          <p className="mt-1 text-sm text-closie-muted">
            Quando alguém pedir para seguir você, começar a seguir ou curtir e responder seus stories, aparece aqui.
          </p>
        </div>
      ) : (
        <>
          {requests.length > 0 && (
            <section aria-labelledby="titulo-pedidos" className="mt-6">
              <h2 id="titulo-pedidos" className="text-base font-bold">
                Pedidos para seguir <span className="font-normal text-closie-muted">({requests.length})</span>
              </h2>
              <ul className="divide-y divide-closie-border">{requests.map(row)}</ul>
            </section>
          )}
          {fresh.length > 0 && (
            <section aria-labelledby="titulo-novas" className="mt-6">
              <h2 id="titulo-novas" className="text-base font-bold">
                Novas
              </h2>
              <ul className="divide-y divide-closie-border">{fresh.map(row)}</ul>
            </section>
          )}
          {older.length > 0 && (
            <section aria-labelledby="titulo-anteriores" className="mt-6">
              <h2 id="titulo-anteriores" className="text-base font-bold">
                {fresh.length > 0 ? "Anteriores" : "Atividade"}
              </h2>
              <ul className="divide-y divide-closie-border">{older.map(row)}</ul>
            </section>
          )}
        </>
      )}

      {viewer && <StoryViewer viewerId={me} groups={viewer.groups} startGroupIndex={viewer.start} onClose={closeViewer} onNotify={notify} />}
    </div>
  );
}
