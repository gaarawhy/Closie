"use client";

import clsx from "clsx";
import { useMemo, type ReactNode } from "react";
import type { ResolvedAppearance } from "@/lib/appearance";
import type { Post } from "@/lib/posts";
import type { Person, Relationship } from "@/lib/social";
import { profileFontVariables } from "./appearance/fonts";
import { ProfileCover } from "./appearance/ProfileCover";
import { todayStamp, type StickerEditing } from "./appearance/StickersLayer";
import { TextureLayer } from "./appearance/Texture";
import { themeStyle } from "./appearance/theme";
import { MomentsCollection } from "./MomentsCollection";
import { ProfileInfo, type ProfileActions } from "./ProfileInfo";

export type ProfileViewActions = ProfileActions & {
  onOpenMoment: (postId: string) => void;
  onCreateMoment: () => void;
};

type ProfileViewProps = {
  person: Person;
  look: ResolvedAppearance;
  rel: Relationship;
  followsYou: boolean;
  canSee: boolean;
  stats: { posts: number; followers: number; following: number };
  storyCount: number;
  moments: Post[];
  now: number;
  actions: ProfileViewActions;
  // Botões do canto da capa (só na página de verdade)
  corner?: ReactNode;
  // Prévia da personalização: nada clicável além dos adesivos (que dá para arrastar)
  preview?: { stickers: StickerEditing };
  className?: string;
};

const MONTHS = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];

// O perfil desenhado com a personalização de quem é o dono. As variáveis --p-* valem só aqui
// dentro: nem os outros perfis nem o resto da plataforma mudam. Usa consultas de contêiner
// (@container), então a prévia encolhida mostra exatamente o que a página mostra.
export function ProfileView({ person, look, rel, followsYou, canSee, stats, storyCount, moments, now, actions, corner, preview, className }: ProfileViewProps) {
  const today = useMemo(() => todayStamp(now), [now]);
  const issue = useMemo(() => {
    const date = new Date(now);
    return `Nº ${String(date.getMonth() + 1).padStart(2, "0")} · ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }, [now]);

  return (
    <div className={clsx(profileFontVariables, "@container relative isolate w-full overflow-hidden", className)} style={themeStyle(look)} data-style={look.style}>
      <div aria-hidden className="absolute inset-0 -z-10 bg-[color:var(--p-bg)]" />
      <TextureLayer texture={look.texture} className="-z-10" />
      <div className="mx-auto w-full max-w-6xl @5xl:px-6 @5xl:pt-6">
        <div className="relative">
          <ProfileCover look={look} person={person} today={today} editing={preview?.stickers} className="@5xl:rounded-[var(--p-radius)]" />
          {/* Fora do recorte da capa: o menu do ⋯ pode descer por cima do resto */}
          {corner && <div className="absolute top-3 right-3 z-30 flex gap-2">{corner}</div>}
        </div>
        <div inert={preview ? true : undefined} className="@5xl:grid @5xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)] @5xl:gap-10">
          <ProfileInfo
            person={person}
            look={look}
            rel={rel}
            followsYou={followsYou}
            canSee={canSee}
            stats={stats}
            storyCount={storyCount}
            today={today}
            issue={issue}
            actions={actions}
          />
          {rel !== "blocked" && (
            <div className="px-5 pt-8 pb-12 @5xl:px-0">
              <MomentsCollection
                moments={moments}
                total={stats.posts}
                now={now}
                isOwn={rel === "self"}
                look={look}
                locked={canSee ? null : { username: person.username, requested: rel === "requested", onRequest: actions.onFollow }}
                onOpen={actions.onOpenMoment}
                onCreate={actions.onCreateMoment}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
