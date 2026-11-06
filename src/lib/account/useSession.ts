"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getSession } from "./service";
import { snapshot, subscribe } from "./storage";
import type { Session } from "./types";

// No servidor e durante a hidratação ainda não dá pra ler o navegador.
const UNKNOWN = "\u0000desconhecida";

// Sessão atual: undefined = ainda não sabemos (servidor e primeira renderização),
// null = ninguém entrou, Session = conta logada (com o perfil).
export function useSession(): Session | null | undefined {
  const current = useSyncExternalStore(subscribe, snapshot, () => UNKNOWN);
  return useMemo(() => (current === UNKNOWN ? undefined : getSession()), [current]);
}
