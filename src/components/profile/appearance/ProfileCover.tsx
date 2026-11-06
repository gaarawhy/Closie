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
  y2k: "h-44 @3xl:h-60",
  analog: "h-40 @3xl:h-56",
  magazine: "h-52 @3xl:h-72",
  minimal: "h-32 @3xl:h-48",
  glitch: "h-40 @3xl:h-56",
};

// Quatro pontas brilhando (Y2K)
const Sparkle = ({ className }: { className: string }) => (
  <svg aria-hidden viewBox="0 0 24 24" className={clsx("absolute fill-white drop-shadow", className)}>
    <path d="M12 0Q12 12 24 12Q12 12 12 24Q12 12 0 12Q12 12 12 0Z" />
  </svg>
);

// A capa: foto, cor, gradiente ou textura escolhidos; ou a capa do estilo. Por cima, os
// detalhes do estilo e os adesivos.
export function ProfileCover({ look, person, today, editing, className }: ProfileCoverProps) {
  const { cover, style } = look;
  const isDefault = cover.kind === "padrao";
  const height = style === "minimal" && isDefault ? "h-16 @3xl:h-20" : HEIGHT[style];

  return (
    <div className={clsx("relative isolate overflow-hidden", height, className)}>
      <div aria-hidden className="absolute inset-0 -z-10">
        {cover.kind === "imagem" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt=""
            draggable={false}
            className={clsx(
              "h-full w-full object-cover",
              style === "analog" && "sepia-[.35] saturate-[.85] contrast-[1.05]",
              style === "glitch" && "contrast-125 saturate-150",
            )}
            style={{ objectPosition: `${cover.x}% ${cover.y}%` }}
          />
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

      {/* Detalhes do estilo, valem para qualquer capa */}
      {style === "analog" && <TextureLayer texture="grao" className="opacity-60" />}
      {style === "glitch" && <TextureLayer texture="scanlines" />}
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
  switch (look.style) {
    case "classico":
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
    case "scrapbook":
      return (
        <div className="relative h-full w-full bg-[color-mix(in_srgb,var(--p-decor)_30%,#C8A47E)]">
          <TextureLayer texture="papel" className="opacity-90" />
          <div className="absolute top-6 -left-6 h-20 w-40 rotate-[-8deg] bg-[repeating-linear-gradient(0deg,transparent_0_15px,color-mix(in_srgb,var(--p-accent)_35%,transparent)_15px_16px)] bg-[color:var(--p-bg)] opacity-90 shadow-md" />
          <div className="absolute right-10 bottom-8 h-16 w-28 rotate-[6deg] bg-[color:var(--p-bg)] opacity-80 shadow-md" />
        </div>
      );
    case "y2k":
      return (
        <div className="relative h-full w-full" style={{ background: gradientCss("cromado") }}>
          <TextureLayer texture="holografico" className="opacity-100" />
          <Sparkle className="top-5 left-[12%] size-7" />
          <Sparkle className="top-[45%] left-[38%] size-4 opacity-80" />
          <Sparkle className="top-6 right-[22%] size-5" />
          <Sparkle className="right-[8%] bottom-8 size-8" />
          <div className="absolute -right-10 -bottom-16 size-48 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--p-accent)_45%,transparent),transparent_70%)]" />
        </div>
      );
    case "analog":
      return (
        <div
          className="relative h-full w-full bg-[#17130F]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #F3EEE4 0 10px, transparent 10px 24px), repeating-linear-gradient(90deg, #F3EEE4 0 10px, transparent 10px 24px), radial-gradient(circle at 85% 20%, rgba(255,140,40,0.55), transparent 45%)",
            backgroundSize: "100% 8px, 100% 8px, 100% 100%",
            backgroundPosition: "0 10px, 0 calc(100% - 10px), 0 0",
            backgroundRepeat: "repeat-x, repeat-x, no-repeat",
          }}
        />
      );
    case "magazine":
      return (
        <div className="relative h-full w-full bg-[color:var(--p-primary)]">
          <span className="absolute right-4 -bottom-6 text-[9rem] leading-none font-black text-[color:var(--p-on-primary)] opacity-10 [font-family:var(--font-editorial)]">
            Nº
          </span>
          <div className="absolute inset-x-5 top-5 h-px bg-[color:var(--p-on-primary)] opacity-30" />
        </div>
      );
    case "minimal":
      return <div className="h-full w-full bg-[color:var(--p-surface)]" />;
    case "glitch":
      return (
        <div className="relative h-full w-full bg-[color:var(--p-bg)]">
          <TextureLayer texture="grade" className="opacity-40" />
          <div className="absolute top-[22%] left-0 h-3 w-1/2 bg-[color:var(--p-decor)] opacity-70 mix-blend-screen" />
          <div className="absolute top-[30%] left-[18%] h-2 w-1/3 bg-[color:var(--p-accent)] opacity-70 mix-blend-screen" />
          <div className="absolute top-[58%] right-0 h-4 w-2/5 bg-[color:var(--p-primary)] opacity-50 mix-blend-screen" />
          <div className="absolute top-[64%] right-[12%] h-1.5 w-1/4 bg-[color:var(--p-accent)] opacity-80" />
          <div className="absolute bottom-[18%] left-[8%] h-2 w-1/5 bg-[color:var(--p-decor)] opacity-60" />
        </div>
      );
  }
}
