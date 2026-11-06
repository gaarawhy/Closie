"use client";

import { useCallback, useEffect, useState } from "react";
import type { FeedGroup } from "@/lib/stories";

// Abre/fecha o leitor e o põe no histórico: o "voltar" do celular/navegador fecha o leitor,
// em vez de sair da página.
export function useViewerState() {
  const [viewer, setViewer] = useState<{ groups: FeedGroup[]; start: number } | null>(null);

  const open = useCallback((groups: FeedGroup[], start: number) => {
    if (groups.length === 0) return;
    // O Next mantém o estado interno dele junto (pushState nativo é suportado)
    window.history.pushState({ ...window.history.state, closieStories: true }, "");
    setViewer({ groups, start });
  }, []);

  useEffect(() => {
    if (!viewer) return;
    const onPop = () => setViewer(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [viewer]);

  const close = useCallback(() => {
    if (window.history.state?.closieStories) window.history.back();
    else setViewer(null);
  }, []);

  return { viewer, open, close };
}
