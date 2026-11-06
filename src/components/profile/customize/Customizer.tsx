"use client";

import clsx from "clsx";
import { Image as ImageIcon, Monitor, Palette, RotateCcw, Smartphone, Sparkles, Sticker } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useNotify } from "@/components/daily/DailyShell";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useSession, type Session } from "@/lib/account";
import {
  defaultAppearance,
  loadAppearance,
  moveSticker,
  removeSticker,
  resetAppearance,
  updateSticker,
  resolveAppearance,
  saveAppearance,
  useSavedAppearance,
  type ProfileAppearance,
} from "@/lib/appearance";
import type { Person } from "@/lib/social";
import { useNow } from "@/lib/stories";
import { PreviewScaleContext, todayStamp } from "../appearance/StickersLayer";
import { PROFILE_PATH } from "../links";
import { useProfileData } from "../ProfilePage";
import { ProfileView, type ProfileViewActions } from "../ProfileView";
import { ColorsPanel, CoverPanel, StickersPanel, StylePanel } from "./panels";

// Quatro abas grandes e diretas (o resto fica em "Mais opções", dentro de Estilo)
type Category = "estilo" | "capa" | "cores" | "adesivos";

const CATEGORIES: { id: Category; label: string; icon: typeof Palette }[] = [
  { id: "estilo", label: "Estilo", icon: Sparkles },
  { id: "capa", label: "Capa", icon: ImageIcon },
  { id: "cores", label: "Cores", icon: Palette },
  { id: "adesivos", label: "Adesivos", icon: Sticker },
];

const nothing = () => {};
// Na prévia nada é de verdade: os botões do perfil não fazem nada
const PREVIEW_ACTIONS: ProfileViewActions = {
  onOpenStories: nothing,
  onOpenConnections: nothing,
  onFollow: nothing,
  onUnfollow: nothing,
  onCancelRequest: nothing,
  onUnblock: nothing,
  onOpenMoment: nothing,
  onCreateMoment: nothing,
};

const DESKTOP = "(min-width: 768px)";
const subscribeDesktop = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const isDesktopNow = () => window.matchMedia(DESKTOP).matches;

// Personalizar o perfil: escolhas por categoria de um lado (ou embaixo, no celular) e a prévia
// fiel do perfil do outro, mudando na hora. Nada vale até salvar.
export function Customizer() {
  const session = useSession();
  // O editor só nasce com a sessão em mãos (começa com o visual salvo)
  if (!session) return null;
  return <CustomizerEditor key={session.id} session={session} />;
}

function CustomizerEditor({ session }: { session: Session }) {
  const router = useRouter();
  const notify = useNotify();
  const now = useNow(60_000);
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktopNow, () => false);
  const saved = useSavedAppearance(session.id);
  const [draft, setDraft] = useState<ProfileAppearance>(() => loadAppearance(session.id) ?? defaultAppearance());
  const [category, setCategory] = useState<Category>("estilo");
  const [device, setDevice] = useState<"celular" | "computador">(() => (isDesktopNow() ? "computador" : "celular"));
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const original = saved ?? defaultAppearance();
  const dirty = JSON.stringify(draft) !== JSON.stringify(original);
  const resolved = useMemo(() => resolveAppearance(draft), [draft]);
  const today = useMemo(() => todayStamp(now), [now]);
  const data = useProfileData(session.id, session.id, now);
  const { profile } = session;
  const person: Person = {
    id: session.id,
    username: profile.username ?? "",
    displayName: profile.displayName,
    avatar: profile.avatar,
    privacy: profile.privacy,
    bio: profile.bio,
  };

  // Recarregar ou fechar a aba com mudanças não salvas: o navegador pergunta antes
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(change: (look: ProfileAppearance) => ProfileAppearance) {
    setError(null);
    setDraft(change);
  }

  function save() {
    const isOriginal = JSON.stringify(draft) === JSON.stringify(defaultAppearance());
    const ok = isOriginal ? resetAppearance(session.id) : saveAppearance(session.id, draft);
    if (!ok) {
      setError("Não deu pra salvar: o armazenamento do navegador está cheio. Tente uma foto de capa menor.");
      return;
    }
    notify("Visual salvo! Seu perfil já aparece assim para todo mundo.");
    router.push(PROFILE_PATH);
  }

  function cancel() {
    if (dirty) setLeaving(true);
    else router.push(PROFILE_PATH);
  }

  function restoreOriginal() {
    update(() => defaultAppearance());
    setSelectedSticker(null);
    notify("Voltou ao visual original da Closie. Salve para manter.");
  }

  const panelProps = { draft, resolved, update };
  const panel: Record<Category, ReactNode> = {
    estilo: <StylePanel {...panelProps} person={person} />,
    capa: <CoverPanel {...panelProps} />,
    cores: <ColorsPanel {...panelProps} />,
    adesivos: <StickersPanel {...panelProps} today={today} onSelectSticker={setSelectedSticker} />,
  };

  const preview = data && (
    <PreviewPane device={desktop ? device : "celular"} onDevice={setDevice} showDevices={desktop} onRestore={restoreOriginal}>
      <ProfileView
        person={person}
        look={resolved}
        rel={data.rel}
        followsYou={false}
        canSee
        stats={data.stats}
        storyCount={data.stories?.stories.length ?? 0}
        moments={data.moments}
        now={now}
        actions={PREVIEW_ACTIONS}
        preview={{
          stickers: {
            selectedId: selectedSticker,
            onSelect: (id) => {
              setSelectedSticker(id);
              if (id) setCategory("adesivos");
            },
            onMove: (id, x, y) => update((look) => moveSticker(look, id, x, y)),
            onUpdate: (id, patch) => update((look) => updateSticker(look, id, patch)),
            onRemove: (id) => {
              update((look) => removeSticker(look, id));
              setSelectedSticker(null);
            },
          },
        }}
      />
    </PreviewPane>
  );

  return (
    <div className="md:-mb-12 md:grid md:h-dvh md:grid-cols-[420px_minmax(0,1fr)] md:overflow-hidden">
      <div className="flex flex-col md:min-h-0 md:border-r md:border-closie-border">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-closie-border bg-closie-bg/95 px-3 py-2.5 backdrop-blur">
          <button type="button" onClick={cancel} className="h-10 rounded-full px-3 text-sm font-semibold transition-colors hover:bg-closie-panel">
            Cancelar
          </button>
          <h1 className="flex-1 text-center text-base font-bold">Personalizar perfil</h1>
          <Button size="sm" className="rounded-full px-5" disabled={!dirty} onClick={save}>
            Salvar
          </Button>
        </header>

        {/* Celular: a prévia e as abas ficam presas no alto enquanto você mexe nas opções */}
        {!desktop && <div className="sticky top-[57px] z-20 h-[40dvh] border-b border-closie-border">{preview}</div>}

        <nav aria-label="O que personalizar" className="sticky top-[calc(57px+40dvh)] z-20 grid grid-cols-4 gap-1.5 bg-closie-bg px-4 pt-3 pb-2 md:static">
          {CATEGORIES.map((item) => {
            const Icon = item.icon;
            const active = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                aria-pressed={active}
                className={clsx(
                  "flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-closie-text",
                  active ? "bg-closie-red text-closie-on-red" : "bg-closie-panel text-closie-text hover:bg-closie-panel-strong",
                )}
              >
                <Icon aria-hidden className="size-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pt-2 pb-10 md:min-h-0 md:flex-1 md:overflow-y-auto">
          <h2 className="sr-only">{CATEGORIES.find((item) => item.id === category)?.label}</h2>
          {panel[category]}
          {error && (
            <p role="alert" className="mt-4 rounded-2xl bg-closie-red-soft px-4 py-3 text-sm text-closie-red-hover">
              {error}
            </p>
          )}
        </div>
      </div>

      {desktop && <div className="hidden min-h-0 md:flex md:flex-col">{preview}</div>}

      {leaving && (
        <Modal title="Descartar as alterações?" onClose={() => setLeaving(false)}>
          <p className="text-sm text-closie-muted">O visual novo ainda não foi salvo. Se sair agora, seu perfil continua como estava.</p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setLeaving(false)}>
              Continuar editando
            </Button>
            <Button size="lg" className="flex-1" onClick={() => router.push(PROFILE_PATH)}>
              Descartar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

type PreviewPaneProps = {
  device: "celular" | "computador";
  onDevice: (device: "celular" | "computador") => void;
  showDevices: boolean;
  onRestore: () => void;
  children: ReactNode;
};

function PreviewPane({ device, onDevice, showDevices, onRestore, children }: PreviewPaneProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-closie-panel">
      <div className="flex items-center gap-2 px-3 py-2">
        {showDevices && (
          <div role="radiogroup" aria-label="Ver como" className="flex rounded-full bg-closie-bg p-1 shadow-sm">
            {(
              [
                ["celular", "Celular", Smartphone],
                ["computador", "Computador", Monitor],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={device === id}
                aria-label={label}
                title={label}
                onClick={() => onDevice(id)}
                className={clsx("flex size-8 items-center justify-center rounded-full", device === id ? "bg-closie-text text-closie-bg" : "text-closie-muted")}
              >
                <Icon aria-hidden className="size-4" />
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={onRestore}
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-closie-bg px-3 text-xs font-semibold text-closie-text shadow-sm"
        >
          <RotateCcw aria-hidden className="size-4" />
          Original
        </button>
      </div>
      <PreviewFrame device={device}>
        {children}
      </PreviewFrame>
    </div>
  );
}

// Desenha o perfil na largura de um celular (390) ou de um computador (1180) e encolhe para
// caber: como o perfil usa consultas de contêiner, a prévia é igual à página.
function PreviewFrame({ device, children }: { device: "celular" | "computador"; children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  const [height, setHeight] = useState(0);
  const width = device === "computador" ? 1180 : 390;

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const observer = new ResizeObserver(() => {
      setAvailable(outer.clientWidth);
      setHeight(inner.offsetHeight);
    });
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  const scale = available > 0 ? Math.min(1, (available - 24) / width) : 1;

  return (
    <div ref={outerRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-4">
      <div className="relative mx-auto overflow-hidden rounded-[24px] bg-white shadow-xl ring-1 ring-black/5" style={{ width: width * scale, height: height * scale || undefined }}>
        <div ref={innerRef} className="absolute top-0 left-0 origin-top-left" style={{ width, transform: `scale(${scale})` }}>
          <PreviewScaleContext.Provider value={scale}>{children}</PreviewScaleContext.Provider>
        </div>
      </div>
    </div>
  );
}
