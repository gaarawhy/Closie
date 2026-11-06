import { describe, expect, it } from "vitest";
import { resolveRoute, safeNextPath } from "@/lib/routes";

const loggedOut = { hasSession: false, onboarded: false };
const pending = { hasSession: true, onboarded: false };
const done = { hasSession: true, onboarded: true };

describe("resolveRoute", () => {
  it("área principal: exige sessão e onboarding concluído", () => {
    expect(resolveRoute("/daily", loggedOut)).toBe("/entrar?next=%2Fdaily");
    expect(resolveRoute("/daily", pending)).toBe("/onboarding");
    expect(resolveRoute("/daily", done)).toBeNull();
  });

  it("onboarding: exige sessão e não aparece de novo depois de concluído", () => {
    expect(resolveRoute("/onboarding", loggedOut)).toBe("/entrar?next=%2Fonboarding");
    expect(resolveRoute("/onboarding", pending)).toBeNull();
    expect(resolveRoute("/onboarding", done)).toBe("/daily");
  });

  it("entrar e cadastro: quem já entrou segue para onde deve", () => {
    expect(resolveRoute("/entrar", loggedOut)).toBeNull();
    expect(resolveRoute("/cadastro", loggedOut)).toBeNull();
    expect(resolveRoute("/cadastro", pending)).toBe("/onboarding");
    expect(resolveRoute("/entrar", done)).toBe("/daily");
    expect(resolveRoute("/entrar", done, "/daily")).toBe("/daily");
    // Onboarding pela metade vem antes de qualquer "next"
    expect(resolveRoute("/entrar", pending, "/daily")).toBe("/onboarding");
  });

  it("depois de sair (sessão encerrada nesta página), vai para entrar sem 'next'", () => {
    const ended = { hasSession: false, onboarded: false, sessionEnded: true };
    expect(resolveRoute("/daily", ended)).toBe("/entrar");
    expect(resolveRoute("/onboarding", ended)).toBe("/entrar");
    // Entrar e cadastro continuam abertos
    expect(resolveRoute("/entrar", ended)).toBeNull();
  });

  it("raiz manda para o lugar certo", () => {
    expect(resolveRoute("/", loggedOut)).toBe("/entrar");
    expect(resolveRoute("/", pending)).toBe("/onboarding");
    expect(resolveRoute("/", done)).toBe("/daily");
  });

  it("páginas abertas não redirecionam", () => {
    expect(resolveRoute("/termos", done)).toBeNull();
    expect(resolveRoute("/privacidade", loggedOut)).toBeNull();
    // Prefixo parecido não é a mesma rota
    expect(resolveRoute("/dailyx", loggedOut)).toBeNull();
  });
});

describe("safeNextPath", () => {
  it("aceita caminho interno", () => {
    expect(safeNextPath("/onboarding")).toBe("/onboarding");
    expect(safeNextPath("/daily?aba=hoje")).toBe("/daily?aba=hoje");
  });

  it("ignora destino externo ou malformado", () => {
    for (const bad of ["//site.com", "https://site.com", "/\\site.com", "daily", "", null, undefined]) {
      expect(safeNextPath(bad)).toBe("/daily");
    }
  });

  it("ignora voltar para entrar ou cadastro (evita laço)", () => {
    expect(safeNextPath("/entrar")).toBe("/daily");
    expect(safeNextPath("/cadastro?x=1")).toBe("/daily");
  });
});
