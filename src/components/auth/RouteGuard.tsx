"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { isOnboarded, useSession } from "@/lib/account";
import { resolveRoute } from "@/lib/routes";

type RouteGuardProps = {
  // "protected": só mostra a página depois de saber quem está logado.
  // "guest" (entrar, cadastro): mostra na hora e só sai se descobrir que já tem sessão.
  mode: "guest" | "protected";
  // Usado em layout: mantém a página filha montada (escondida) enquanto confere a sessão
  keepMounted?: boolean;
  children: ReactNode;
};

// Aplica as regras de src/lib/routes.ts. Enquanto redireciona, mostra "Carregando…"
// para não piscar a página errada.
export function RouteGuard({ mode, keepMounted = false, children }: RouteGuardProps) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const known = session !== undefined;
  const hasSession = Boolean(session);
  const onboarded = session ? isOnboarded(session) : false;
  const redirecting = known && resolveRoute(pathname, { hasSession, onboarded }) !== null;
  // Se havia sessão e ela sumiu com a página aberta, foi um "Sair" (ou saída em outra aba)
  const hadSession = useRef(false);

  useEffect(() => {
    if (!known) return;
    const sessionEnded = !hasSession && hadSession.current;
    hadSession.current = hasSession;
    // O "next" vem da URL; lido aqui para não exigir <Suspense> com useSearchParams
    const next = new URLSearchParams(window.location.search).get("next");
    const destination = resolveRoute(pathname, { hasSession, onboarded, sessionEnded }, next);
    if (destination) router.replace(destination);
  }, [known, hasSession, onboarded, pathname, router]);

  const guarding = redirecting || (!known && mode === "protected");
  const loading = (
    <div role="status" className="flex min-h-48 flex-1 items-center justify-center">
      <LogoMark className="h-12 w-auto motion-safe:animate-pulse" label="" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
  // Num layout, a página filha continua renderizada (escondida) enquanto a sessão é conferida:
  // o Next valida a navegação de cada página e acusa erro quando o layout deixa de renderizá-la.
  // A estrutura é a mesma nos dois estados, para nada ser remontado quando a sessão chega.
  if (keepMounted) {
    return (
      <>
        {guarding && loading}
        <div hidden={guarding} className="contents">
          {children}
        </div>
      </>
    );
  }
  return guarding ? loading : children;
}
