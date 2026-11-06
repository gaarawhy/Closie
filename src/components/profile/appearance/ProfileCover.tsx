"use client";

import clsx from "clsx";
import type { ResolvedAppearance } from "@/lib/appearance";
import type { Person } from "@/lib/social";
import { StickersLayer, type StickerEditing, type Today } from "./StickersLayer";
import { TextureLayer } from "./Texture";
import { gradientCss } from "./theme";

type ProfileCoverProps = {
  look: ResolvedAppearance;
  person: Person;
  today: Today;
  editing?: StickerEditing;
  className?: string;
};

const HEIGHT: Record<ResolvedAppearance["style"], string> = {
  classico: "h-40 @3xl:h-56",
  scrapbook: "h-44 @3xl:h-60",
};

// A capa: foto, cor, gradiente ou textura escolhidos; ou a capa do estilo. Por cima, os
// detalhes do estilo e os adesivos.
export function ProfileCover({ look, person, today, editing, className }: ProfileCoverProps) {
  const { cover, style } = look;

  return (
    <div className={clsx("relative isolate overflow-hidden", HEIGHT[style], className)}>
      <div aria-hidden className="absolute inset-0 -z-10">
        {cover.kind === "imagem" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" draggable={false} className="h-full w-full object-cover" style={{ objectPosition: `${cover.x}% ${cover.y}%` }} />
        ) : cover.kind === "cor" ? (
          <div className="h-full w-full" style={{ background: cover.color }} />
        ) : cover.kind === "gradiente" ? (
          <div className="h-full w-full" style={{ background: gradientCss(cover.gradient) }} />
        ) : cover.kind === "textura" ? (
          <div className="relative h-full w-full bg-[color:var(--p-surface)]">
            <TextureLayer texture={cover.texture} />
          </div>
        ) : (
          <StyleCover look={look} avatar={person.avatar} />
        )}
      </div>

      {/* Detalhe do scrapbook, vale para qualquer capa: papel rasgado na borda de baixo */}
      {style === "scrapbook" && (
        <svg aria-hidden viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute bottom-0 left-0 z-[1] h-4 w-full">
          <path
            d="M0 10L0 4L4 6L9 3L14 7L19 4L24 6L29 2L34 6L39 4L44 7L49 3L54 6L59 4L64 7L69 3L74 6L79 4L84 7L89 3L94 6L100 4L100 10Z"
            style={{ fill: "var(--p-bg)" }}
          />
        </svg>
      )}

      <StickersLayer stickers={look.stickers} today={today} editing={editing} />
    </div>
  );
}

// Capa de cada estilo quando a pessoa não escolheu outra
function StyleCover({ look, avatar }: { look: ResolvedAppearance; avatar: string | null }) {
  if (look.style === "scrapbook") {
    return (
      <div className="relative h-full w-full bg-[color-mix(in_srgb,var(--p-decor)_30%,#C8A47E)]">
        <TextureLayer texture="papel" className="opacity-90" />
        <div className="absolute top-6 -left-6 h-20 w-40 rotate-[-8deg] bg-[repeating-linear-gradient(0deg,transparent_0_15px,color-mix(in_srgb,var(--p-accent)_35%,transparent)_15px_16px)] bg-[color:var(--p-bg)] opacity-90 shadow-md" />
        <div className="absolute right-10 bottom-8 h-16 w-28 rotate-[6deg] bg-[color:var(--p-bg)] opacity-80 shadow-md" />
      </div>
    );
  }
  return (
    <>
      {avatar ? (
        // A própria foto, desfocada, colore o topo (cada perfil tem a sua cor)
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="h-full w-full scale-150 object-cover opacity-60 blur-2xl saturate-150" />
      ) : (
        <div className="h-full w-full bg-[linear-gradient(135deg,color-mix(in_srgb,var(--p-accent)_22%,var(--p-bg)),var(--p-surface),var(--p-bg))]" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,color-mix(in_srgb,var(--p-bg)_40%,transparent),var(--p-bg))]" />
    </>
  );
}
