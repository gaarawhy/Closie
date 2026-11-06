"use client";

import { useMemo, useSyncExternalStore } from "react";
import { appearanceSnapshot, loadAppearance, subscribeAppearance } from "./storage";
import type { ProfileAppearance } from "./types";

// A personalização salva de alguém (null = visual original); muda quando alguém salva.
export function useSavedAppearance(userId: string | null): ProfileAppearance | null {
  const snapshot = useSyncExternalStore(subscribeAppearance, appearanceSnapshot, () => "");
  return useMemo(() => {
    void snapshot;
    return userId ? loadAppearance(userId) : null;
  }, [snapshot, userId]);
}
