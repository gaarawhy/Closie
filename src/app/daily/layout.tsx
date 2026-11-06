import { Suspense, type ReactNode } from "react";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { LogoMark } from "@/components/brand/Logo";
import { DailyShell } from "@/components/daily/DailyShell";

// Área logada: confere a sessão uma vez e mantém o menu montado entre as páginas do /daily.
// O Suspense é obrigatório porque o menu e o guarda leem o endereço (usePathname) e há rota
// com @ dinâmico (/daily/perfil/[username]), que só é conhecida na hora.
export default function DailyLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div role="status" className="flex min-h-dvh flex-1 items-center justify-center">
          <LogoMark className="h-12 w-auto motion-safe:animate-pulse" label="" />
          <span className="sr-only">Carregando…</span>
        </div>
      }
    >
      <RouteGuard mode="protected" keepMounted>
        <DailyShell>{children}</DailyShell>
      </RouteGuard>
    </Suspense>
  );
}
