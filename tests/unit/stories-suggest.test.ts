import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryStorage } from "../helpers/storage";

type Social = typeof import("@/lib/social");
type Suggest = typeof import("@/lib/stories/suggest");
type Publish = typeof import("@/lib/stories/publish");

let social: Social;
let suggest: Suggest;
let publish: Publish;

const H = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 5, 12, 0, 0);

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", memoryStorage());
  social = await import("@/lib/social");
  publish = await import("@/lib/stories/publish");
  suggest = await import("@/lib/stories/suggest");
  for (const [id, privacy] of [
    ["eu", "private"],
    ["ana", "public"],
    ["bia", "public"],
    ["lia", "public"],
    ["caio", "public"],
    ["duda", "public"],
    ["eva", "public"],
    ["fe", "private"],
    ["gui", "private"],
  ] as const) {
    social.addPerson({ id, username: id, displayName: id, avatar: null, privacy });
  }
});

describe("sugestões de quem seguir", () => {
  it("quem segue você vem primeiro, depois quem seus amigos seguem, depois quem postou hoje", () => {
    social.follow("ana", "eu", NOW);
    social.approveFollow("eu", "ana", NOW);
    social.follow("eu", "lia", NOW);
    social.follow("lia", "bia", NOW);
    publish.publishStory({ ownerId: "caio", media: { type: "image", url: "https://picsum.photos/1080/1920" }, privacy: "public" }, NOW - H);
    const list = suggest.suggestPeople("eu", NOW, 10);
    expect(list.map((item) => [item.person.id, item.reason])).toEqual([
      ["ana", "follows_you"],
      ["bia", "followed_by"],
      ["caio", "posted_today"],
      ["duda", "new"],
      ["eva", "new"],
      ["fe", "new"],
      ["gui", "new"],
    ]);
    expect(list[1].via?.id).toBe("lia");
  });

  it("deixa de fora você, quem você já segue, pedido já enviado e bloqueados", () => {
    social.follow("eu", "lia", NOW);
    social.follow("eu", "fe", NOW); // perfil privado: pedido pendente
    social.block("eu", "eva");
    social.block("duda", "eu");
    expect(suggest.suggestPeople("eu", NOW, 10).map((item) => item.person.id)).toEqual(["ana", "bia", "caio", "gui"]);
  });

  it("respeita o limite", () => {
    expect(suggest.suggestPeople("eu", NOW, 2)).toHaveLength(2);
  });
});
