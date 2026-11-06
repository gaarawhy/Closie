"use client";

import { useSyncExternalStore } from "react";
import { socialSnapshot, subscribeSocial } from "./storage";

// Muda sempre que as relações mudam (seguir, bloquear, silenciar…): use como dependência para
// a tela reconsultar. No servidor, "".
export function useSocialSnapshot(): string {
  return useSyncExternalStore(subscribeSocial, socialSnapshot, () => "");
}
