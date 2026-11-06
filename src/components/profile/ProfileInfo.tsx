"use client";

import clsx from "clsx";
import { Globe, Lock, Palette, Pencil } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ResolvedAppearance } from "@/lib/appearance";
import { profilePrivacyLabels } from "@/lib/profile";
import type { Person, Relationship } from "@/lib/social";
import { FramedAvatar } from "./appearance/FramedAvatar";
import type { Today } from "./appearance/StickersLayer";
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
  today: Today;
  // Linha de "edição" da revista (Magazine): "Nº 11 · NOVEMBRO 2026"
  issue: string;
  actions: ProfileActions;
};

const NAME_SIZE: Record<ResolvedAppearance["style"], number> = {
  classico: 1.75,
  scrapbook: 2.1,
  y2k: 1.75,
  analog: 2,
  magazine: 2.9,
  minimal: 1.35,
  glitch: 1.9,
};

// Nome, @, bio, números e ações do perfil. Cada estilo monta isso do seu jeito (a revista tem
// manchete, o minimal fica em linha, o scrapbook tem bilhete e rabisco, o glitch tem RGB).
export function ProfileInfo({ person, look, rel, followsYou, canSee, stats, storyCount, today, issue, actions }: ProfileInfoProps) {
  const { style } = look;
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
      className={clsx(
        "font-bold break-words",
        themed.title,
        style === "magazine" ? "leading-[0.92] tracking-tight uppercase" : "leading-[1.08]",
        style === "scrapbook" && "-rotate-1",
        style === "glitch" && "[text-shadow:2px_0_var(--p-accent),-2px_0_var(--p-decor)]",
        style === "y2k" && "[text-shadow:0_2px_0_var(--p-decor)]",
      )}
      style={displaySize(NAME_SIZE[style])}
    >
      {style === "y2k" && <span aria-hidden>✦ </span>}
      {name}
      {style === "y2k" && <span aria-hidden> ✦</span>}
    </h1>
  );

  const meta = (
    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-[color:var(--p-muted)]">
      <span className={clsx(style === "glitch" && "text-base [font-family:var(--font-retro)]")}>
        @{person.username}
        {style === "glitch" && (
          <span aria-hidden className="motion-safe:animate-pulse">
            ▌
          </span>
        )}
      </span>
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
      {person.bio && <Bio style={style} text={person.bio} />}
      <Stats style={style} stats={stats} canSee={canSee} onOpen={actions.onOpenConnections} />
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

  if (style === "magazine") {
    return (
      <section aria-labelledby="titulo-perfil" className="px-5 pt-5 @5xl:px-0 @5xl:pt-8">
        <div className="flex items-end justify-between gap-3 border-b-2 border-[color:var(--p-text)] pb-2">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-[color:var(--p-accent-text)] uppercase">{issue}</span>
          {avatar(64)}
        </div>
        <div className="mt-3">{title}</div>
        {meta}
        {details}
        {buttons}
      </section>
    );
  }

  if (style === "minimal") {
    return (
      <section aria-labelledby="titulo-perfil" className="px-5 @5xl:px-0">
        <div className="-mt-9 flex items-end gap-4">
          {avatar(76)}
          <div className="min-w-0 pb-1">{title}</div>
        </div>
        {meta}
        {details}
        {buttons}
      </section>
    );
  }

  return (
    <section aria-labelledby="titulo-perfil" className="px-5 @5xl:px-0">
      <div className={clsx(style === "scrapbook" ? "-mt-16" : "-mt-14", "relative z-10")}>{avatar(style === "scrapbook" ? 112 : 104)}</div>
      <div className="mt-3">
        {title}
        {style === "scrapbook" && (
          <svg aria-hidden viewBox="0 0 120 12" className="mt-0.5 h-3 w-36" preserveAspectRatio="none">
            <path d="M2 8c20-6 38-6 58-2s40 4 58-3" fill="none" style={{ stroke: "var(--p-accent)" }} strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {style === "analog" && (
          <p aria-hidden className="mt-1 text-lg leading-none text-[color:var(--p-accent-text)] [font-family:var(--font-retro)]">
            ● REC {today.stamp}
          </p>
        )}
      </div>
      {meta}
      {details}
      {buttons}
    </section>
  );
}

function Bio({ style, text }: { style: ResolvedAppearance["style"]; text: string }) {
  if (style === "scrapbook") {
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
  if (style === "magazine") {
    return (
      <blockquote className="mt-4 border-l-[3px] border-[color:var(--p-accent)] pl-4 text-lg leading-snug italic [font-family:var(--font-editorial)] whitespace-pre-line break-words">
        “{text}”
      </blockquote>
    );
  }
  if (style === "glitch") {
    return (
      <p className="mt-3 text-lg leading-snug whitespace-pre-line break-words [font-family:var(--font-retro)]">
        <span aria-hidden className="text-[color:var(--p-accent-text)]">&gt; </span>
        {text}
      </p>
    );
  }
  if (style === "analog") {
    return <p className="mt-3 text-[16px] leading-relaxed italic [font-family:var(--font-editorial)] whitespace-pre-line break-words">{text}</p>;
  }
  if (style === "y2k") {
    return (
      <p className="mt-4 rounded-[22px] border border-[color:var(--p-border)] bg-[color:var(--p-surface)] px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line break-words shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        {text}
      </p>
    );
  }
  return <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line break-words">{text}</p>;
}

// Números sem fundo (pedido do usuário); o estilo muda a tipografia e as divisórias
function Stats({
  style,
  stats,
  canSee,
  onOpen,
}: {
  style: ResolvedAppearance["style"];
  stats: { posts: number; followers: number; following: number };
  canSee: boolean;
  onOpen: (tab: ConnectionsTab) => void;
}) {
  const magazine = style === "magazine";
  const items: { value: number; label: string; onClick?: () => void }[] = [
    {
      value: stats.posts,
      label: stats.posts === 1 ? "momento" : "momentos",
      onClick: () => document.getElementById("momentos")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    { value: stats.followers, label: stats.followers === 1 ? "seguidor" : "seguidores", onClick: canSee ? () => onOpen("followers") : undefined },
    { value: stats.following, label: "seguindo", onClick: canSee ? () => onOpen("following") : undefined },
  ];
  return (
    <div className={clsx("mt-5 flex", magazine ? "divide-x divide-[color:var(--p-border)] border-y border-[color:var(--p-border)]" : "gap-7")}>
      {items.map((item) => {
        const content: ReactNode = (
          <>
            <span className="block leading-none font-bold text-[color:var(--p-text)] [font-family:var(--p-display)]" style={displaySize(1.2)}>
              {item.value.toLocaleString("pt-BR")}
            </span>
            <span
              className={clsx(
                "mt-1 block text-[color:var(--p-muted)]",
                magazine ? "text-[10px] font-semibold tracking-[0.18em] uppercase" : "text-sm",
              )}
            >
              {item.label}
            </span>
          </>
        );
        const box = clsx("text-left", magazine && "flex-1 px-3 py-3 first:pl-0");
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
