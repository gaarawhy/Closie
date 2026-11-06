"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { initials } from "@/components/ui/Avatar";
import type { AvatarFrame } from "@/lib/appearance";

type FramedAvatarProps = {
  frame: AvatarFrame;
  name: string;
  src: string | null;
  size: number;
  // Tem story no ar: o anel fica na cor de destaque (ou aparece o pontinho) e a foto abre os stories
  stories: boolean;
  onOpenStories?: () => void;
  storiesLabel: string;
};

// Foto (ou iniciais) preenchendo o espaço; o formato vem da moldura
function Face({ name, src, className }: { name: string; src: string | null; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`Foto de ${name}`} draggable={false} className={clsx("h-full w-full object-cover", className)} />
  ) : (
    <span
      role="img"
      aria-label={name}
      className={clsx(
        "flex h-full w-full items-center justify-center bg-[color-mix(in_srgb,var(--p-accent)_18%,var(--p-bg))] font-semibold text-[color:var(--p-accent-text)]",
        className,
      )}
    >
      <span aria-hidden style={{ fontSize: "38%" }}>
        {initials(name)}
      </span>
    </span>
  );
}

// Pontinho de "tem story" para as molduras sem anel
const StoryDot = () => (
  <span
    aria-hidden
    className="absolute -top-0.5 -right-0.5 z-10 size-5 rounded-full bg-[color:var(--p-accent)] ring-[3px] ring-[color:var(--p-bg)] motion-safe:animate-pulse"
  />
);

const Tape = ({ className }: { className: string }) => (
  <span
    aria-hidden
    className={clsx("absolute z-10 h-5 w-14 bg-[color:var(--p-decor)] opacity-85 shadow-sm", className)}
    style={{ clipPath: "polygon(3% 0, 97% 6%, 100% 50%, 96% 100%, 4% 94%, 0 50%)" }}
  />
);

// Foto de perfil com a moldura escolhida: anel, polaroid, fita, cromado, visor de câmera ou pixel.
export function FramedAvatar({ frame, name, src, size, stories, onOpenStories, storiesLabel }: FramedAvatarProps) {
  const face = (shape: string, inner: number) => (
    <span className={clsx("block overflow-hidden", shape)} style={{ width: inner, height: inner, fontSize: inner }}>
      <Face name={name} src={src} />
    </span>
  );

  let art: ReactNode;
  switch (frame) {
    case "anel":
      art = (
        <span className={clsx("flex rounded-full p-[3px]", stories ? "bg-[color:var(--p-accent)]" : "bg-[color:var(--p-border)]")}>
          <span className="flex rounded-full bg-[color:var(--p-bg)] p-[3px]">{face("rounded-full", size - 12)}</span>
        </span>
      );
      break;
    case "polaroid":
      art = (
        <span className="relative block rotate-[-3deg] bg-white p-2 pb-6 shadow-lg">
          <Tape className="-top-2.5 left-1/2 -translate-x-1/2 rotate-[-4deg]" />
          {face("rounded-[2px]", size - 16)}
          {stories && <StoryDot />}
        </span>
      );
      break;
    case "fita":
      art = (
        <span className="relative block rounded-full border-4 border-[color:var(--p-bg)] bg-[color:var(--p-bg)] shadow-md">
          <Tape className="-top-1 -left-3 rotate-[-35deg]" />
          <Tape className="-top-1 -right-3 rotate-[35deg]" />
          {face("rounded-full", size - 8)}
          {stories && <StoryDot />}
        </span>
      );
      break;
    case "cromado":
      art = (
        <span
          className={clsx("relative flex rounded-full p-[5px] shadow-lg", stories && "shadow-[0_0_0_3px_var(--p-accent)]")}
          style={{ background: "conic-gradient(from 210deg, #F8FAFC, #9AA5B4, #FFFFFF, #7D8794, #E2E8F0, #9AA5B4, #F8FAFC)" }}
        >
          <span className="flex rounded-full bg-[color:var(--p-bg)] p-[2px]">{face("rounded-full", size - 14)}</span>
          <svg aria-hidden viewBox="0 0 24 24" className="absolute -top-1 -right-2 size-6 fill-white drop-shadow">
            <path d="M12 0Q12 12 24 12Q12 12 12 24Q12 12 0 12Q12 12 12 0Z" />
          </svg>
        </span>
      );
      break;
    case "filme":
      art = (
        <span className="relative block p-2">
          {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "right-0 bottom-0 border-r-2 border-b-2"].map(
            (corner) => (
              <span key={corner} aria-hidden className={clsx("absolute size-5 border-[color:var(--p-text)]", corner)} />
            ),
          )}
          {face("rounded-[18%] border-2 border-[color:var(--p-bg)]", size - 16)}
          {stories && <StoryDot />}
        </span>
      );
      break;
    case "pixel":
      art = (
        <span className="relative block shadow-[0_0_0_3px_var(--p-decor),6px_6px_0_3px_var(--p-accent)]">
          {face("rounded-none", size - 6)}
          {stories && <StoryDot />}
        </span>
      );
      break;
    default:
      art = (
        <span className="relative block rounded-full border-4 border-[color:var(--p-bg)] bg-[color:var(--p-bg)]">
          {face("rounded-full", size - 8)}
          {stories && <StoryDot />}
        </span>
      );
  }

  return stories && onOpenStories ? (
    <button type="button" onClick={onOpenStories} aria-label={storiesLabel} className="inline-block rounded-full transition-transform motion-safe:hover:scale-[1.03]">
      {art}
    </button>
  ) : (
    <span className="inline-block">{art}</span>
  );
}
