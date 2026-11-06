"use client";

import clsx from "clsx";
import { Images, Plus } from "lucide-react";
import { useMemo } from "react";
import { AlbumViewer } from "@/components/profile/AlbumViewer";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { StackIcon } from "@/components/ui/Glyphs";
import type { Session } from "@/lib/account";
import { canViewPosts, friendsMoments, getPost, usePostsSnapshot, type Post } from "@/lib/posts";
import { getPerson, useSocialSnapshot, type Person } from "@/lib/social";
import { timeAgo } from "@/lib/stories";

// Momentos (álbuns) dos amigos fora do perfil: o cartão grande do Início, a grade do "Ver tudo"
// e o álbum aberto por cima da tela (sem sair de onde a pessoa está).

// Seus momentos e os de quem você segue, sempre atualizados (posts, follows, bloqueios)
export function useFriendsMoments(viewerId: string, limit: number): Post[] {
  const posts = usePostsSnapshot();
  const social = useSocialSnapshot();
  return useMemo(() => {
    void posts;
    void social;
    return viewerId ? friendsMoments(viewerId, limit) : [];
  }, [posts, social, viewerId, limit]);
}

// Dono do momento: do diretório; você mesmo, pela sessão (se ainda não estiver no diretório)
export function personFor(id: string, session: Session): Person | null {
  const found = getPerson(id);
  if (found) return found;
  if (id !== session.id) return null;
  const { profile } = session;
  return {
    id: session.id,
    username: profile.username ?? "",
    displayName: profile.displayName,
    avatar: profile.avatar,
    privacy: profile.privacy,
    bio: profile.bio,
  };
}

type MomentCardProps = {
  post: Post;
  owner: Person;
  isOwn: boolean;
  now: number;
  // "destaque": o cartão grande do Início; "grade": os menores do "Ver tudo"
  variant: "destaque" | "grade";
  onOpen: () => void;
};

export function MomentCard({ post, owner, isOwn, now, variant, onOpen }: MomentCardProps) {
  const name = isOwn ? "Você" : (owner.displayName ?? owner.username);
  const title = post.caption?.trim() || (isOwn ? "Seu momento" : `Momento de ${name.split(" ")[0]}`);
  const count = post.photos.length;
  const details = `${timeAgo(post.createdAt, now)} · ${count === 1 ? "1 foto" : `${count} fotos`}`;
  const big = variant === "destaque";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${title}, de ${isOwn ? "você" : name}, ${details}. Ver momento`}
      className={clsx(
        "group relative block w-full overflow-hidden rounded-3xl bg-closie-panel text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-closie-text",
        big ? "aspect-[4/3] sm:aspect-[16/10]" : "aspect-[4/5]",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.photos[0].url}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
      />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/25" />
      <span aria-hidden className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
        <span className="flex min-w-0 items-center gap-2 rounded-full bg-black/35 py-1 pr-3 pl-1 text-sm font-semibold text-white backdrop-blur-sm">
          <Avatar name={name} src={owner.avatar ?? undefined} size={big ? 26 : 22} />
          <span className="truncate">{name}</span>
        </span>
        {count > 1 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-xs font-semibold text-white">
            <StackIcon className="size-3.5" />
            {count}
          </span>
        )}
      </span>
      <span aria-hidden className={clsx("absolute inset-x-0 bottom-0 block", big ? "p-4" : "p-3")}>
        <span className={clsx("line-clamp-2 block leading-tight font-bold text-white", big ? "text-xl" : "text-base")}>{title}</span>
        <span className="mt-1 block text-sm text-white/80">{details}</span>
        {big && (
          <span className="mt-3 inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-closie-text transition-colors group-hover:bg-white/90">
            Ver momento
          </span>
        )}
      </span>
    </button>
  );
}

// Ninguém (nem você) postou um momento ainda: o lugar do cartão convida a criar o primeiro
export function MomentsEmpty({ onCreate, className }: { onCreate: () => void; className?: string }) {
  return (
    <div className={clsx("flex flex-col items-start gap-3 rounded-3xl bg-closie-panel p-5", className)}>
      <span className="flex size-11 items-center justify-center rounded-2xl bg-closie-bg text-closie-red shadow-sm">
        <Images aria-hidden className="size-5" />
      </span>
      <div>
        <p className="font-semibold">Os álbuns dos seus amigos aparecem aqui</p>
        <p className="mt-0.5 text-sm text-closie-muted">Junte as fotos de um dia, de uma viagem ou de um rolê num momento: ele aparece aqui e no seu perfil.</p>
      </div>
      <Button size="sm" className="rounded-full" onClick={onCreate}>
        <Plus aria-hidden className="size-4" />
        Criar um momento
      </Button>
    </div>
  );
}

// O álbum aberto por cima da tela. Se o momento sumir (excluído, bloqueio), não mostra nada.
export function MomentOverlay({
  postId,
  session,
  now,
  onClose,
  onNotify,
}: {
  postId: string;
  session: Session;
  now: number;
  onClose: () => void;
  onNotify: (message: string) => void;
}) {
  const snapshot = usePostsSnapshot();
  const post = useMemo(() => {
    void snapshot;
    return getPost(postId);
  }, [snapshot, postId]);
  if (!post || !canViewPosts(session.id, post.ownerId)) return null;
  const owner = personFor(post.ownerId, session);
  if (!owner) return null;
  return (
    <AlbumViewer
      key={post.id}
      post={post}
      owner={owner}
      viewerId={session.id}
      viewerUsername={session.profile.username ?? null}
      now={now}
      onClose={onClose}
      onDeleted={() => {
        onClose();
        onNotify("Momento excluído.");
      }}
      onNotify={onNotify}
    />
  );
}
