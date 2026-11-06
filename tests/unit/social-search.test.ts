import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryStorage } from "../helpers/storage";

type Social = typeof import("@/lib/social");
let social: Social;

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", memoryStorage());
  social = await import("@/lib/social");
  for (const [id, username, displayName] of [
    ["eu", "eu.mesmo", "Eu Mesmo"],
    ["jo", "jo.alves", "Jô Alves"],
    ["joana", "joana", "Joana Prado"],
    ["joanabr", "joana.br", "Joana Brito"],
    ["bia", "bia", "Bia Jota"],
    ["caio", "caio", "Caio Reis"],
  ] as const) {
    social.addPerson({ id, username, displayName, avatar: null, privacy: "public" });
  }
});

const ids = (people: { id: string }[]) => people.map((person) => person.id);

describe("pesquisar pessoas", () => {
  it("acha pelo começo do @ sem ligar para acento, maiúscula ou o @ na frente; nome vem depois", () => {
    expect(ids(social.searchPeople("eu", "@JÔ"))).toEqual(["jo", "joana", "joanabr", "bia"]);
  });

  it("acha pelo nome, inclusive pelo sobrenome", () => {
    expect(ids(social.searchPeople("eu", "alves"))).toEqual(["jo"]);
    expect(ids(social.searchPeople("eu", "joana p"))).toEqual(["joana"]);
  });

  it("o @ exato vem antes de quem só começa igual", () => {
    expect(ids(social.searchPeople("eu", "joana"))).toEqual(["joana", "joanabr"]);
  });

  it("não mostra quem está bloqueado, em nenhum dos sentidos", () => {
    social.block("eu", "bia");
    social.block("caio", "eu");
    expect(social.searchPeople("eu", "bia")).toEqual([]);
    expect(social.searchPeople("eu", "caio")).toEqual([]);
  });

  it("termo vazio não busca nada", () => {
    expect(social.searchPeople("eu", "")).toEqual([]);
    expect(social.searchPeople("eu", "   ")).toEqual([]);
    expect(social.searchPeople("eu", "@")).toEqual([]);
  });

  it("respeita o limite e acha a própria conta", () => {
    expect(social.searchPeople("eu", "jo", 2)).toHaveLength(2);
    expect(ids(social.searchPeople("eu", "eu.mesmo"))).toEqual(["eu"]);
  });
});
