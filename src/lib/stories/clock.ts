"use client";

import { useSyncExternalStore } from "react";

// Relógio compartilhado para as telas reconsultarem (stories que expiram somem sozinhos da tela).
// As regras nunca dependem dele: toda consulta recebe o `now` na hora.

type ClockStore = {
  now: number;
  listeners: Set<() => void>;
  timer: ReturnType<typeof setInterval> | null;
  // Criadas uma vez por intervalo: o React precisa da MESMA função de inscrição entre
  // renderizações, senão se reinscreve a cada render (e a hora muda a cada inscrição → laço).
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => number;
};

const stores = new Map<number, ClockStore>();

function createStore(intervalMs: number): ClockStore {
  const store = { now: Date.now(), listeners: new Set<() => void>(), timer: null } as ClockStore;
  const refresh = () => {
    store.now = Date.now();
    for (const listener of store.listeners) listener();
  };
  // Ao voltar para a aba, atualiza na hora (o intervalo pode ter ficado parado em segundo plano)
  const onVisible = () => {
    if (!document.hidden) refresh();
  };
  store.subscribe = (onChange) => {
    store.listeners.add(onChange);
    if (store.listeners.size === 1) {
      store.now = Date.now();
      store.timer = setInterval(refresh, intervalMs);
      document.addEventListener("visibilitychange", onVisible);
    }
    return () => {
      store.listeners.delete(onChange);
      if (store.listeners.size === 0) {
        if (store.timer) clearInterval(store.timer);
        store.timer = null;
        document.removeEventListener("visibilitychange", onVisible);
      }
    };
  };
  store.getSnapshot = () => store.now;
  return store;
}

// Um relógio por intervalo, compartilhado por todos os componentes que usam o mesmo intervalo.
export function clockStore(intervalMs: number): ClockStore {
  let store = stores.get(intervalMs);
  if (!store) {
    store = createStore(intervalMs);
    stores.set(intervalMs, store);
  }
  return store;
}

const serverSnapshot = () => 0;

// Horário atual, renovado a cada `intervalMs` e ao voltar para a aba. No servidor, 0.
export function useNow(intervalMs: number): number {
  const store = clockStore(intervalMs);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, serverSnapshot);
}
