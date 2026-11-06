"use client";

import clsx from "clsx";
import { Plus, UserPlus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import type { FeedGroup } from "@/lib/stories";
import { StoryCover } from "./StoryCover";

type RingState = "new" | "seen" | "none";

// Anel em volta do avatar: vermelho = tem story novo; cinza = já viu tudo.
export function StoryRing({ state, children }: { state: RingState; children: ReactNode }) {
  return (
    <span
      className={clsx(
        "flex rounded-full p-[3px]",
        state === "new" && "bg-closie-red",
        state === "seen" && "bg-closie-border-strong/45",
      )}
    >
      <span className="flex rounded-full bg-closie-bg p-[2px]">{children}</span>
    </span>
  );
}

export const firstName = (person: { displayName: string | null; username: string }) =>
  (person.displayName ?? person.username).trim().split(/\s+/)[0] || person.username;

// Bolinha grande, como na aba de histórias do Snapchat: mostra a foto do story (não o avatar)
// dentro do anel. Tamanho fixo de 84 px (o conteúdo fica com 72 px).
function Bubble({ ring, children }: { ring: RingState; children: ReactNode }) {
  return (
    <span
      className={clsx(
        "flex size-[84px] rounded-full p-[3px]",
        ring === "new" && "bg-closie-red",
        ring === "seen" && "bg-closie-border-strong/45",
      )}
    >
      <span className="relative block size-full overflow-hidden rounded-full border-[3px] border-closie-bg bg-closie-panel">
        {children}
      </span>
    </span>
  );
}

function Label({ name, sub, muted }: { name: string; sub: string; muted?: boolean }) {
  return (
    <span className="mt-1.5 flex w-full flex-col items-center leading-tight">
      <span className={clsx("w-full truncate text-center text-[13px] font-semibold", muted && "text-closie-muted")}>{name}</span>
      <span className="w-full truncate text-center text-xs text-closie-muted">{sub}</span>
    </span>
  );
}

type StoriesRailProps = {
  me: { name: string; username: string; avatar: string | null };
  mine: FeedGroup | null;
  // Não vistos primeiro, depois os vistos (a ordem do feed)
  groups: FeedGroup[];
  loading: boolean;
  showFindFriends: boolean;
  onOpenMine: () => void;
  onOpenGroup: (index: number) => void;
  onCreate: () => void;
};

const item = "flex w-[92px] shrink-0 snap-start flex-col items-center";

// Fileira de bolinhas: você primeiro (o + publica), depois quem você segue, com nome e @.
export function StoriesRail({ me, mine, groups, loading, showFindFriends, onOpenMine, onOpenGroup, onCreate }: StoriesRailProps) {
  const myCover = mine ? mine.stories[mine.stories.length - 1] : null;
  return (
    <ul className="scrollbar-none flex snap-x gap-2 overflow-x-auto px-4 pt-2 pb-4" aria-label="Stories">
      <li className={item}>
        <div className="relative">
          <button
            type="button"
            onClick={mine ? onOpenMine : onCreate}
            aria-label={mine ? "Ver seus stories" : "Publicar seu primeiro story"}
            className="flex rounded-full"
          >
            <Bubble ring={mine ? "new" : "none"}>
              {myCover ? <StoryCover story={myCover} badge={false} /> : <Avatar name={me.name} src={me.avatar ?? undefined} size={72} />}
            </Bubble>
          </button>
          <button
            type="button"
            onClick={onCreate}
            aria-label="Publicar story"
            className="absolute -bottom-1 left-1/2 flex h-7 -translate-x-1/2 items-center rounded-full border-[3px] border-closie-bg bg-closie-red px-2.5 text-closie-on-red shadow-sm hover:bg-closie-red-hover"
          >
            <Plus aria-hidden className="size-4" strokeWidth={3} />
          </button>
        </div>
        <Label name="Seu daily" sub={`@${me.username}`} />
      </li>

      {loading
        ? Array.from({ length: 4 }, (_, index) => (
            <li key={index} aria-hidden className={item}>
              <span className="size-[84px] rounded-full bg-closie-panel motion-safe:animate-pulse" />
              <span className="mt-2 h-3 w-16 rounded-full bg-closie-panel motion-safe:animate-pulse" />
              <span className="mt-1 h-2.5 w-12 rounded-full bg-closie-panel motion-safe:animate-pulse" />
            </li>
          ))
        : groups.map((group, index) => {
            const fresh = group.status !== "seen";
            const newCount = group.stories.length - group.seenIds.length;
            const name = group.owner.displayName ?? group.owner.username;
            return (
              <li key={group.owner.id} className={item}>
                <button
                  type="button"
                  onClick={() => onOpenGroup(index)}
                  aria-label={`Stories de ${name}${fresh ? `, ${newCount} ${newCount === 1 ? "novo" : "novos"}` : ", já vistos"}`}
                  className="flex rounded-full"
                >
                  <Bubble ring={fresh ? "new" : "seen"}>
                    <StoryCover story={group.stories[group.stories.length - 1]} badge={false} />
                  </Bubble>
                </button>
                <Label name={firstName(group.owner)} sub={`@${group.owner.username}`} muted={!fresh} />
              </li>
            );
          })}

      {showFindFriends && !loading && (
        <li className={item}>
          <Link
            href="/daily/pesquisar"
            aria-label="Encontrar amigos para seguir"
            className="flex size-[84px] items-center justify-center rounded-full border-2 border-dashed border-closie-border-strong/60 text-closie-muted transition-colors hover:border-closie-text hover:text-closie-text"
          >
            <UserPlus aria-hidden className="size-7" />
          </Link>
          <Label name="Encontrar" sub="pessoas" muted />
        </li>
      )}
    </ul>
  );
}
