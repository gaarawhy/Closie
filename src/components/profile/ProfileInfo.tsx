"use client";

import clsx from "clsx";
import { Globe, Lock, Palette, Pencil } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ResolvedAppearance } from "@/lib/appearance";
import { profilePrivacyLabels } from "@/lib/profile";
import type { Person, Relationship } from "@/lib/social";
import { FramedAvatar } from "./appearance/FramedAvatar";
import { displaySize, themed } from "./appearance/theme";
import type { ConnectionsTab } from "./ConnectionsSheet";
import { CUSTOMIZE_PATH, EDIT_PROFILE_PATH } from "./links";

export type ProfileActions = {
  onOpenStories: () => void;
  onOpenConnections: (tab: ConnectionsTab) => void;
  onFollow: () => void;
  onUnfollow: () => void;
  onCancelRequest: () => void;
  onUnblock: () => void;
};

type ProfileInfoProps = {
  person: Person;
  look: ResolvedAppearance;
  rel: Relationship;
  followsYou: boolean;
  canSee: boolean;
  stats: { posts: number; followers: number; following: number };
  storyCount: number;
  actions: ProfileActions;
};

// Nome, @, bio, números e ações do perfil. O scrapbook tem título meio torto com rabisco, foto
// maior (polaroid) e a bio num bilhete preso com fita; o clássico é limpo.
export function ProfileInfo({ person, look, rel, followsYou, canSee, stats, storyCount, actions }: ProfileInfoProps) {
  const scrapbook = look.style === "scrapbook";
  const isOwn = rel === "self";
  const blocked = rel === "blocked";
  const name = person.displayName ?? person.username;
  const avatar = (size: number) => (
    <FramedAvatar
      frame={look.frame}
      name={name}
      src={person.avatar}
      size={size}
      stories={storyCount > 0 && !blocked}
      onOpenStories={actions.onOpenStories}
      storiesLabel={isOwn ? "Ver seus stories" : `Ver os stories de ${name}`}
    />
  );

  const title = (
    <h1
      id="titulo-perfil"
      className={clsx("leading-[1.08] font-bold break-words", themed.title, scrapbook && "-rotate-1")}
      style={displaySize(scrapbook ? 2.1 : 1.75)}
    >
      {name}
    </h1>
  );

  const meta = (
    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-[color:var(--p-muted)]">
      <span>@{person.username}</span>
      <PrivacyChip privacy={person.privacy} editable={isOwn} />
      {followsYou && !isOwn && !blocked && (
        <span className="rounded-full border border-[color:var(--p-border)] px-2 py-0.5 text-xs font-semibold text-[color:var(--p-text)]">Segue você</span>
      )}
    </div>
  );

  const details = blocked ? (
    <p className="mt-4 rounded-[var(--p-radius)] border border-[color:var(--p-border)] px-4 py-3 text-sm text-[color:var(--p-muted)]">
      Você bloqueou @{person.username}. Vocês não veem os momentos nem os stories um do outro.
    </p>
  ) : (
    <>
      {person.bio && <Bio text={person.bio} note={scrapbook} />}
      <Stats stats={stats} canSee={canSee} onOpen={actions.onOpenConnections} />
    </>
  );

  const buttons = (
    <div className="mt-5 flex gap-2">
      {isOwn ? (
        <>
          <Link href={EDIT_PROFILE_PATH} className={clsx(themed.secondaryButton, "min-w-0 flex-1")}>
            <Pencil aria-hidden className="size-4 shrink-0" />
            Editar perfil
          </Link>
          <Link href={CUSTOMIZE_PATH} aria-label="Personalizar perfil" className={clsx(themed.primaryButton, "min-w-0 flex-1")}>
            <Palette aria-hidden className="size-4 shrink-0" />
            Personalizar
          </Link>
        </>
      ) : blocked ? (
        <button type="button" onClick={actions.onUnblock} className={clsx(themed.secondaryButton, "flex-1")}>
          Desbloquear
        </button>
      ) : rel === "following" ? (
        <button type="button" onClick={actions.onUnfollow} className={clsx(themed.secondaryButton, "flex-1")}>
          Seguindo
        </button>
      ) : rel === "requested" ? (
        <button type="button" onClick={actions.onCancelRequest} className={clsx(themed.secondaryButton, "flex-1")}>
          Pedido enviado
        </button>
      ) : (
        <button type="button" onClick={actions.onFollow} className={clsx(themed.primaryButton, "flex-1")}>
          {followsYou ? "Seguir de volta" : person.privacy === "private" ? "Pedir para seguir" : "Seguir"}
        </button>
      )}
    </div>
  );

  return (
    <section aria-labelledby="titulo-perfil" className="px-5 @5xl:px-0">
      <div className={clsx("relative z-10", scrapbook ? "-mt-16" : "-mt-14")}>{avatar(scrapbook ? 112 : 104)}</div>
      <div className="mt-3">
        {title}
        {scrapbook && (
          <svg aria-hidden viewBox="0 0 120 12" className="mt-0.5 h-3 w-36" preserveAspectRatio="none">
            <path d="M2 8c20-6 38-6 58-2s40 4 58-3" fill="none" style={{ stroke: "var(--p-accent)" }} strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
      </div>
      {meta}
      {details}
      {buttons}
    </section>
  );
}

// No scrapbook, a bio vira um bilhete pautado preso com um pedaço de fita
function Bio({ text, note }: { text: string; note: boolean }) {
  if (!note) return <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line break-words">{text}</p>;
  return (
    <div className="relative mt-5 rotate-[0.8deg] bg-[color:var(--p-surface)] px-4 pt-4 pb-3 shadow-sm">
      <span
        aria-hidden
        className="absolute -top-2.5 left-6 h-5 w-16 rotate-[-6deg] bg-[color:var(--p-decor)] opacity-85"
        style={{ clipPath: "polygon(3% 0, 97% 6%, 100% 50%, 96% 100%, 4% 94%, 0 50%)" }}
      />
      <p className="bg-[repeating-linear-gradient(transparent_0_23px,var(--p-border)_23px_24px)] text-[15px] leading-6 whitespace-pre-line break-words">
        {text}
      </p>
    </div>
  );
}

// Números sem fundo (pedido do usuário)
function Stats({
  stats,
  canSee,
  onOpen,
}: {
  stats: { posts: number; followers: number; following: number };
  canSee: boolean;
  onOpen: (tab: ConnectionsTab) => void;
}) {
  const items: { value: number; label: string; onClick?: () => void }[] = [
    {
      value: stats.posts,
      label: stats.posts === 1 ? "Momento" : "Momentos",
      onClick: () => document.getElementById("momentos")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    { value: stats.followers, label: stats.followers === 1 ? "Seguidor" : "Seguidores", onClick: canSee ? () => onOpen("followers") : undefined },
    { value: stats.following, label: "Seguindo", onClick: canSee ? () => onOpen("following") : undefined },
  ];
  return (
    <div className="mt-5 flex gap-7">
      {items.map((item) => {
        const content: ReactNode = (
          <>
            <span className="block leading-none font-bold text-[color:var(--p-text)] [font-family:var(--p-display)]" style={displaySize(1.2)}>
              {item.value.toLocaleString("pt-BR")}
            </span>
            <span className="mt-1 block text-sm text-[color:var(--p-muted)]">{item.label}</span>
          </>
        );
        const box = "text-left";
        return item.onClick ? (
          <button key={item.label} type="button" onClick={item.onClick} className={clsx(box, "rounded-md transition-opacity hover:opacity-70")}>
            {content}
          </button>
        ) : (
          <div key={item.label} className={box} title="Perfil privado">
            {content}
          </div>
        );
      })}
    </div>
  );
}

function PrivacyChip({ privacy, editable }: { privacy: Person["privacy"]; editable: boolean }) {
  const Icon = privacy === "private" ? Lock : Globe;
  const chip = "inline-flex items-center gap-1 rounded-full border border-[color:var(--p-border)] px-2 py-0.5 text-xs font-semibold text-[color:var(--p-text)]";
  const content = (
    <>
      <Icon aria-hidden className="size-3.5" />
      {profilePrivacyLabels[privacy]}
    </>
  );
  return editable ? (
    <Link
      href={`${EDIT_PROFILE_PATH}#privacidade`}
      aria-label={`Perfil ${profilePrivacyLabels[privacy].toLowerCase()}. Mudar a privacidade`}
      className={clsx(chip, "transition-colors hover:bg-[color:var(--p-surface)]")}
    >
      {content}
    </Link>
  ) : (
    <span className={chip}>{content}</span>
  );
}
