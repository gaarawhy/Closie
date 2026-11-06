"use client";

import Link from "next/link";
import { useMemo } from "react";
import { profileHref } from "@/components/profile/links";
import { firstName } from "@/components/stories/StoriesRail";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { follow, followStatus, listPeople, useSocialSnapshot } from "@/lib/social";
import { suggestPeople } from "@/lib/stories";
import { DAILY_PATHS, useNotify } from "./DailyShell";
import { followMessage, suggestionReasonText } from "./messages";

// Fim do Início: pessoas para seguir. A lista só é refeita quando chega gente nova (ou a cada
// minuto), não a cada "Seguir": assim a linha não some debaixo do dedo, só vira "Seguindo".
export function Suggestions({ viewerId, now }: { viewerId: string; now: number }) {
  const notify = useNotify();
  const social = useSocialSnapshot();
  const peopleCount = useMemo(() => {
    void social;
    return listPeople().length;
  }, [social]);
  const list = useMemo(() => {
    void peopleCount;
    return suggestPeople(viewerId, now, 8);
  }, [viewerId, now, peopleCount]);
  const status = useMemo(() => {
    void social;
    return new Map(list.map((item) => [item.person.id, followStatus(viewerId, item.person.id)]));
  }, [social, list, viewerId]);

  if (list.length === 0) return null;

  return (
    <section aria-labelledby="titulo-sugestoes" className="px-4 pt-6 md:max-w-xl">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="titulo-sugestoes" className="text-base font-bold">
          Sugestões para você
        </h2>
        <Link href={DAILY_PATHS.search} className="text-sm font-semibold text-closie-link hover:underline">
          Pesquisar pessoas
        </Link>
      </div>
      <ul className="mt-2">
        {list.map((item) => {
          const name = item.person.displayName ?? item.person.username;
          const state = status.get(item.person.id) ?? null;
          return (
            <li key={item.person.id} className="flex items-center gap-3 py-2.5">
              <Avatar name={name} src={item.person.avatar ?? undefined} size={44} />
              <div className="min-w-0 flex-1">
                <Link href={profileHref(item.person.username)} className="block truncate text-sm font-semibold hover:underline">
                  {name}
                </Link>
                <p className="truncate text-xs text-closie-muted">{suggestionReasonText(item)}</p>
              </div>
              {state === "approved" ? (
                <span className="text-sm font-semibold text-closie-muted">Seguindo</span>
              ) : state === "pending" ? (
                <span className="text-sm font-semibold text-closie-muted">Pedido enviado</span>
              ) : (
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={() => notify(followMessage(follow(viewerId, item.person.id), firstName(item.person)))}
                >
                  {item.reason === "follows_you" ? "Seguir de volta" : "Seguir"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
