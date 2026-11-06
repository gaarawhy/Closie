"use client";

import clsx from "clsx";
import { Play } from "lucide-react";
import type { Story } from "@/lib/stories";

// Miniatura de um story (bolinhas, cartões, Meus stories, notificações). Vídeo mostra o primeiro
// quadro; `badge` põe o selo de vídeo no canto (desligado onde o lugar já indica isso).
export function StoryCover({ story, className, badge = true }: { story: Story; className?: string; badge?: boolean }) {
  if (story.media.type === "video") {
    return (
      <>
        <video
          src={story.media.url}
          muted
          playsInline
          preload="metadata"
          aria-hidden
          className={clsx("pointer-events-none h-full w-full object-cover", className)}
        />
        {badge && (
          <span aria-hidden className="absolute top-2 left-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white">
            <Play className="size-3.5 fill-current" />
          </span>
        )}
      </>
    );
  }
  return (
    // Mídia dos usuários (data URL ou endereço qualquer): <img> direto, sem otimização do Next
    // eslint-disable-next-line @next/next/no-img-element
    <img src={story.media.url} alt="" loading="lazy" draggable={false} className={clsx("h-full w-full object-cover", className)} />
  );
}
