"use client";

import clsx from "clsx";
import { Heart, Lock, Plus } from "lucide-react";
import { useMemo, type CSSProperties, type ReactNode } from "react";
import { StackIcon } from "@/components/ui/Glyphs";
import type { ResolvedAppearance } from "@/lib/appearance";
import { groupByMonth, momentDate, postLikeCount, usePostsSnapshot, type Post } from "@/lib/posts";
import { displaySize, themed } from "./appearance/theme";

type MomentsCollectionProps = {
  moments: Post[];
  total: number;
  now: number;
  isOwn: boolean;
  look: ResolvedAppearance;
  // Perfil privado e você não foi aprovado: não mostra nada dos momentos
  locked: { username: string; requested: boolean; onRequest: () => void } | null;
  onOpen: (postId: string) => void;
  onCreate: () => void;
};

type ItemProps = { post: Post; index: number; now: number; likes: number; look: ResolvedAppearance; onOpen: () => void };

// Proporção da capa no mosaico: segue a foto, sem exagero (de 3:4 em pé a 4:3 deitada)
const coverRatio = (post: Post) => {
  const { width, height } = post.photos[0];
  return Math.min(4 / 3, Math.max(3 / 4, width / height));
};

const two = (value: number) => String(value).padStart(2, "0");
// Data no jeito de câmera antiga ('26 11 06)
const filmStamp = (iso: string) => {
  const date = new Date(iso);
  return `'${two(date.getFullYear() % 100)} ${two(date.getMonth() + 1)} ${two(date.getDate())}`;
};

const label = (post: Post, date: string) =>
  `Abrir o momento de ${date}${post.caption ? `: ${post.caption}` : ""}${post.photos.length > 1 ? `, ${post.photos.length} fotos` : ""}`;

function Cover({ post, className, style }: { post: Post; className?: string; style?: CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={post.photos[0].url}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      className={clsx("h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.04]", className)}
      style={style}
    />
  );
}

// Selo discreto de álbum com várias fotos
function CountBadge({ post, className }: { post: Post; className?: string }) {
  if (post.photos.length < 2) return null;
  return (
    <span className={clsx("absolute flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm", className ?? "top-2.5 right-2.5")}>
      <StackIcon />
      {post.photos.length}
    </span>
  );
}

function Caption({ post, date, likes, center }: { post: Post; date: string; likes: number; center?: boolean }) {
  return (
    <span className={clsx("block px-1 pt-2", center && "text-center")}>
      {post.caption && (
        <span className="line-clamp-2 leading-snug font-medium text-[color:var(--p-text)] [font-family:var(--p-display)]" style={displaySize(0.9)}>
          {post.caption}
        </span>
      )}
      <span className={clsx("mt-0.5 flex items-center gap-1.5 text-xs text-[color:var(--p-muted)]", center && "justify-center")}>
        {date}
        {likes > 0 && (
          <>
            <span aria-hidden>·</span>
            <Heart aria-hidden className="size-3" />
            {likes}
          </>
        )}
      </span>
    </span>
  );
}

// Cartões: mosaico; álbum vira uma pilha (as fotos de trás aparecem por cima da capa)
function CardItem({ post, now, likes, onOpen }: ItemProps) {
  const date = momentDate(post.createdAt, now);
  const multi = post.photos.length > 1;
  return (
    <button type="button" onClick={onOpen} aria-label={label(post, date)} className="group block w-full text-left">
      <span className={multi ? "relative block pt-2.5" : "relative block"}>
        {multi && (
          <>
            <span aria-hidden className="absolute inset-x-6 top-0 h-10 rounded-t-[var(--p-radius)] bg-[color:var(--p-border)]" />
            <span aria-hidden className="absolute inset-x-3 top-1.5 h-10 rounded-t-[var(--p-radius)] bg-[color:var(--p-surface)] ring-1 ring-[color:var(--p-border)]" />
          </>
        )}
        <span className="relative block overflow-hidden rounded-[var(--p-radius)] bg-[color:var(--p-surface)]" style={{ aspectRatio: coverRatio(post) }}>
          <Cover post={post} />
          <CountBadge post={post} />
        </span>
      </span>
      <Caption post={post} date={date} likes={likes} />
    </button>
  );
}

const TILT = [-2.2, 1.6, -1.1, 2.4, -1.8, 1.1];

// Polaroid: papel branco com legenda embaixo; álbum tem outra polaroid atrás
function PolaroidItem({ post, index, now, likes, onOpen }: ItemProps) {
  const date = momentDate(post.createdAt, now);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label(post, date)}
      className="group relative block w-full text-left transition-transform motion-safe:hover:-translate-y-1"
      style={{ transform: `rotate(${TILT[index % TILT.length]}deg)` }}
    >
      {post.photos.length > 1 && <span aria-hidden className="absolute inset-0 translate-x-1.5 -translate-y-1.5 rotate-[4deg] bg-white shadow-md" />}
      <span className="relative block bg-white p-2.5 pb-3 shadow-[0_6px_16px_rgba(0,0,0,0.14)]">
        <span className="relative block aspect-square overflow-hidden bg-neutral-200">
          <Cover post={post} />
          <CountBadge post={post} />
        </span>
        <span className="mt-2 block truncate text-center text-[#2A2622] [font-family:var(--p-display)]" style={displaySize(0.95)}>
          {post.caption ?? date}
        </span>
        <span className="block text-center text-[11px] text-[#7A736A]">
          {post.caption ? date : ""}
          {likes > 0 && ` ♥ ${likes}`}
        </span>
      </span>
    </button>
  );
}

// Moldura: cada foto num quadro
function FrameItem({ post, now, likes, onOpen }: ItemProps) {
  const date = momentDate(post.createdAt, now);
  return (
    <button type="button" onClick={onOpen} aria-label={label(post, date)} className="group block w-full text-left">
      <span className="relative block rounded-[var(--p-radius)] bg-[color:var(--p-decor)] p-2 shadow-md">
        <span className="relative block aspect-[4/5] overflow-hidden rounded-[calc(var(--p-radius)*0.7)] bg-[color:var(--p-surface)]">
          <Cover post={post} />
          <CountBadge post={post} />
        </span>
      </span>
      <Caption post={post} date={date} likes={likes} />
    </button>
  );
}

const EDITORIAL = [
  "col-span-6 aspect-[16/10]",
  "col-span-3 aspect-[4/5]",
  "col-span-3 aspect-[4/5]",
  "col-span-4 aspect-[4/3]",
  "col-span-2 aspect-[3/4]",
];

// Editorial: a primeira foto em destaque, as outras em composição assimétrica, com números
function EditorialItem({ post, index, now, likes, onOpen }: ItemProps) {
  const date = momentDate(post.createdAt, now);
  const span = index === 0 ? EDITORIAL[0] : EDITORIAL[1 + ((index - 1) % 4)];
  const [colSpan, aspect] = span.split(" ");
  return (
    <li className={colSpan}>
      <button type="button" onClick={onOpen} aria-label={label(post, date)} className="group block w-full text-left">
        <span className={clsx("relative block overflow-hidden rounded-[var(--p-radius)] bg-[color:var(--p-surface)]", aspect)}>
          <Cover post={post} />
          <CountBadge post={post} />
        </span>
        <span className="mt-2 flex gap-2">
          <span className="text-xs font-bold text-[color:var(--p-accent-text)]">{two(index + 1)}</span>
          <span className="min-w-0">
            <span className={clsx("block leading-tight [font-family:var(--p-display)]", index === 0 ? "text-2xl" : "truncate text-base")}>
              {post.caption ?? "Sem título"}
            </span>
            <span className="text-[10px] font-semibold tracking-[0.18em] text-[color:var(--p-muted)] uppercase">
              {date}
              {likes > 0 && ` · ♥ ${likes}`}
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}

// Minimal: grade limpa, só as fotos
function MinimalItem({ post, now, onOpen }: ItemProps) {
  const date = momentDate(post.createdAt, now);
  return (
    <button type="button" onClick={onOpen} aria-label={label(post, date)} className="group relative block aspect-square w-full overflow-hidden rounded-[calc(var(--p-radius)*0.5)] bg-[color:var(--p-surface)]">
      <Cover post={post} />
      {post.photos.length > 1 && (
        <span aria-hidden className="absolute top-1.5 right-1.5 text-white drop-shadow">
          <StackIcon />
        </span>
      )}
    </button>
  );
}

const COLLAGE_TILT = [-3, 2.5, -1.5, 3.5, -2.5, 1.5];

// Colagem: fotos impressas, coladas com fita, meio tortas e encostando umas nas outras
function CollageItem({ post, index, now, likes, onOpen }: ItemProps) {
  const date = momentDate(post.createdAt, now);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label(post, date)}
      className="group relative block w-full text-left transition-transform motion-safe:hover:scale-[1.02]"
      style={{ transform: `rotate(${COLLAGE_TILT[index % COLLAGE_TILT.length]}deg)` }}
    >
      <span
        aria-hidden
        className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 rotate-[-4deg] bg-[color:var(--p-decor)] opacity-85"
        style={{ clipPath: "polygon(3% 0, 97% 6%, 100% 50%, 96% 100%, 4% 94%, 0 50%)" }}
      />
      {post.photos.length > 1 && (
        <span aria-hidden className="absolute inset-0 -translate-x-2 translate-y-1 rotate-[-5deg] bg-white shadow-md" />
      )}
      <span className="relative block bg-white p-1.5 shadow-[0_6px_14px_rgba(0,0,0,0.16)]">
        <span className="relative block overflow-hidden" style={{ aspectRatio: coverRatio(post) }}>
          <Cover post={post} />
          <CountBadge post={post} />
        </span>
      </span>
      {(post.caption || likes > 0) && (
        <span className="mt-2 block text-center leading-tight text-[color:var(--p-text)] [font-family:var(--p-display)]" style={displaySize(0.95)}>
          {post.caption ?? date}
          {likes > 0 && <span className="text-[color:var(--p-accent-text)]"> ♥{likes}</span>}
        </span>
      )}
    </button>
  );
}

// Filme: quadro de negativo com furinhos, tom antigo e a data laranja de câmera
function FilmItem({ post, now, likes, onOpen }: ItemProps) {
  const date = momentDate(post.createdAt, now);
  return (
    <button type="button" onClick={onOpen} aria-label={label(post, date)} className="group block w-full text-left">
      <span
        className="relative block bg-[#15110D] px-2 py-4 shadow-md"
        style={{
          backgroundImage: "repeating-linear-gradient(90deg, #F3EEE4 0 6px, transparent 6px 14px), repeating-linear-gradient(90deg, #F3EEE4 0 6px, transparent 6px 14px)",
          backgroundSize: "100% 5px, 100% 5px",
          backgroundPosition: "0 5px, 0 calc(100% - 5px)",
          backgroundRepeat: "repeat-x",
        }}
      >
        <span className="relative block aspect-[3/2] overflow-hidden">
          <Cover post={post} className="sepia-[.3] saturate-[.85] contrast-[1.05]" />
          <span className="absolute right-2 bottom-1 text-lg text-[#FF8A1F] [font-family:var(--font-retro)] [text-shadow:0_0_6px_rgba(255,138,31,0.6)]">
            {filmStamp(post.createdAt)}
          </span>
          <CountBadge post={post} className="top-2 left-2" />
        </span>
      </span>
      <Caption post={post} date={date} likes={likes} />
    </button>
  );
}

// Momentos como uma coleção de memórias: agrupados por mês, no jeito escolhido no estilo
// (ou na personalização). Um álbum com várias fotos é sempre UM momento.
export function MomentsCollection({ moments, total, now, isOwn, look, locked, onOpen, onCreate }: MomentsCollectionProps) {
  const snapshot = usePostsSnapshot();
  const groups = useMemo(() => groupByMonth(moments, now), [moments, now]);
  const likes = useMemo(() => {
    void snapshot;
    return new Map(moments.map((post) => [post.id, postLikeCount(post.id)]));
  }, [snapshot, moments]);
  const { layout } = look;

  return (
    <section id="momentos" aria-labelledby="titulo-momentos" className="@container scroll-mt-6">
      <div className="flex items-end justify-between gap-3">
        <h2 id="titulo-momentos" className={clsx("font-bold tracking-tight", themed.title)} style={displaySize(1.3)}>
          Momentos <span className="text-[color:var(--p-muted)] [font-family:var(--font-sora)] text-base font-normal">{total}</span>
        </h2>
        {isOwn && moments.length > 0 && (
          <button type="button" onClick={onCreate} className={clsx(themed.primaryButton, "h-9 px-3")}>
            <Plus aria-hidden className="size-4" strokeWidth={2.5} />
            Novo momento
          </button>
        )}
      </div>

      {locked ? (
        <div className="mt-4 flex flex-col items-center rounded-[var(--p-radius)] border border-dashed border-[color:var(--p-border)] bg-[color:var(--p-surface)] px-6 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-[color:var(--p-bg)] text-[color:var(--p-muted)] shadow-sm">
            <Lock aria-hidden className="size-6" />
          </span>
          <p className="mt-4 font-semibold">Esse perfil é privado</p>
          <p className="mt-1 max-w-xs text-sm text-[color:var(--p-muted)]">
            Os momentos e os stories de @{locked.username} são só para quem foi aprovado. Peça para seguir e espere o ok.
          </p>
          {locked.requested ? (
            <p className="mt-4 rounded-full border border-[color:var(--p-border)] px-4 py-2 text-sm font-semibold text-[color:var(--p-muted)]">
              Pedido enviado — falta aprovar
            </p>
          ) : (
            <button type="button" onClick={locked.onRequest} className={clsx(themed.primaryButton, "mt-4 h-9")}>
              Pedir para seguir
            </button>
          )}
        </div>
      ) : moments.length === 0 ? (
        <div className="mt-4 rounded-[var(--p-radius)] bg-[color:var(--p-surface)] px-6 py-10 text-center">
          {isOwn ? (
            <>
              <p className="font-semibold">Seus momentos aparecem aqui</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-[color:var(--p-muted)]">
                Junte as fotos de um dia, de uma viagem ou de um rolê num álbum só. Cada álbum conta como um momento.
              </p>
              <button type="button" onClick={onCreate} className={clsx(themed.primaryButton, "mt-4 h-9")}>
                <Plus aria-hidden className="size-4" strokeWidth={2.5} />
                Criar o primeiro momento
              </button>
            </>
          ) : (
            <p className="text-sm text-[color:var(--p-muted)]">Nenhum momento por aqui ainda.</p>
          )}
        </div>
      ) : (
        groups.map((group) => {
          const item = (post: Post, index: number): ItemProps => ({
            post,
            index,
            now,
            likes: likes.get(post.id) ?? 0,
            look,
            onOpen: () => onOpen(post.id),
          });
          return (
            <div key={group.key} className="mt-6">
              <MonthLabel layout={layout} label={group.label} count={group.items.length} />
              <Grid layout={layout}>
                {group.items.map((post, index) =>
                  layout === "editorial" ? (
                    <EditorialItem key={post.id} {...item(post, index)} />
                  ) : (
                    <li key={post.id} className={clsx(layout === "cartoes" || layout === "colagem" ? "mb-5 break-inside-avoid" : undefined, layout === "colagem" && "pt-3")}>
                      {layout === "polaroid" ? (
                        <PolaroidItem {...item(post, index)} />
                      ) : layout === "moldura" ? (
                        <FrameItem {...item(post, index)} />
                      ) : layout === "minimal" ? (
                        <MinimalItem {...item(post, index)} />
                      ) : layout === "colagem" ? (
                        <CollageItem {...item(post, index)} />
                      ) : layout === "filme" ? (
                        <FilmItem {...item(post, index)} />
                      ) : (
                        <CardItem {...item(post, index)} />
                      )}
                    </li>
                  ),
                )}
              </Grid>
            </div>
          );
        })
      )}
    </section>
  );
}

function Grid({ layout, children }: { layout: ResolvedAppearance["layout"]; children: ReactNode }) {
  const classes: Record<ResolvedAppearance["layout"], string> = {
    cartoes: "columns-2 gap-3 @xl:columns-3 @4xl:columns-4",
    polaroid: "grid grid-cols-2 gap-x-4 gap-y-6 @xl:grid-cols-3 @4xl:grid-cols-4",
    moldura: "grid grid-cols-2 gap-4 @xl:grid-cols-3 @4xl:grid-cols-4",
    editorial: "grid grid-cols-6 gap-x-3 gap-y-5",
    minimal: "grid grid-cols-3 gap-1.5 @xl:gap-2.5",
    colagem: "columns-2 gap-5 @xl:columns-3",
    filme: "grid grid-cols-2 gap-3 @2xl:grid-cols-3",
  };
  return <ul className={classes[layout]}>{children}</ul>;
}

function MonthLabel({ layout, label, count }: { layout: ResolvedAppearance["layout"]; label: string; count: number }) {
  if (layout === "editorial") {
    return (
      <h3 className="mb-4 flex items-baseline gap-3 border-b border-[color:var(--p-text)] pb-1 text-2xl [font-family:var(--p-display)]">
        {label}
        <span className="text-[10px] font-semibold tracking-[0.2em] text-[color:var(--p-muted)] uppercase [font-family:var(--font-sora)]">
          {count} {count === 1 ? "momento" : "momentos"}
        </span>
      </h3>
    );
  }
  if (layout === "colagem" || layout === "polaroid") {
    return (
      <h3 className="mb-4 inline-block -rotate-2 bg-[color-mix(in_srgb,var(--p-decor)_70%,transparent)] px-3 py-0.5 text-[color:var(--p-text)] [font-family:var(--p-display)]" style={displaySize(1)}>
        {label}
      </h3>
    );
  }
  if (layout === "filme") {
    return <h3 className="mb-3 text-lg tracking-wider text-[color:var(--p-accent-text)] uppercase [font-family:var(--font-retro)]">▸ {label}</h3>;
  }
  return <h3 className="mb-3 text-xs font-semibold tracking-wider text-[color:var(--p-muted)] uppercase">{label}</h3>;
}
