import { describe, expect, it } from "vitest";
import {
  checkUsernameFormat,
  isProfilePrivacy,
  suggestUsernames,
  validateBio,
  validateBirthdate,
  validateDisplayName,
  validateUsername,
} from "@/lib/validation";

describe("checkUsernameFormat", () => {
  it("recusa @ reservado", () => {
    expect(checkUsernameFormat("admin")).toMatchObject({ ok: false, problem: "reserved" });
    expect(validateUsername("closie")).toBe("Esse @ não está disponível.");
  });

  it("recusa @ que é nome de página do perfil (senão a página esconderia o perfil)", () => {
    expect(validateUsername("editar")).toBe("Esse @ não está disponível.");
    expect(validateUsername("perfil")).toBe("Esse @ não está disponível.");
    expect(validateUsername("personalizar")).toBe("Esse @ não está disponível.");
  });

  it("não decide se o @ está em uso (isso é do serviço)", () => {
    // "lua" é um @ fictício já usado; o formato dele é válido
    expect(checkUsernameFormat("lua")).toEqual({ ok: true });
  });

  it("mantém as regras de formato", () => {
    expect(checkUsernameFormat(".lua")).toMatchObject({ ok: false, problem: "dots" });
    expect(checkUsernameFormat("lu")).toMatchObject({ ok: false, problem: "short" });
    expect(checkUsernameFormat("joão")).toMatchObject({ ok: false, problem: "chars" });
    expect(checkUsernameFormat("")).toMatchObject({ ok: false, problem: "empty" });
  });
});

describe("suggestUsernames", () => {
  it("parte do nome base e corta no ponto", () => {
    const list = suggestUsernames("marcelo.coronet");
    expect(list).toEqual(expect.arrayContaining(["marcelo.coronet", "marcelo.daily"]));
    expect(list.length).toBeLessThanOrEqual(6);
  });

  it("nunca sugere reservado", () => {
    expect(suggestUsernames("admin")).not.toContain("admin");
  });

  it("não filtra @ em uso (quem filtra é o serviço)", () => {
    expect(suggestUsernames("lua")).toContain("lua");
  });
});

describe("validateDisplayName", () => {
  it("exige nome depois de tirar espaços", () => {
    expect(validateDisplayName("   ")).toBe("Diga como você quer ser chamado.");
  });

  it("aceita até 50 caracteres", () => {
    expect(validateDisplayName("a".repeat(50))).toBeNull();
    expect(validateDisplayName("a".repeat(51))).toBe("O nome pode ter no máximo 50 caracteres.");
  });

  it("conta o tamanho sem os espaços das pontas", () => {
    expect(validateDisplayName(`  ${"a".repeat(50)}  `)).toBeNull();
  });
});

describe("validateBio", () => {
  it("é opcional e vai até 160 caracteres", () => {
    expect(validateBio("")).toBeNull();
    expect(validateBio("a".repeat(160))).toBeNull();
    expect(validateBio("a".repeat(161))).toBe("A bio pode ter no máximo 160 caracteres.");
  });
});

describe("isProfilePrivacy", () => {
  it("aceita só perfil público ou privado", () => {
    expect(isProfilePrivacy("public")).toBe(true);
    expect(isProfilePrivacy("private")).toBe(true);
    // "friends" é visibilidade de dump, não privacidade de perfil
    expect(isProfilePrivacy("friends")).toBe(false);
    expect(isProfilePrivacy(undefined)).toBe(false);
  });
});

describe("validateBirthdate (13+)", () => {
  const today = new Date(2026, 10, 5); // 05/11/2026

  it("aceita quem faz 13 anos hoje", () => {
    expect(validateBirthdate("2013-11-05", today)).toBeNull();
  });

  it("recusa quem faz 13 anos amanhã", () => {
    expect(validateBirthdate("2013-11-06", today)).toMatch(/13 anos/);
  });
});
