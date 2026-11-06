"use client";

import { PlayIcon, StackIcon } from "@/components/ui/Glyphs";
import { timeAgo, type FeedGroup } from "@/lib/stories";
import { StoryCover } from "./StoryCover";

type DumpGridProps = {
  groups: FeedGroup[];
  now: number;
  // Só na Pesquisa: seguir quem postou (o botão some quando você já segue)
  followState?: (ownerId: string) => "approved" | "pending" | null;
  onFollow?: (group: FeedGroup) => void;
  // Abre o leitor de tela cheia neste dump (e segue para os próximos)
  onOpen: (index: number) => void;
};

// Grade de dumps, como na aba de histórias do Snapchat: cartões altos com cantos arredondados,
// a foto mais recente de capa, o nome por cima e, no canto, quantos stories tem (ou se é vídeo).
export function DumpGrid({ groups, now, followState, onFollow, onOpen }: DumpGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 px-4 sm:grid-cols-3 lg:grid-cols-4">
      {groups.map((group, index) => {
        const name = group.owner.displayName ?? group.owner.username;
        const cover = group.stories[group.stories.length - 1];
        const count = group.stories.length;
        const fresh = group.status !== "seen";
        const status = followState ? followState(group.owner.id) : "approved";
        return (
          <li key={group.owner.id} className="relative">
            <button
              type="button"
              onClick={() => onOpen(index)}
              aria-label={`Ver o dump de ${name}: ${count} ${count === 1 ? "story" : "stories"}, ${timeAgo(group.latestAt, now)}${fresh ? ", novo" : ", já visto"}`}
              className="group relative block aspect-[3/5] w-full overflow-hidden rounded-2xl bg-closie-text text-left"
            >
              <StoryCover
                story={cover}
                badge={false}
                className="motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-[1.03]"
              />
              <span aria-hidden className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/25 to-transparent px-3 pt-16 pb-3 text-white">
                <span className="flex items-center gap-1.5">
                  {fresh && <span className="size-2 shrink-0 rounded-full bg-closie-red ring-2 ring-white/80" />}
                  <span className="truncate text-[15px] leading-tight font-bold [text-shadow:0_1px_6px_rgb(0_0_0/0.5)]">{name}</span>
                </span>
                <span className="mt-0.5 block text-xs text-white/80">{timeAgo(group.latestAt, now)}</span>
              </span>
              {(count > 1 || cover.media.type === "video") && (
                <span aria-hidden className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs font-semibold text-white">
                  {cover.media.type === "video" ? <PlayIcon /> : <StackIcon />}
                  {count > 1 && count}
                </span>
              )}
            </button>
            {onFollow && status !== "approved" && (
              <button
                type="button"
                onClick={() => onFollow(group)}
                disabled={status === "pending"}
                aria-label={status === "pending" ? `Pedido enviado para ${name}` : `Seguir ${name}`}
                className="absolute top-2 left-2 rounded-full bg-closie-bg/95 px-3 py-1.5 text-xs font-semibold text-closie-text shadow-sm transition-colors hover:bg-closie-bg disabled:text-closie-muted"
              >
                {status === "pending" ? "Pedido enviado" : "Seguir"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
