"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useSession } from "@/lib/account";
import { useSocialSnapshot } from "@/lib/social";
import { useStoriesSnapshot } from "@/lib/stories";
import { buildNotifications, countUnread } from "./build";
import { getLastSeen, seenSnapshot, subscribeSeen } from "./seen";
import type { NotificationItem } from "./types";

// Notificações da pessoa logada; reconsulta quando relações, stories ou a "última visita" mudam.
export function useNotifications(): { items: NotificationItem[]; lastSeen: string | null; unread: number } {
  const session = useSession();
  const social = useSocialSnapshot();
  const stories = useStoriesSnapshot();
  const seen = useSyncExternalStore(subscribeSeen, seenSnapshot, () => "");
  return useMemo(() => {
    // Entram nas dependências como sinal de mudança; a consulta lê o storage atual
    void social;
    void stories;
    void seen;
    if (!session) return { items: [], lastSeen: null, unread: 0 };
    const items = buildNotifications(session.id);
    const lastSeen = getLastSeen(session.id);
    return { items, lastSeen, unread: countUnread(items, lastSeen) };
  }, [session, social, stories, seen]);
}
