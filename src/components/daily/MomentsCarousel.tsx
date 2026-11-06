"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRef, useState } from "react";
import { slideIndexFromScroll } from "@/components/ui/carousel";
import type { Session } from "@/lib/account";
import { DAILY_PATHS, useComposer, useNotify } from "./DailyShell";
import { MomentCard, MomentOverlay, MomentsEmpty, personFor, useFriendsMoments } from "./moments";

const GAP = 12; // gap-3 entre os cartões

// Logo abaixo dos stories: os momentos (álbuns) mais recentes seus e de quem você segue, num
// carrossel de cartões grandes (o próximo aparece na beirada). As bolinhas mostram onde você está
// e levam até o cartão; "Ver tudo" abre a lista completa. O álbum abre aqui mesmo.
export function MomentsCarousel({ session, now, hideEmpty }: { session: Session; now: number; hideEmpty: boolean }) {
  const moments = useFriendsMoments(session.id, 8);
  const openComposer = useComposer();
  const notify = useNotify();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  if (moments.length === 0) {
    if (hideEmpty) return null;
    return (
      <section aria-label="Momentos dos amigos" className="px-4 pt-3 pb-1 md:max-w-xl">
        <MomentsEmpty onCreate={() => openComposer("momento")} />
      </section>
    );
  }

  const current = Math.min(active, moments.length - 1);

  function onScroll() {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return;
    setActive(slideIndexFromScroll(track.scrollLeft, first.offsetWidth + GAP, moments.length));
  }

  function goTo(index: number) {
    const slide = trackRef.current?.children[index] as HTMLElement | undefined;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    slide?.scrollIntoView({ behavior: still ? "auto" : "smooth", inline: "start", block: "nearest" });
  }

  return (
    <section aria-labelledby="titulo-momentos-amigos" className="pt-3">
      <h2 id="titulo-momentos-amigos" className="sr-only">
        Momentos dos amigos
      </h2>
      <div ref={trackRef} onScroll={onScroll} className="scrollbar-none flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4">
        {moments.map((post) => {
          const owner = personFor(post.ownerId, session);
          if (!owner) return null;
          return (
            <div key={post.id} className="w-[88%] shrink-0 snap-start sm:w-[62%] lg:w-[48%]">
              <MomentCard post={post} owner={owner} isOwn={post.ownerId === session.id} now={now} variant="destaque" onOpen={() => setOpenId(post.id)} />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between px-4">
        <div className={clsx("-ml-2 flex items-center", moments.length === 1 && "invisible")}>
          {moments.map((post, index) => (
            <button
              key={post.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Ir para o momento ${index + 1} de ${moments.length}`}
              aria-current={index === current ? "true" : undefined}
              className="flex h-8 min-w-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-closie-text"
            >
              <span
                aria-hidden
                className={clsx(
                  "block h-1.5 rounded-full transition-all",
                  index === current ? "w-5 bg-closie-red" : "w-1.5 bg-closie-border-strong/50",
                )}
              />
            </button>
          ))}
        </div>
        <Link href={DAILY_PATHS.moments} className="rounded-full px-2 py-1 text-sm font-semibold text-closie-red hover:underline">
          Ver tudo
        </Link>
      </div>

      {openId && <MomentOverlay postId={openId} session={session} now={now} onClose={() => setOpenId(null)} onNotify={notify} />}
    </section>
  );
}
