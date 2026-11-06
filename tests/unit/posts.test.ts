import { beforeEach, describe, expect, it, vi } from "vitest";
import { fullStorage, memoryStorage } from "../helpers/storage";

type Social = typeof import("@/lib/social");
type Posts = typeof import("@/lib/posts");
type StoriesDemo = typeof import("@/lib/stories/demo");

let social: Social;
let posts: Posts;
let storiesDemo: StoriesDemo;

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 5, 12, 0, 0);

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", memoryStorage());
  social = await import("@/lib/social");
  posts = await import("@/lib/posts");
  storiesDemo = await import("@/lib/stories/demo");
  for (const [id, privacy] of [
    ["eu", "private"],
    ["ana", "public"],
    ["gui", "private"],
  ] as const) {
    social.addPerson({ id, username: id, displayName: id, avatar: null, privacy });
  }
});

const photo = (n: number) => ({ url: `https://picsum.photos/seed/foto${n}/800/1000`, width: 800, height: 1000 });
const photos = (count: number) => Array.from({ length: count }, (_, index) => photo(index));

function create(ownerId: string, count = 1, when = NOW, caption: string | null = null) {
  const result = posts.createPost({ ownerId, photos: photos(count), caption }, when);
  if (!result.ok) throw new Error(result.message);
  return result.post;
}

describe("momentos (álbuns)", () => {
  it("um momento junta várias fotos e conta como uma publicação só", () => {
    const post = create("ana", 5, NOW, "  fim de semana na praia  ");
    expect(post.photos).toHaveLength(5);
    expect(post.caption).toBe("fim de semana na praia");
    expect(posts.countPosts("ana")).toBe(1);
  });

  it("valida fotos, legenda e dono", () => {
    expect(posts.createPost({ ownerId: "ana", photos: [] }, NOW)).toMatchObject({ ok: false, reason: "invalid" });
    expect(posts.createPost({ ownerId: "ana", photos: photos(11) }, NOW)).toMatchObject({ ok: false, reason: "invalid" });
    expect(
      posts.createPost({ ownerId: "ana", photos: [{ url: "javascript:alert(1)", width: 1, height: 1 }] }, NOW),
    ).toMatchObject({ ok: false, reason: "invalid" });
    expect(posts.createPost({ ownerId: "ana", photos: photos(1), caption: "a".repeat(501) }, NOW)).toMatchObject({
      ok: false,
      reason: "invalid",
    });
    expect(posts.createPost({ ownerId: "ninguem", photos: photos(1) }, NOW)).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("perfil público: todo mundo vê; privado: só quem foi aprovado; bloqueio esconde", () => {
    create("ana");
    create("gui");
    expect(posts.listPosts("eu", "ana")).toHaveLength(1);
    expect(posts.listPosts("eu", "gui")).toEqual([]);
    social.follow("eu", "gui");
    expect(posts.listPosts("eu", "gui")).toEqual([]);
    social.approveFollow("gui", "eu");
    expect(posts.listPosts("eu", "gui")).toHaveLength(1);
    social.block("ana", "eu");
    expect(posts.listPosts("eu", "ana")).toEqual([]);
    expect(posts.listPosts("gui", "gui")).toHaveLength(1);
  });

  it("lista do mais novo para o mais antigo", () => {
    const old = create("ana", 1, NOW - 3 * DAY);
    const recent = create("ana", 1, NOW - DAY);
    expect(posts.listPosts("eu", "ana").map((post) => post.id)).toEqual([recent.id, old.id]);
  });

  it("curtir e descurtir conta certo; quem não pode ver não curte", () => {
    const post = create("ana");
    expect(posts.togglePostLike(post.id, "eu", NOW)).toEqual({ ok: true, liked: true });
    expect(posts.postLikeCount(post.id)).toBe(1);
    expect(posts.hasLikedPost(post.id, "eu")).toBe(true);
    expect(posts.togglePostLike(post.id, "eu", NOW)).toEqual({ ok: true, liked: false });
    expect(posts.postLikeCount(post.id)).toBe(0);
    const locked = create("gui");
    expect(posts.togglePostLike(locked.id, "eu", NOW)).toMatchObject({ ok: false, reason: "forbidden" });
  });

  it("só o dono edita a legenda e exclui; excluir leva as curtidas junto", () => {
    const post = create("ana", 2, NOW, "antes");
    posts.togglePostLike(post.id, "eu", NOW);
    expect(posts.updatePostCaption(post.id, "eu", "invadido", NOW)).toMatchObject({ ok: false, reason: "forbidden" });
    const edited = posts.updatePostCaption(post.id, "ana", "  depois  ", NOW + DAY);
    expect(edited).toMatchObject({ ok: true, post: { caption: "depois", editedAt: new Date(NOW + DAY).toISOString() } });
    expect(posts.updatePostCaption(post.id, "ana", "", NOW)).toMatchObject({ ok: true, post: { caption: null } });
    expect(posts.deletePost(post.id, "eu")).toMatchObject({ ok: false, reason: "forbidden" });
    expect(posts.deletePost(post.id, "ana")).toEqual({ ok: true });
    expect(posts.getPost(post.id)).toBeNull();
    expect(posts.postLikeCount(post.id)).toBe(0);
    expect(posts.countPosts("ana")).toBe(0);
  });

  it("com o armazenamento cheio, não diz que publicou", () => {
    vi.stubGlobal("localStorage", fullStorage());
    expect(posts.createPost({ ownerId: "ana", photos: photos(1) }, NOW)).toMatchObject({ ok: false, reason: "storage" });
  });

  it("álbuns de exemplo: criados uma vez, com bio nos perfis de exemplo", () => {
    storiesDemo.seedDemoNetwork("eu", NOW);
    expect(social.getPerson("demo-mari")?.bio).toBeTruthy();
    const created = posts.seedDemoPosts(NOW);
    expect(created).toBeGreaterThan(0);
    expect(posts.seedDemoPosts(NOW)).toBe(0);
    expect(posts.listPosts("eu", "demo-mari").length).toBeGreaterThan(0);
    // Perfil de exemplo privado: nada aparece para quem não foi aprovado
    expect(posts.countPosts("demo-nina")).toBeGreaterThan(0);
    expect(posts.listPosts("eu", "demo-nina")).toEqual([]);
  });
});

describe("momentos dos amigos (página inicial)", () => {
  it("mostra os seus álbuns e os de quem você segue, do mais novo ao mais antigo", () => {
    social.follow("eu", "ana", NOW);
    social.addPerson({ id: "bia", username: "bia", displayName: "bia", avatar: null, privacy: "public" });
    const daAna = create("ana", 2, NOW - 2 * DAY);
    const meu = create("eu", 1, NOW - DAY);
    create("bia", 1, NOW);
    expect(posts.friendsMoments("eu").map((post) => post.id)).toEqual([meu.id, daAna.id]);
  });

  it("pedido pendente esconde; aprovado mostra; bloquear e silenciar escondem de novo", () => {
    social.follow("eu", "ana", NOW);
    social.follow("eu", "gui", NOW);
    const daAna = create("ana", 1, NOW - DAY);
    const doGui = create("gui", 1, NOW);
    expect(posts.friendsMoments("eu").map((post) => post.id)).toEqual([daAna.id]);
    social.approveFollow("gui", "eu", NOW);
    expect(posts.friendsMoments("eu").map((post) => post.id)).toEqual([doGui.id, daAna.id]);
    social.block("eu", "ana", NOW);
    social.mute("eu", "gui", NOW);
    expect(posts.friendsMoments("eu")).toEqual([]);
  });

  it("traz no máximo o limite pedido", () => {
    social.follow("eu", "ana", NOW);
    for (let index = 0; index < 12; index += 1) create("ana", 1, NOW - index * 60_000);
    expect(posts.friendsMoments("eu")).toHaveLength(8);
    expect(posts.friendsMoments("eu", 20)).toHaveLength(12);
  });
});
