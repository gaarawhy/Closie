// Regras de navegação da conta, num lugar só. Quem aplica é o RouteGuard (no navegador,
// porque a sessão mock só existe lá); com backend, o proxy do Next pode usar as mesmas regras.

export const PATHS = {
  login: "/entrar",
  signup: "/cadastro",
  onboarding: "/onboarding",
  home: "/daily",
} as const;

export type RouteState = {
  hasSession: boolean;
  onboarded: boolean;
  // A sessão acabou com a pessoa nesta página (ex.: "Sair"): volta para entrar sem "next",
  // porque ela não estava tentando abrir esta página.
  sessionEnded?: boolean;
};

const matches = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

// Destino seguro depois de entrar: só caminho interno, e nunca de volta para entrar/cadastro.
export function safeNextPath(value: string | null | undefined, fallback: string = PATHS.home): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  const pathname = value.split(/[?#]/, 1)[0];
  if (matches(pathname, PATHS.login) || matches(pathname, PATHS.signup)) return fallback;
  return value;
}

// Para onde mandar a pessoa nesta página, ou null se ela pode ficar.
export function resolveRoute(pathname: string, state: RouteState, next?: string | null): string | null {
  const { hasSession, onboarded, sessionEnded = false } = state;
  const loginWithNext = sessionEnded ? PATHS.login : `${PATHS.login}?next=${encodeURIComponent(pathname)}`;

  if (pathname === "/") return hasSession ? (onboarded ? PATHS.home : PATHS.onboarding) : PATHS.login;

  if (matches(pathname, PATHS.home)) {
    if (!hasSession) return loginWithNext;
    return onboarded ? null : PATHS.onboarding;
  }

  if (matches(pathname, PATHS.onboarding)) {
    if (!hasSession) return loginWithNext;
    return onboarded ? PATHS.home : null;
  }

  if (matches(pathname, PATHS.login) || matches(pathname, PATHS.signup)) {
    if (!hasSession) return null;
    return onboarded ? safeNextPath(next) : PATHS.onboarding;
  }

  return null;
}
