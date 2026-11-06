"use client";

import { Heart } from "lucide-react";
import { useMemo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { getPerson, useSocialSnapshot } from "@/lib/social";
import {
  getStoryLikes,
  getStoryReplies,
  getStoryViewers,
  timeAgo,
  useNow,
  useStoriesSnapshot,
} from "@/lib/stories";

// Para o dono: quem viu (com curtida marcada) e as respostas do story.
export function StoryInsights({ storyId, ownerId }: { storyId: string; ownerId: string }) {
  const stories = useStoriesSnapshot();
  const social = useSocialSnapshot();
  const now = useNow(60_000);

  const data = useMemo(() => {
    void stories;
    void social;
    const viewers = getStoryViewers(storyId, ownerId);
    const likes = getStoryLikes(storyId, ownerId);
    const replies = getStoryReplies(storyId, ownerId);
    const liked = new Set(likes.ok ? likes.likes.map((like) => like.userId) : []);
    const person = (id: string) => getPerson(id);
    return {
      viewers: (viewers.ok ? viewers.viewers : []).map((item) => ({ ...item, person: person(item.viewerId), liked: liked.has(item.viewerId) })),
      likes: liked.size,
      replies: (replies.ok ? replies.replies : []).map((reply) => ({ ...reply, person: person(reply.fromId) })),
    };
  }, [storyId, ownerId, stories, social]);

  const label = (person: { displayName: string | null; username: string } | null) =>
    person ? (person.displayName ?? `@${person.username}`) : "Conta removida";

  return (
    <div className="max-h-[60dvh] overflow-y-auto">
      <h2 className="text-lg font-semibold">
        {data.viewers.length} {data.viewers.length === 1 ? "visualização" : "visualizações"}
        {data.likes > 0 && <span className="font-normal text-closie-muted"> · {data.likes} {data.likes === 1 ? "curtida" : "curtidas"}</span>}
      </h2>
      {data.viewers.length === 0 ? (
        <p className="mt-2 text-sm text-closie-muted">Ninguém viu ainda. As visualizações aparecem aqui.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {data.viewers.map((item) => (
            <li key={item.viewerId} className="flex items-center gap-3">
              <Avatar name={label(item.person)} src={item.person?.avatar ?? undefined} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{label(item.person)}</span>
                <span className="block text-xs text-closie-muted">{timeAgo(item.viewedAt, now)}</span>
              </span>
              {item.liked && <Heart aria-label="Curtiu" className="size-4 fill-closie-red text-closie-red" />}
            </li>
          ))}
        </ul>
      )}

      {data.replies.length > 0 && (
        <>
          <h2 className="mt-6 text-lg font-semibold">Respostas</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {data.replies.map((reply) => (
              <li key={reply.id} className="flex items-start gap-3">
                <Avatar name={label(reply.person)} src={reply.person?.avatar ?? undefined} size={32} />
                <span className="min-w-0 flex-1 rounded-2xl bg-closie-panel px-3 py-2 text-sm">
                  <span className="block font-semibold">{label(reply.person)}</span>
                  <span className="block break-words">{reply.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
