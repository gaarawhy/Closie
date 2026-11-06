"use client";

import { useSyncExternalStore } from "react";
import { postsSnapshot, subscribePosts } from "./storage";

// Muda sempre que algum momento (ou curtida) muda: use como dependência para a tela reconsultar.
export function usePostsSnapshot(): string {
  return useSyncExternalStore(subscribePosts, postsSnapshot, () => "");
}
