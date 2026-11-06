"use client";

import clsx from "clsx";
import { ChevronDown, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  AVATAR_FRAMES,
  COLOR_SWATCHES,
  CORNERS,
  FONTS,
  GRADIENTS,
  MOMENT_LAYOUTS,
  PALETTES,
  PROFILE_STYLES,
  STICKERS_MAX,
  STICKER_CATEGORIES,
  STYLE_PRESETS,
  TEXTURES,
  addSticker,
  chooseStyle,
  defaultAppearance,
  resolveAppearance,
  themeColors,
  type CoverSetting,
  type Palette,
  type ProfileAppearance,
  type ProfileStyle,
  type ResolvedAppearance,
} from "@/lib/appearance";
import { prepareCoverPhoto } from "@/lib/postMedia";
import type { Person } from "@/lib/social";
import { FramedAvatar } from "../appearance/FramedAvatar";
import { FONT_FAMILY, profileFontVariables } from "../appearance/fonts";
import { STICKER_LABEL, StickerArt } from "../appearance/StickerArt";
import type { Today } from "../appearance/StickersLayer";
import { TextureLayer } from "../appearance/Texture";
import { displaySize, themeStyle } from "../appearance/theme";

export type PanelProps = {
  draft: ProfileAppearance;
  resolved: ResolvedAppearance;
  update: (change: (look: ProfileAppearance) => ProfileAppearance) => void;
};

// Pedacinho com as cores e fontes do perfil, para as opções aparecerem como vão ficar
function Themed({ look, className, style, children }: { look: ResolvedAppearance; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <span className={clsx(profileFontVariables, "relative block overflow-hidden", className)} style={{ ...themeStyle(look), ...style }}>
      {children}
    </span>
  );
}

function OptionButton({ selected, onClick, label, children, className }: { selected: boolean; onClick: () => void; label?: string; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      className={clsx(
        "rounded-2xl border p-1.5 text-left transition-[border-color,box-shadow,transform] active:scale-[0.98]",
        selected ? "border-closie-text ring-2 ring-closie-text" : "border-closie-border hover:border-closie-border-strong",
        className,
      )}
    >
      {children}
    </button>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mt-6 mb-2 first:mt-1">
      <h3 className="text-sm font-bold">{title}</h3>
      {hint && <p className="text-xs text-closie-muted">{hint}</p>}
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: readonly { id: T; label: string }[]; onChange: (value: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="scrollbar-none flex gap-1 overflow-x-auto rounded-full bg-closie-panel p-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          onClick={() => onChange(option.id)}
          className={clsx(
            "h-9 shrink-0 grow rounded-full px-3 text-sm font-semibold whitespace-nowrap transition-colors",
            value === option.id ? "bg-closie-bg text-closie-text shadow-sm" : "text-closie-muted hover:text-closie-text",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// "Mais opções" e afins: fechado por padrão, para a tela começar simples
function Expander({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group mt-5 rounded-2xl border border-closie-border">
      <summary className="flex h-12 cursor-pointer list-none items-center justify-between rounded-2xl px-4 text-sm font-bold hover:bg-closie-panel [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

// ---------- Estilo ----------

const THUMB_COVER: Record<ProfileStyle, CSSProperties> = {
  classico: { background: "linear-gradient(135deg, #F8C9C9, #FFFFFF)" },
  scrapbook: { background: "#C8A47E" },
};

// Miniatura do perfil em cada estilo: capa, foto (redonda ou polaroid), nome e momentos
function StyleThumb({ style }: { style: ProfileStyle }) {
  const look = resolveAppearance(chooseStyle(defaultAppearance(), style));
  const scrapbook = style === "scrapbook";
  const tile = clsx(
    "h-9 flex-1 bg-[color:var(--p-accent)]",
    scrapbook ? "rounded-none border-[3px] border-b-[7px] border-white shadow-sm" : "rounded-md opacity-80",
  );
  return (
    <Themed look={look} className="h-32 rounded-xl">
      <span className="absolute inset-0 bg-[color:var(--p-bg)]" />
      <TextureLayer texture={look.texture} />
      <span className="absolute inset-x-0 top-0 h-11" style={THUMB_COVER[style]} />
      <span
        className={clsx(
          "absolute top-6 left-2.5 size-9 border-2 bg-[color:var(--p-decor)]",
          scrapbook ? "rounded-none border-white border-b-[5px] shadow-sm" : "rounded-full border-[color:var(--p-bg)]",
        )}
      />
      <span
        className={clsx("absolute top-[3.9rem] left-2.5 font-bold text-[color:var(--p-title)] [font-family:var(--p-display)]", scrapbook && "-rotate-2")}
        style={displaySize(0.8)}
      >
        {STYLE_PRESETS[style].name}
      </span>
      <span className="absolute right-2.5 bottom-2 left-2.5 flex gap-1.5">
        {[0, 1, 2].map((index) => (
          <span key={index} className={tile} style={{ transform: scrapbook ? `rotate(${[-4, 3, -2][index]}deg)` : undefined }} />
        ))}
      </span>
    </Themed>
  );
}

function LayoutThumb({ layout }: { layout: ResolvedAppearance["layout"] }) {
  const photo = "bg-[color:var(--p-accent)] opacity-75";
  switch (layout) {
    case "cartoes":
      return (
        <span className="flex h-full gap-1">
          <span className="flex flex-1 flex-col gap-1">
            <span className={clsx(photo, "h-[60%] rounded-md")} />
            <span className={clsx(photo, "flex-1 rounded-md")} />
          </span>
          <span className="flex flex-1 flex-col gap-1">
            <span className={clsx(photo, "h-[38%] rounded-md")} />
            <span className={clsx(photo, "flex-1 rounded-md")} />
          </span>
        </span>
      );
    case "polaroid":
      return (
        <span className="flex h-full items-center justify-center gap-2">
          {[-5, 4].map((tilt) => (
            <span key={tilt} className="block h-[80%] w-[40%] bg-white p-1 pb-3 shadow" style={{ transform: `rotate(${tilt}deg)` }}>
              <span className={clsx(photo, "block h-full")} />
            </span>
          ))}
        </span>
      );
    case "moldura":
      return (
        <span className="grid h-full grid-cols-2 gap-1.5">
          {[0, 1].map((index) => (
            <span key={index} className="block bg-[color:var(--p-decor)] p-1">
              <span className={clsx(photo, "block h-full")} />
            </span>
          ))}
        </span>
      );
    case "editorial":
      return (
        <span className="grid h-full grid-cols-3 grid-rows-2 gap-1">
          <span className={clsx(photo, "col-span-3")} />
          <span className={clsx(photo, "col-span-2")} />
          <span className={photo} />
        </span>
      );
    case "minimal":
      return (
        <span className="grid h-full grid-cols-3 grid-rows-2 gap-0.5">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className={photo} />
          ))}
        </span>
      );
    case "colagem":
      return (
        <span className="relative block h-full">
          <span className="absolute top-2 left-1 h-[70%] w-[48%] -rotate-6 bg-white p-0.5 shadow">
            <span className={clsx(photo, "block h-full")} />
          </span>
          <span className="absolute top-1 right-1 h-[70%] w-[48%] rotate-6 bg-white p-0.5 shadow">
            <span className={clsx(photo, "block h-full")} />
          </span>
          <span className="absolute top-0 left-[38%] h-2 w-6 -rotate-3 bg-[color:var(--p-decor)] opacity-80" />
        </span>
      );
    case "filme":
      return (
        <span className="grid h-full grid-cols-2 gap-1">
          {[0, 1].map((index) => (
            <span key={index} className="block bg-[#15110D] px-0.5 py-2">
              <span className={clsx(photo, "block h-full")} />
            </span>
          ))}
        </span>
      );
  }
}

// Estilo: os 2 estilos em destaque. O resto (fonte, momentos, moldura, fundo, cantos) fica
// guardado em "Mais opções", para a tela começar simples.
export function StylePanel({ draft, resolved, update, person }: PanelProps & { person: Person }) {
  const name = person.displayName ?? person.username;
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {PROFILE_STYLES.map((style) => (
          <OptionButton key={style} selected={draft.style === style} onClick={() => update((look) => chooseStyle(look, style))}>
            <StyleThumb style={style} />
            <span className="mt-2 block px-1 text-sm font-semibold">{STYLE_PRESETS[style].name}</span>
            <span className="block px-1 pb-1 text-xs leading-snug text-closie-muted">{STYLE_PRESETS[style].description}</span>
          </OptionButton>
        ))}
      </div>
      <p className="mt-3 text-xs text-closie-muted">Trocar de estilo volta capa, cores, fonte e momentos para os do estilo. A foto da capa e os adesivos ficam.</p>

      <Expander title="Mais opções">
        <SectionTitle title="Fonte do nome" hint="Vale para o seu nome, os títulos e as legendas." />
        <div className={clsx(profileFontVariables, "grid grid-cols-2 gap-2")}>
          {FONTS.map((font) => (
            <OptionButton key={font.id} selected={resolved.font === font.id} onClick={() => update((look) => ({ ...look, font: font.id }))} className="px-3 py-2">
              <span className="block truncate text-lg leading-tight" style={{ fontFamily: FONT_FAMILY[font.id] }}>
                {name}
              </span>
              <span className="block text-xs font-semibold text-closie-muted">{font.label}</span>
            </OptionButton>
          ))}
        </div>

        <SectionTitle title="Jeito dos momentos" />
        <div className="grid grid-cols-3 gap-2">
          {MOMENT_LAYOUTS.map((layout) => (
            <OptionButton key={layout.id} selected={resolved.layout === layout.id} onClick={() => update((look) => ({ ...look, layout: layout.id }))} label={layout.text}>
              <Themed look={resolved} className="h-14 rounded-xl bg-[color:var(--p-bg)] p-1.5 ring-1 ring-black/5">
                <LayoutThumb layout={layout.id} />
              </Themed>
              <span className="mt-1 block px-0.5 text-xs font-semibold">{layout.label}</span>
            </OptionButton>
          ))}
        </div>

        <SectionTitle title="Moldura da foto" />
        <div className="grid grid-cols-4 gap-2">
          {AVATAR_FRAMES.map((frame) => (
            <OptionButton key={frame.id} selected={resolved.frame === frame.id} onClick={() => update((look) => ({ ...look, frame: frame.id }))} label={frame.label}>
              <Themed look={resolved} className="flex h-16 items-center justify-center rounded-xl bg-[color:var(--p-bg)]">
                <FramedAvatar frame={frame.id} name={name} src={person.avatar} size={38} stories={false} storiesLabel="" />
              </Themed>
            </OptionButton>
          ))}
        </div>

        <SectionTitle title="Fundo" hint="Uma textura leve atrás de tudo." />
        <div className="grid grid-cols-4 gap-2">
          {TEXTURES.map((texture) => (
            <OptionButton key={texture.id} selected={resolved.texture === texture.id} onClick={() => update((look) => ({ ...look, texture: texture.id }))} label={texture.label}>
              <Themed look={resolved} className="h-12 rounded-xl bg-[color:var(--p-bg)] ring-1 ring-black/5">
                <TextureLayer texture={texture.id} />
              </Themed>
            </OptionButton>
          ))}
        </div>

        <SectionTitle title="Cantos" hint="Dos cartões, molduras e botões." />
        <Segmented label="Cantos" value={resolved.corners} options={CORNERS} onChange={(corners) => update((look) => ({ ...look, corners }))} />
      </Expander>
    </div>
  );
}

// ---------- Capa ----------

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const id = useId();
  return (
    <div className="mt-2 flex items-center gap-3">
      <label htmlFor={id} className="w-20 shrink-0 text-sm text-closie-muted">
        {label}
      </label>
      <input id={id} type="range" min={0} max={100} value={Math.round(value)} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-closie-red" />
    </div>
  );
}

// Capa numa grade só: um toque escolhe (sem escolher "tipo" antes)
export function CoverPanel({ draft, resolved, update }: PanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cover = draft.cover;
  const set = (next: CoverSetting) => update((look) => ({ ...look, cover: next }));

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) {
      setError("Escolha uma foto de até 15 MB.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const photo = await prepareCoverPhoto(file);
      set({ kind: "imagem", url: photo.url, x: 50, y: 50 });
    } catch {
      setError("Não deu pra abrir essa foto. Tente outra.");
    } finally {
      setBusy(false);
    }
  }

  const tile = "relative block h-16 w-full overflow-hidden rounded-xl";

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <OptionButton selected={cover.kind === "padrao"} onClick={() => set({ kind: "padrao" })}>
          <span className={tile} style={THUMB_COVER[resolved.style]} />
          <span className="mt-1 block px-1 text-xs font-semibold">Do estilo</span>
        </OptionButton>
        <OptionButton selected={cover.kind === "imagem"} onClick={() => inputRef.current?.click()}>
          {cover.kind === "imagem" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.url} alt="" className={clsx(tile, "object-cover")} style={{ objectPosition: `${cover.x}% ${cover.y}%` }} />
          ) : (
            <span className={clsx(tile, "flex items-center justify-center bg-closie-panel text-closie-muted")}>
              {busy ? <Loader2 aria-hidden className="size-6 motion-safe:animate-spin" /> : <ImagePlus aria-hidden className="size-6" />}
            </span>
          )}
          <span className="mt-1 block px-1 text-xs font-semibold">{busy ? "Preparando…" : cover.kind === "imagem" ? "Trocar foto" : "Sua foto"}</span>
        </OptionButton>
      </div>

      {cover.kind === "imagem" && (
        <div className="mt-3 rounded-2xl bg-closie-panel p-3">
          <p className="text-xs font-semibold text-closie-muted">Posição da foto</p>
          <Slider label="Horizontal" value={cover.x} onChange={(x) => update((look) => (look.cover.kind === "imagem" ? { ...look, cover: { ...look.cover, x } } : look))} />
          <Slider label="Vertical" value={cover.y} onChange={(y) => update((look) => (look.cover.kind === "imagem" ? { ...look, cover: { ...look.cover, y } } : look))} />
          <button
            type="button"
            onClick={() => set({ kind: "padrao" })}
            className="mt-2 inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold text-closie-red-hover hover:bg-closie-red-soft"
          >
            <Trash2 aria-hidden className="size-4" />
            Tirar a foto
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-closie-red-hover">
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void pick(file);
        }}
      />

      <SectionTitle title="Cor lisa" />
      <ColorPicker label="Cor da capa" value={cover.kind === "cor" ? cover.color : ""} onChange={(color) => set({ kind: "cor", color })} />

      <SectionTitle title="Degradê" />
      <div className="grid grid-cols-4 gap-2">
        {GRADIENTS.map((gradient) => (
          <OptionButton
            key={gradient.id}
            selected={cover.kind === "gradiente" && cover.gradient === gradient.id}
            onClick={() => set({ kind: "gradiente", gradient: gradient.id })}
            label={gradient.label}
          >
            <span className="block h-12 rounded-xl" style={{ background: gradient.css }} />
          </OptionButton>
        ))}
      </div>

      <SectionTitle title="Textura" />
      <div className="grid grid-cols-4 gap-2">
        {TEXTURES.filter((texture) => texture.id !== "nenhuma").map((texture) => (
          <OptionButton
            key={texture.id}
            selected={cover.kind === "textura" && cover.texture === texture.id}
            onClick={() => set({ kind: "textura", texture: texture.id as Exclude<typeof texture.id, "nenhuma"> })}
            label={texture.label}
          >
            <Themed look={resolved} className="h-12 rounded-xl bg-[color:var(--p-surface)]">
              <TextureLayer texture={texture.id} />
            </Themed>
          </OptionButton>
        ))}
      </div>
    </div>
  );
}

// ---------- Cores ----------

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) {
  const id = useId();
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      {COLOR_SWATCHES.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={`Cor ${color}`}
          aria-pressed={value.toUpperCase() === color}
          className={clsx(
            "size-9 rounded-full border border-black/10 transition-transform hover:scale-110",
            value.toUpperCase() === color && "ring-2 ring-closie-text ring-offset-2",
          )}
          style={{ background: color }}
        />
      ))}
      <label
        htmlFor={id}
        className="relative flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-closie-border-strong bg-[conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)]"
        title="Escolher outra cor"
      >
        <span className="sr-only">Escolher outra cor</span>
        <input id={id} type="color" value={value || "#D62828"} onChange={(event) => onChange(event.target.value.toUpperCase())} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
    </div>
  );
}

const samePalette = (a: Palette, b: Palette) =>
  a.primary.toUpperCase() === b.primary.toUpperCase() &&
  a.accent.toUpperCase() === b.accent.toUpperCase() &&
  a.background.toUpperCase() === b.background.toUpperCase() &&
  a.decor.toUpperCase() === b.decor.toUpperCase();

// Cores: paletas prontas de 1 toque; ajuste fino da cor principal guardado embaixo
export function ColorsPanel({ draft, resolved, update }: PanelProps) {
  const colors = themeColors(resolved.palette);
  const current = PALETTES.find((item) => samePalette(item.palette, resolved.palette))?.id ?? null;
  const setColor = (key: keyof Palette, color: string) => update((look) => ({ ...look, palette: { ...resolveAppearance(look).palette, [key]: color } }));
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {PALETTES.map((item) => (
          <OptionButton
            key={item.id}
            selected={current === item.id}
            onClick={() => update((look) => ({ ...look, palette: { ...item.palette } }))}
            className="flex items-center gap-2.5 px-2 py-2"
          >
            <span aria-hidden className="flex shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10">
              {[item.palette.background, item.palette.primary, item.palette.accent, item.palette.decor].map((color, index) => (
                <span key={index} className="h-9 w-3.5" style={{ background: color }} />
              ))}
            </span>
            <span className="text-sm font-semibold">{item.label}</span>
          </OptionButton>
        ))}
      </div>

      <Expander title="Ajustar a cor principal">
        <p className="mt-1 mb-2 text-xs text-closie-muted">Nome, títulos e o botão principal.</p>
        <ColorPicker label="Cor principal" value={resolved.palette.primary} onChange={(color) => setColor("primary", color)} />
        <p className="mt-4 mb-2 text-xs text-closie-muted">Destaque: anel dos stories, rabiscos e detalhes.</p>
        <ColorPicker label="Cor de destaque" value={resolved.palette.accent} onChange={(color) => setColor("accent", color)} />
      </Expander>

      {(colors.title !== resolved.palette.primary || colors.accentText !== resolved.palette.accent) && (
        <p className="mt-4 rounded-2xl bg-closie-panel px-4 py-3 text-sm text-closie-muted">
          Onde a cor ficaria difícil de ler, o texto usa {colors.text === "#FFFFFF" ? "branco" : "preto"} para continuar legível.
        </p>
      )}
      {draft.palette && (
        <button type="button" onClick={() => update((look) => ({ ...look, palette: null }))} className="mt-4 text-sm font-semibold text-closie-link hover:underline">
          Usar as cores do estilo
        </button>
      )}
    </div>
  );
}

// ---------- Adesivos ----------

type StickersProps = PanelProps & {
  today: Today;
  onSelectSticker: (id: string | null) => void;
};

// Adesivos: toque para pôr na capa. Mexer (arrastar, girar, aumentar, tirar) é direto na prévia.
export function StickersPanel({ draft, resolved, update, today, onSelectSticker }: StickersProps) {
  const [category, setCategory] = useState<(typeof STICKER_CATEGORIES)[number]["id"]>(STICKER_CATEGORIES[0].id);
  const full = draft.stickers.length >= STICKERS_MAX;
  const kinds = STICKER_CATEGORIES.find((item) => item.id === category)?.kinds ?? [];

  return (
    <div>
      <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4">
        {STICKER_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            aria-pressed={category === item.id}
            className={clsx(
              "h-9 shrink-0 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap",
              category === item.id ? "border-closie-text bg-closie-text text-closie-bg" : "border-closie-border text-closie-muted hover:text-closie-text",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Themed look={resolved} className="mt-3 rounded-2xl bg-[color:var(--p-bg)] p-2 ring-1 ring-closie-border">
        <span className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {kinds.map((kind) => (
            <button
              key={kind}
              type="button"
              disabled={full}
              onClick={() => {
                // Calculado fora do atualizador: o id novo é o mesmo no estado e na seleção
                const next = addSticker(draft, kind);
                if (next === draft) return;
                update(() => next);
                onSelectSticker(next.stickers[next.stickers.length - 1].id);
              }}
              aria-label={`Pôr ${STICKER_LABEL[kind]} na capa`}
              title={STICKER_LABEL[kind]}
              className="flex h-20 items-center justify-center rounded-xl transition-[background-color,transform] hover:bg-[color:var(--p-surface)] active:scale-95 disabled:opacity-40"
            >
              <span className="pointer-events-none flex max-h-16 max-w-full origin-center scale-[0.8] items-center justify-center">
                <StickerArt kind={kind} today={today} />
              </span>
            </button>
          ))}
        </span>
      </Themed>
      <p className="mt-2 text-xs text-closie-muted">
        {full
          ? `Chegou no limite de ${STICKERS_MAX} adesivos. Tire algum na prévia para pôr outro.`
          : `Toque para pôr na capa (${draft.stickers.length} de ${STICKERS_MAX}). Na prévia, arraste para mover e use os botões em cima dele para girar, aumentar ou tirar.`}
      </p>
      {category === "rabiscos" && (
        <p className="mt-3 text-[11px] leading-relaxed text-closie-muted">
          Rabiscos à mão do{" "}
          <a href="https://fffuel.co/dddoodle/" target="_blank" rel="noreferrer" className="underline underline-offset-2">
            dddoodle
          </a>
          , de fffuel, sob a licença{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/deed.pt-br" target="_blank" rel="noreferrer" className="underline underline-offset-2">
            CC BY 4.0
          </a>{" "}
          (cores adaptadas ao seu perfil).
        </p>
      )}
    </div>
  );
}
