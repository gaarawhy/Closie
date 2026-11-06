"use client";

import clsx from "clsx";
import { ImagePlus, Loader2, Minus, Plus, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import {
  AVATAR_FRAMES,
  COLOR_SWATCHES,
  CORNERS,
  FONTS,
  GRADIENTS,
  MOMENT_LAYOUTS,
  PROFILE_STYLES,
  STICKERS_MAX,
  STICKER_CATEGORIES,
  STYLE_PRESETS,
  TEXTURES,
  addSticker,
  chooseStyle,
  defaultAppearance,
  removeSticker,
  resolveAppearance,
  themeColors,
  updateSticker,
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
import { displaySize, gradientCss, themeStyle } from "../appearance/theme";

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

// ---------- Estilo ----------

const THUMB_COVER: Record<ProfileStyle, CSSProperties> = {
  classico: { background: "linear-gradient(135deg, #F8C9C9, #FFFFFF)" },
  scrapbook: { background: "#C8A47E" },
  y2k: { background: gradientCss("cromado") },
  analog: {
    backgroundColor: "#17130F",
    backgroundImage: "repeating-linear-gradient(90deg, #F3EEE4 0 5px, transparent 5px 11px)",
    backgroundSize: "100% 4px",
    backgroundPosition: "0 5px",
    backgroundRepeat: "repeat-x",
  },
  magazine: { background: "#111111" },
  minimal: { background: "#F2F2EF" },
  glitch: { background: "linear-gradient(180deg, #0B0B12 0 30%, #2DE2E6 30% 36%, #0B0B12 36% 60%, #FF2BD6 60% 64%, #0B0B12 64%)" },
};

function StyleThumb({ style }: { style: ProfileStyle }) {
  const look = resolveAppearance(chooseStyle(defaultAppearance(), style));
  const tile = clsx(
    "h-9 flex-1",
    look.layout === "polaroid" || look.layout === "colagem" ? "border-[3px] border-b-[7px] border-white bg-[color:var(--p-accent)] shadow-sm" : "",
    look.layout === "filme" && "border-x-[3px] border-y-[5px] border-[#15110D] bg-[color:var(--p-accent)]",
    look.layout === "moldura" && "border-[3px] border-[color:var(--p-decor)] bg-[color:var(--p-accent)]",
    (look.layout === "cartoes" || look.layout === "editorial" || look.layout === "minimal") && "bg-[color:var(--p-accent)] opacity-80",
    look.corners === "redondo" ? "rounded-md" : look.corners === "suave" ? "rounded" : "rounded-none",
  );
  return (
    <Themed look={look} className="h-32 rounded-xl">
      <span className="absolute inset-0 bg-[color:var(--p-bg)]" />
      <TextureLayer texture={look.texture} />
      <span className="absolute inset-x-0 top-0 h-11" style={THUMB_COVER[style]} />
      <span
        className={clsx(
          "absolute top-6 left-2.5 size-9 border-2 border-[color:var(--p-bg)] bg-[color:var(--p-decor)]",
          look.frame === "polaroid" || look.frame === "pixel" ? "rounded-none border-white" : look.frame === "filme" ? "rounded-lg" : "rounded-full",
          look.frame === "cromado" && "border-[#B8C1CC]",
        )}
      />
      <span className={clsx("absolute top-[3.9rem] left-2.5 font-bold text-[color:var(--p-title)] [font-family:var(--p-display)]", style === "magazine" && "uppercase")} style={displaySize(0.8)}>
        {STYLE_PRESETS[style].name}
      </span>
      <span className="absolute right-2.5 bottom-2 left-2.5 flex gap-1.5">
        {[0, 1, 2].map((index) => (
          <span key={index} className={tile} style={{ transform: look.layout === "colagem" || look.layout === "polaroid" ? `rotate(${[-4, 3, -2][index]}deg)` : undefined }} />
        ))}
      </span>
    </Themed>
  );
}

export function StylePanel({ draft, update }: PanelProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PROFILE_STYLES.map((style) => (
        <OptionButton key={style} selected={draft.style === style} onClick={() => update((look) => chooseStyle(look, style))}>
          <StyleThumb style={style} />
          <span className="mt-2 block px-1 text-sm font-semibold">{STYLE_PRESETS[style].name}</span>
          <span className="block px-1 pb-1 text-xs leading-snug text-closie-muted">{STYLE_PRESETS[style].description}</span>
        </OptionButton>
      ))}
    </div>
  );
}

// ---------- Capa ----------

type CoverMode = "padrao" | "imagem" | "cor" | "gradiente" | "textura";
const COVER_MODES: { id: CoverMode; label: string }[] = [
  { id: "padrao", label: "Do estilo" },
  { id: "imagem", label: "Foto" },
  { id: "cor", label: "Cor" },
  { id: "gradiente", label: "Gradiente" },
  { id: "textura", label: "Textura" },
];

export function CoverPanel({ draft, resolved, update }: PanelProps) {
  const inputId = useId();
  const [mode, setMode] = useState<CoverMode>(draft.cover.kind);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cover = draft.cover;

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
      update((look) => ({ ...look, cover: { kind: "imagem", url: photo.url, x: 50, y: 50 } }));
    } catch {
      setError("Não deu pra abrir essa foto. Tente outra.");
    } finally {
      setBusy(false);
    }
  }

  function changeMode(next: CoverMode) {
    setMode(next);
    if (next === "padrao") update((look) => ({ ...look, cover: { kind: "padrao" } }));
    if (next === "cor" && cover.kind !== "cor") update((look) => ({ ...look, cover: { kind: "cor", color: resolved.palette.accent } }));
    if (next === "gradiente" && cover.kind !== "gradiente") update((look) => ({ ...look, cover: { kind: "gradiente", gradient: GRADIENTS[0].id } }));
    if (next === "textura" && cover.kind !== "textura") update((look) => ({ ...look, cover: { kind: "textura", texture: "papel" } }));
  }

  return (
    <div>
      <Segmented label="Tipo de capa" value={mode} options={COVER_MODES} onChange={changeMode} />

      {mode === "padrao" && <p className="mt-4 text-sm text-closie-muted">A capa muda junto com o estilo escolhido. Os adesivos ficam por cima dela.</p>}

      {mode === "imagem" && (
        <div className="mt-4">
          {cover.kind === "imagem" ? (
            <>
              <span className="block h-28 overflow-hidden rounded-2xl bg-closie-panel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover.url} alt="Foto da capa" className="h-full w-full object-cover" style={{ objectPosition: `${cover.x}% ${cover.y}%` }} />
              </span>
              <SectionTitle title="Posição da foto" hint="Escolha a parte da foto que aparece." />
              <Slider label="Horizontal" value={cover.x} onChange={(x) => update((look) => (look.cover.kind === "imagem" ? { ...look, cover: { ...look.cover, x } } : look))} />
              <Slider label="Vertical" value={cover.y} onChange={(y) => update((look) => (look.cover.kind === "imagem" ? { ...look, cover: { ...look.cover, y } } : look))} />
              <div className="mt-4 flex gap-2">
                <label htmlFor={inputId} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-closie-border-strong px-4 text-sm font-semibold hover:bg-closie-panel">
                  {busy ? <Loader2 aria-hidden className="size-4 motion-safe:animate-spin" /> : <ImagePlus aria-hidden className="size-4" />}
                  Trocar foto
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("padrao");
                    update((look) => ({ ...look, cover: { kind: "padrao" } }));
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-closie-red-hover hover:bg-closie-red-soft"
                >
                  <Trash2 aria-hidden className="size-4" />
                  Remover capa
                </button>
              </div>
            </>
          ) : (
            <label
              htmlFor={inputId}
              className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-closie-border-strong/60 bg-closie-panel text-center hover:border-closie-text"
            >
              {busy ? <Loader2 aria-hidden className="size-7 text-closie-muted motion-safe:animate-spin" /> : <ImagePlus aria-hidden className="size-8 text-closie-muted" />}
              <span className="text-sm font-semibold">{busy ? "Preparando a foto…" : "Escolher foto da galeria"}</span>
              <span className="text-xs text-closie-muted">Fotos deitadas ficam melhores</span>
            </label>
          )}
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void pick(file);
            }}
          />
          {error && (
            <p role="alert" className="mt-3 text-sm text-closie-red-hover">
              {error}
            </p>
          )}
        </div>
      )}

      {mode === "cor" && (
        <div className="mt-4">
          <ColorPicker
            label="Cor da capa"
            value={cover.kind === "cor" ? cover.color : resolved.palette.accent}
            onChange={(color) => update((look) => ({ ...look, cover: { kind: "cor", color } }))}
          />
        </div>
      )}

      {mode === "gradiente" && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {GRADIENTS.map((gradient) => (
            <OptionButton
              key={gradient.id}
              selected={cover.kind === "gradiente" && cover.gradient === gradient.id}
              onClick={() => update((look) => ({ ...look, cover: { kind: "gradiente", gradient: gradient.id } }))}
            >
              <span className="block h-14 rounded-xl" style={{ background: gradient.css }} />
              <span className="mt-1 block px-1 text-xs font-semibold">{gradient.label}</span>
            </OptionButton>
          ))}
        </div>
      )}

      {mode === "textura" && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {TEXTURES.filter((texture) => texture.id !== "nenhuma").map((texture) => (
            <OptionButton
              key={texture.id}
              selected={cover.kind === "textura" && cover.texture === texture.id}
              onClick={() => update((look) => ({ ...look, cover: { kind: "textura", texture: texture.id } }))}
            >
              <Themed look={resolved} className="h-14 rounded-xl bg-[color:var(--p-surface)]">
                <TextureLayer texture={texture.id} />
              </Themed>
              <span className="mt-1 block px-1 text-xs font-semibold">{texture.label}</span>
            </OptionButton>
          ))}
        </div>
      )}
    </div>
  );
}

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
            "size-8 rounded-full border border-black/10 transition-transform hover:scale-110",
            value.toUpperCase() === color && "ring-2 ring-closie-text ring-offset-2",
          )}
          style={{ background: color }}
        />
      ))}
      <label htmlFor={id} className="relative flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-closie-border-strong bg-[conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)]" title="Escolher outra cor">
        <span className="sr-only">Escolher outra cor</span>
        <input id={id} type="color" value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
    </div>
  );
}

const COLOR_ROLES: { key: keyof Palette; label: string; hint: string }[] = [
  { key: "primary", label: "Cor principal", hint: "Nome, títulos e o botão principal" },
  { key: "accent", label: "Cor de destaque", hint: "Anel de stories, realces e detalhes" },
  { key: "background", label: "Cor de fundo", hint: "O fundo do perfil" },
  { key: "decor", label: "Decoração", hint: "Fitas, molduras e adesivos" },
];

export function ColorsPanel({ draft, resolved, update }: PanelProps) {
  const colors = themeColors(resolved.palette);
  const setColor = (key: keyof Palette, color: string) =>
    update((look) => ({ ...look, palette: { ...resolveAppearance(look).palette, [key]: color } }));
  return (
    <div>
      {COLOR_ROLES.map((role) => (
        <div key={role.key} className="mt-5 first:mt-1">
          <h3 className="text-sm font-bold">{role.label}</h3>
          <p className="mb-2 text-xs text-closie-muted">{role.hint}</p>
          <ColorPicker label={role.label} value={resolved.palette[role.key]} onChange={(color) => setColor(role.key, color)} />
        </div>
      ))}
      {(colors.title !== resolved.palette.primary || colors.accentText !== resolved.palette.accent) && (
        <p className="mt-5 rounded-2xl bg-closie-panel px-4 py-3 text-sm text-closie-muted">
          Pouco contraste com o fundo: onde a cor ficaria difícil de ler, o texto usa {colors.text === "#FFFFFF" ? "branco" : "preto"} para continuar legível.
        </p>
      )}
      {draft.palette && (
        <button type="button" onClick={() => update((look) => ({ ...look, palette: null }))} className="mt-5 text-sm font-semibold text-closie-link hover:underline">
          Usar as cores do estilo
        </button>
      )}
    </div>
  );
}

// ---------- Elementos (adesivos, molduras, texturas) ----------

type ElementsTab = "adesivos" | "molduras" | "texturas";
const ELEMENT_TABS: { id: ElementsTab; label: string }[] = [
  { id: "adesivos", label: "Adesivos" },
  { id: "molduras", label: "Molduras" },
  { id: "texturas", label: "Texturas" },
];

type ElementsProps = PanelProps & {
  person: Person;
  today: Today;
  selectedSticker: string | null;
  onSelectSticker: (id: string | null) => void;
};

export function ElementsPanel({ draft, resolved, update, person, today, selectedSticker, onSelectSticker }: ElementsProps) {
  const [tab, setTab] = useState<ElementsTab>("adesivos");
  const [category, setCategory] = useState<(typeof STICKER_CATEGORIES)[number]["id"]>(STICKER_CATEGORIES[0].id);
  const full = draft.stickers.length >= STICKERS_MAX;
  const selected = draft.stickers.find((item) => item.id === selectedSticker) ?? null;
  const kinds = STICKER_CATEGORIES.find((item) => item.id === category)?.kinds ?? [];

  return (
    <div>
      <Segmented label="Tipo de elemento" value={tab} options={ELEMENT_TABS} onChange={setTab} />

      {tab === "adesivos" && (
        <>
          <div className="scrollbar-none mt-4 -mx-4 flex gap-1.5 overflow-x-auto px-4">
            {STICKER_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                aria-pressed={category === item.id}
                className={clsx(
                  "h-8 shrink-0 rounded-full border px-3 text-xs font-semibold whitespace-nowrap",
                  category === item.id ? "border-closie-text bg-closie-text text-closie-bg" : "border-closie-border text-closie-muted hover:text-closie-text",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Themed look={resolved} className="mt-3 rounded-2xl bg-[color:var(--p-bg)] p-2 ring-1 ring-closie-border">
            <span className="grid grid-cols-3 gap-2">
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
                  aria-label={`Adicionar ${STICKER_LABEL[kind]}`}
                  className="flex h-20 items-center justify-center rounded-xl transition-[background-color,transform] hover:bg-[color:var(--p-surface)] active:scale-95 disabled:opacity-40"
                >
                  <span className="pointer-events-none origin-center scale-[0.8]">
                    <StickerArt kind={kind} today={today} />
                  </span>
                </button>
              ))}
            </span>
          </Themed>
          <p className="mt-2 text-xs text-closie-muted">
            {full ? `Chegou no limite de ${STICKERS_MAX} adesivos. Tire algum para pôr outro.` : "Toque para colocar na capa. Na prévia, arraste para posicionar (as setas também movem)."}
          </p>

          {draft.stickers.length > 0 && (
            <>
              <SectionTitle title={`Na sua capa (${draft.stickers.length} de ${STICKERS_MAX})`} />
              <Themed look={resolved} className="rounded-2xl bg-[color:var(--p-bg)] p-2 ring-1 ring-closie-border">
                <span className="flex flex-wrap gap-2">
                  {draft.stickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      type="button"
                      onClick={() => onSelectSticker(sticker.id)}
                      aria-pressed={sticker.id === selectedSticker}
                      aria-label={`Selecionar ${STICKER_LABEL[sticker.kind]}`}
                      className={clsx(
                        "flex size-14 items-center justify-center overflow-hidden rounded-xl",
                        sticker.id === selectedSticker ? "bg-[color:var(--p-surface)] ring-2 ring-closie-text" : "hover:bg-[color:var(--p-surface)]",
                      )}
                    >
                      <span className="pointer-events-none origin-center scale-[0.55]">
                        <StickerArt kind={sticker.kind} today={today} />
                      </span>
                    </button>
                  ))}
                </span>
              </Themed>
              {selected && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-closie-panel p-2">
                  <span className="px-2 text-sm font-semibold">{STICKER_LABEL[selected.kind]}</span>
                  <span className="ml-auto flex gap-1">
                    <ToolButton label="Diminuir" onClick={() => update((look) => updateSticker(look, selected.id, { scale: selected.scale - 0.15 }))}>
                      <Minus aria-hidden className="size-4" />
                    </ToolButton>
                    <ToolButton label="Aumentar" onClick={() => update((look) => updateSticker(look, selected.id, { scale: selected.scale + 0.15 }))}>
                      <Plus aria-hidden className="size-4" />
                    </ToolButton>
                    <ToolButton label="Girar para a esquerda" onClick={() => update((look) => updateSticker(look, selected.id, { rotate: selected.rotate - 10 }))}>
                      <RotateCcw aria-hidden className="size-4" />
                    </ToolButton>
                    <ToolButton label="Girar para a direita" onClick={() => update((look) => updateSticker(look, selected.id, { rotate: selected.rotate + 10 }))}>
                      <RotateCw aria-hidden className="size-4" />
                    </ToolButton>
                    <ToolButton
                      label="Tirar adesivo"
                      danger
                      onClick={() => {
                        update((look) => removeSticker(look, selected.id));
                        onSelectSticker(null);
                      }}
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </ToolButton>
                  </span>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === "molduras" && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {AVATAR_FRAMES.map((frame) => (
            <OptionButton key={frame.id} selected={resolved.frame === frame.id} onClick={() => update((look) => ({ ...look, frame: frame.id }))}>
              <Themed look={resolved} className="flex h-24 items-center justify-center rounded-xl bg-[color:var(--p-bg)]">
                <FramedAvatar frame={frame.id} name={person.displayName ?? person.username} src={person.avatar} size={56} stories={false} storiesLabel="" />
              </Themed>
              <span className="mt-1 block px-1 text-xs font-semibold">{frame.label}</span>
            </OptionButton>
          ))}
        </div>
      )}

      {tab === "texturas" && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {TEXTURES.map((texture) => (
            <OptionButton key={texture.id} selected={resolved.texture === texture.id} onClick={() => update((look) => ({ ...look, texture: texture.id }))}>
              <Themed look={resolved} className="h-16 rounded-xl bg-[color:var(--p-bg)] ring-1 ring-black/5">
                <TextureLayer texture={texture.id} />
              </Themed>
              <span className="mt-1 block px-1 text-xs font-semibold">{texture.label}</span>
            </OptionButton>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={clsx("flex size-9 items-center justify-center rounded-full bg-closie-bg shadow-sm", danger ? "text-closie-red-hover" : "text-closie-text")}
    >
      {children}
    </button>
  );
}

// ---------- Momentos ----------

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

export function MomentsPanel({ resolved, update }: PanelProps) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {MOMENT_LAYOUTS.map((layout) => (
          <OptionButton key={layout.id} selected={resolved.layout === layout.id} onClick={() => update((look) => ({ ...look, layout: layout.id }))}>
            <Themed look={resolved} className="h-20 rounded-xl bg-[color:var(--p-bg)] p-2 ring-1 ring-black/5">
              <LayoutThumb layout={layout.id} />
            </Themed>
            <span className="mt-1 block px-1 text-sm font-semibold">{layout.label}</span>
            <span className="block px-1 pb-0.5 text-xs leading-snug text-closie-muted">{layout.text}</span>
          </OptionButton>
        ))}
      </div>
      <SectionTitle title="Cantos" hint="Vale para os cartões, as molduras e os botões do perfil." />
      <Segmented label="Cantos" value={resolved.corners} options={CORNERS} onChange={(corners) => update((look) => ({ ...look, corners }))} />
    </div>
  );
}

// ---------- Fonte ----------

export function FontPanel({ resolved, update, person }: PanelProps & { person: Person }) {
  const name = person.displayName ?? person.username;
  return (
    <div className={clsx(profileFontVariables, "flex flex-col gap-2")}>
      <p className="mb-1 text-sm text-closie-muted">Vale para o seu nome, os títulos e as legendas. Botões e números continuam na fonte da Closie.</p>
      {FONTS.map((font) => (
        <OptionButton key={font.id} selected={resolved.font === font.id} onClick={() => update((look) => ({ ...look, font: font.id }))} className="flex items-center gap-3 px-3 py-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-closie-panel text-2xl" style={{ fontFamily: FONT_FAMILY[font.id] }}>
            Aa
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg leading-tight" style={{ fontFamily: FONT_FAMILY[font.id] }}>
              {name}
            </span>
            <span className="block text-xs font-semibold text-closie-muted">{font.label}</span>
          </span>
        </OptionButton>
      ))}
    </div>
  );
}
