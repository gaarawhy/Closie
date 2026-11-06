"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useState, type ComponentType, type ReactNode } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { CreateDialog, type CreateMode } from "@/components/create/CreateDialog";
import { Avatar } from "@/components/ui/Avatar";
import { Toast } from "@/components/ui/Toast";
import { useSession } from "@/lib/account";
import { useNotifications } from "@/lib/notifications";
import { BellIcon, CreateIcon, HomeIcon, SearchIcon } from "./NavIcons";

// Avisos rápidos (toast) para qualquer parte da área logada.
const NotifyContext = createContext<(message: string) => void>(() => {});
export const useNotify = () => useContext(NotifyContext);

// Abrir o "Criar" de qualquer página (o + do menu, a bolinha "Seu daily", o "Novo momento" do
// perfil…), já na aba certa: story ou momento.
const ComposerContext = createContext<(mode?: CreateMode) => void>(() => {});
export const useComposer = () => useContext(ComposerContext);

export const DAILY_PATHS = {
  home: "/daily",
  search: "/daily/pesquisar",
  notifications: "/daily/notificacoes",
  myStories: "/daily/meus-stories",
  friends: "/daily/amigos",
  moments: "/daily/momentos",
  profile: "/daily/perfil",
  editProfile: "/daily/perfil/editar",
  customize: "/daily/perfil/personalizar",
} as const;

// Moldura da área logada, montada uma vez no layout do /daily (não pisca ao trocar de página):
// menu lateral no computador, barra embaixo no celular, publicar de qualquer lugar e os avisos.
export function DailyShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const [toast, setToast] = useState<string | null>(null);
  const [creating, setCreating] = useState<CreateMode | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  // Qualquer coisa que não seja "momento" (inclusive o evento de um clique) abre no story
  const openComposer = useCallback((mode?: CreateMode) => setCreating(mode === "momento" ? "momento" : "story"), []);
  const composing = creating !== null;

  // Sempre renderiza a página (o layout precisa dela, mesmo antes de a sessão chegar); o menu
  // e o "Criar" só aparecem com sessão. A estrutura não muda, então nada é remontado.
  return (
    <NotifyContext.Provider value={setToast}>
      <ComposerContext.Provider value={openComposer}>
        <div className="min-h-dvh bg-closie-bg md:pl-[72px]">
          {session && <SideNav composing={composing} onCreate={openComposer} />}
          <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-12">{children}</main>
          {session && <BottomNav composing={composing} onCreate={openComposer} />}
        </div>
        {session && creating && (
          <CreateDialog
            viewerId={session.id}
            profilePrivate={session.profile.privacy === "private"}
            initialMode={creating}
            onClose={() => setCreating(null)}
            onPublished={(mode) => {
              setCreating(null);
              setToast(mode === "story" ? "Story publicado! Fica no ar por 24 h." : "Momento publicado! Ele já está no seu perfil.");
            }}
          />
        )}
        <Toast message={toast} onClose={closeToast} bottomClass="bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:bottom-6" />
      </ComposerContext.Provider>
    </NotifyContext.Provider>
  );
}

type NavIcon = ComponentType<{ active?: boolean; className?: string; on?: "light" | "red" }>;

const itemClass =
  "group relative flex size-12 items-center justify-center rounded-2xl text-closie-text transition-colors hover:bg-closie-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-closie-text";

// Bolinha vermelha de "tem novidade" no canto do ícone
function Dot() {
  return <span aria-hidden className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-closie-red ring-2 ring-closie-bg" />;
}

// Nome do item ao passar o mouse ou focar pelo teclado (só no menu lateral)
function Tip({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-full z-50 ml-3 rounded-lg bg-closie-text px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-closie-bg opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {children}
    </span>
  );
}

function NavLink({ href, label, icon: Icon, active, dot, tip }: { href: string; label: string; icon: NavIcon; active: boolean; dot?: boolean; tip?: boolean }) {
  return (
    <Link href={href} aria-label={dot ? `${label} (tem novidade)` : label} aria-current={active ? "page" : undefined} className={itemClass}>
      <Icon active={active} className="size-[26px]" />
      {dot && <Dot />}
      {tip && <Tip>{label}</Tip>}
    </Link>
  );
}

function CreateButton({ active, onClick, tip }: { active: boolean; onClick: () => void; tip?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label="Criar story ou momento" className={itemClass}>
      <CreateIcon active={active} className="size-[26px]" />
      {tip && <Tip>Criar</Tip>}
    </button>
  );
}

function useNavState() {
  const pathname = usePathname();
  const { unread } = useNotifications();
  return { pathname, hasNews: unread > 0 && pathname !== DAILY_PATHS.notifications };
}

// Computador: barra fina à esquerda, como na referência; o perfil fica embaixo.
function SideNav({ composing, onCreate }: { composing: boolean; onCreate: () => void }) {
  const { pathname, hasNews } = useNavState();
  return (
    <nav
      aria-label="Menu principal"
      className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col items-center gap-2 border-r border-closie-border bg-closie-bg py-5 md:flex"
    >
      {/* O símbolo da Closie no alto do menu (leva ao Início) */}
      <Link href={DAILY_PATHS.home} aria-label="Closie, ir para o Início" className="mb-3 flex size-12 items-center justify-center rounded-2xl transition-colors hover:bg-closie-panel">
        <LogoMark className="h-8 w-auto" label="" />
      </Link>
      <NavLink href={DAILY_PATHS.home} label="Início" icon={HomeIcon} active={pathname === DAILY_PATHS.home} tip />
      <NavLink href={DAILY_PATHS.search} label="Pesquisar" icon={SearchIcon} active={pathname === DAILY_PATHS.search} tip />
      <CreateButton active={composing} onClick={onCreate} tip />
      <NavLink
        href={DAILY_PATHS.notifications}
        label="Notificações"
        icon={BellIcon}
        active={pathname === DAILY_PATHS.notifications}
        dot={hasNews}
        tip
      />
      <div className="mt-auto">
        <ProfileLink />
      </div>
    </nav>
  );
}

// Celular: barra flutuante em pílula, no modelo da referência do Pinterest. O símbolo da Closie é
// o Início (o logo leva para casa, sem um botão repetido do lado); os outros itens têm ícone +
// nome. Só o item da página atual fica com o cartão vermelho — inclusive o logo, que nas outras
// páginas volta a ser só o símbolo vermelho no branco.
function BottomNav({ composing, onCreate }: { composing: boolean; onCreate: () => void }) {
  const { pathname, hasNews } = useNavState();
  const onHome = pathname === DAILY_PATHS.home && !composing;
  return (
    <nav
      aria-label="Menu principal"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="pointer-events-auto mx-auto flex h-16 max-w-md items-center gap-1.5 rounded-full bg-closie-bg p-1.5 shadow-[0_14px_34px_-14px_rgb(26_26_26/0.4),0_2px_10px_rgb(26_26_26/0.08)] ring-1 ring-closie-border">
        <Link
          href={DAILY_PATHS.home}
          aria-label="Início"
          aria-current={pathname === DAILY_PATHS.home ? "page" : undefined}
          className={clsx(
            "flex h-full w-[60px] shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-closie-text motion-safe:transition motion-safe:active:scale-95 max-[22rem]:w-[52px]",
            onHome && "bg-closie-red",
          )}
        >
          <LogoMark tone={onHome ? "white" : "red"} label="" className="h-7 w-auto" />
        </Link>
        <ul className="flex h-full min-w-0 flex-1 items-center justify-around">
          <li className="h-full">
            <BarLink href={DAILY_PATHS.search} label="Pesquisar" icon={SearchIcon} active={pathname === DAILY_PATHS.search} />
          </li>
          <li className="h-full">
            <button type="button" onClick={onCreate} aria-label="Criar story ou momento" className={clsx(barItemClass, composing && barItemActive)}>
              <CreateIcon active={composing} on={composing ? "red" : "light"} className="size-6" />
              <BarLabel active={composing}>Criar</BarLabel>
            </button>
          </li>
          <li className="h-full">
            <BarLink
              href={DAILY_PATHS.notifications}
              label="Notificações"
              icon={BellIcon}
              active={pathname === DAILY_PATHS.notifications}
              dot={hasNews}
            />
          </li>
          <li className="h-full">
            <BarProfile />
          </li>
        </ul>
      </div>
    </nav>
  );
}

// Em telas bem estreitas (< 352 px) os nomes saem da tela visível (continuam para leitor de tela)
const barItemClass =
  "flex h-full min-w-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-2 text-closie-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-closie-text motion-safe:transition motion-safe:active:scale-95 max-[22rem]:min-w-12 max-[22rem]:px-1";
// Item da página atual: quadrado vermelho cheio, ícone e nome em branco
const barItemActive = "bg-closie-red text-closie-on-red";

function BarLabel({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span className={clsx("text-[10px] leading-3 tracking-tight whitespace-nowrap max-[22rem]:sr-only", active ? "font-semibold" : "font-medium")}>
      {children}
    </span>
  );
}

function BarLink({ href, label, icon: Icon, active, dot }: { href: string; label: string; icon: NavIcon; active: boolean; dot?: boolean }) {
  return (
    <Link
      href={href}
      aria-label={dot ? `${label} (tem novidade)` : undefined}
      aria-current={active ? "page" : undefined}
      className={clsx(barItemClass, active && barItemActive)}
    >
      <span className="relative">
        <Icon active={active} on={active ? "red" : "light"} className="size-6" />
        {dot && <span aria-hidden className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-closie-red ring-2 ring-closie-bg" />}
      </span>
      <BarLabel active={active}>{label}</BarLabel>
    </Link>
  );
}

// Páginas que ficam "dentro" do perfil (o item Perfil continua marcado nelas)
const PROFILE_PAGES: string[] = [
  DAILY_PATHS.profile,
  DAILY_PATHS.editProfile,
  DAILY_PATHS.customize,
  DAILY_PATHS.myStories,
  DAILY_PATHS.friends,
];

function useOwnProfile() {
  const session = useSession();
  const pathname = usePathname();
  if (!session) return null;
  const { profile } = session;
  return {
    name: profile.displayName ?? profile.username ?? "Você",
    avatar: profile.avatar ?? undefined,
    active: PROFILE_PAGES.includes(pathname),
  };
}

function BarProfile() {
  const own = useOwnProfile();
  if (!own) return null;
  return (
    <Link href={DAILY_PATHS.profile} aria-label="Meu perfil" aria-current={own.active ? "page" : undefined} className={clsx(barItemClass, own.active && barItemActive)}>
      <span className={clsx("flex rounded-full", own.active && "ring-2 ring-closie-on-red")}>
        <Avatar name={own.name} src={own.avatar} size={24} />
      </span>
      <BarLabel active={own.active}>Perfil</BarLabel>
    </Link>
  );
}

// Perfil embaixo do menu lateral: um toque abre o seu perfil (as outras opções ficam no ⋯ de lá).
function ProfileLink() {
  const own = useOwnProfile();
  if (!own) return null;
  return (
    <Link href={DAILY_PATHS.profile} aria-label="Meu perfil" aria-current={own.active ? "page" : undefined} className={clsx(itemClass, "rounded-full")}>
      <span className={clsx("flex rounded-full", own.active && "ring-2 ring-closie-text ring-offset-2 ring-offset-closie-bg")}>
        <Avatar name={own.name} src={own.avatar} size={34} />
      </span>
      <Tip>Perfil</Tip>
    </Link>
  );
}
