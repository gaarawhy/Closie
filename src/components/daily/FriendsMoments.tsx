"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/lib/account";
import { useNow } from "@/lib/stories";
import { DAILY_PATHS, useComposer, useNotify } from "./DailyShell";
import { MomentCard, MomentOverlay, MomentsEmpty, personFor, useFriendsMoments } from "./moments";

// "Ver tudo" dos momentos do Início: todos os álbuns recentes seus e de quem você segue, numa
// grade. O álbum abre aqui mesmo.
export function FriendsMoments() {
  const session = useSession();
  const now = useNow(60_000);
  const notify = useNotify();
  const openComposer = useComposer();
  const moments = useFriendsMoments(session?.id ?? "", 60);
  const [openId, setOpenId] = useState<string | null>(null);
  if (!session) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-4 md:pt-8">
      <Link href={DAILY_PATHS.home} className="-ml-1 inline-flex h-9 items-center gap-0.5 rounded-full pr-3 pl-1 text-sm font-semibold text-closie-muted hover:text-closie-text">
        <ChevronLeft aria-hidden className="size-5" />
        Início
      </Link>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">Momentos dos amigos</h1>
      <p className="mt-1 text-sm text-closie-muted">Os álbuns mais recentes seus e de quem você segue.</p>

      {moments.length === 0 ? (
        <MomentsEmpty className="mt-5 md:max-w-xl" onCreate={() => openComposer("momento")} />
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {moments.map((post) => {
            const owner = personFor(post.ownerId, session);
            if (!owner) return null;
            return (
              <li key={post.id}>
                <MomentCard post={post} owner={owner} isOwn={post.ownerId === session.id} now={now} variant="grade" onOpen={() => setOpenId(post.id)} />
              </li>
            );
          })}
        </ul>
      )}

      {openId && <MomentOverlay postId={openId} session={session} now={now} onClose={() => setOpenId(null)} onNotify={notify} />}
    </div>
  );
}
