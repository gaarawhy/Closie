"use client";

import { useEffect, useRef, useState } from "react";
import { checkUsernamesAvailable } from "@/lib/account";
import { checkUsernameFormat, suggestUsernames } from "@/lib/validation";

export type Availability = "idle" | "checking" | "available" | "taken" | "error";

const DEBOUNCE_MS = 300;

// Simula a consulta de disponibilidade do @ enquanto a pessoa digita: espera a pessoa parar
// de digitar, consulta e ignora respostas que chegam atrasadas (de um @ já trocado).
// Formato inválido é calculado na renderização (sem efeito): não há consulta a fazer.
export function useUsernameAvailability(username: string): Availability {
  const [status, setStatus] = useState<Availability>("idle");
  const requestId = useRef(0);
  const formatOk = checkUsernameFormat(username).ok;

  useEffect(() => {
    if (!formatOk) return;
    requestId.current += 1;
    const id = requestId.current;
    // Padrão de busca cancelável com debounce (o próprio guia do React usa este formato:
    // https://react.dev/learn/you-might-not-need-an-effect#fetching-data): o "checking" imediato
    // é o indicador de carregamento, cancelado pelo cleanup se o @ mudar de novo antes de 300ms.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("checking");
    const timer = setTimeout(() => {
      checkUsernamesAvailable([username])
        .then((free) => {
          if (requestId.current === id) setStatus(free.includes(username) ? "available" : "taken");
        })
        .catch(() => {
          if (requestId.current === id) setStatus("error");
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [username, formatOk]);

  return formatOk ? status : "idle";
}

// Até 3 sugestões de @ livres a partir de um nome base (email ou @ já escolhido).
// `enabled` liga a busca só quando faz sentido mostrar sugestões (campo vazio, ou @ ocupado).
// Candidatos são calculados na renderização; o efeito só faz a consulta (trabalho assíncrono de verdade).
export function useAvailableSuggestions(base: string, enabled: boolean): string[] {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const requestId = useRef(0);
  const candidates = enabled ? suggestUsernames(base) : [];
  const key = candidates.join("\u0000");

  useEffect(() => {
    if (candidates.length === 0) return;
    requestId.current += 1;
    const id = requestId.current;
    checkUsernamesAvailable(candidates)
      .then((free) => {
        if (requestId.current === id) setSuggestions(free.slice(0, 3));
      })
      .catch(() => {
        if (requestId.current === id) setSuggestions([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` resume o conteúdo de `candidates`
  }, [key]);

  return candidates.length > 0 ? suggestions : [];
}
