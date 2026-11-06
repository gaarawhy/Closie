import { picsum } from "@/lib/mock";
import { addPerson, follow, getPerson, type Person } from "@/lib/social";
import { isExpired } from "./access";
import { publishStory } from "./publish";
import { loadStories } from "./storage";
import type { StoryPrivacy } from "./types";

// MODO DEMONSTRAÇÃO: pessoas e stories de exemplo para o daily não nascer vazio enquanto não
// existe backend. Os horários são sempre relativos ao momento em que são criados (nunca datas
// fixas) e os stories se renovam sozinhos quando expiram. Some quando houver dados de verdade.

type DemoRole = "friend" | "creator" | "requester";

const DEMO_PEOPLE: (Person & { role: DemoRole })[] = [
  // Amigos: perfil público, stories para seguidores (aparecem nas bolinhas depois de seguir)
  { id: "demo-lia", username: "lia.mendes", displayName: "Lia Mendes", privacy: "public", role: "friend", bio: "trilhas, pôr do sol e playlists longas" },
  { id: "demo-teo", username: "teo.rocha", displayName: "Téo Rocha", privacy: "public", role: "friend", bio: "skate de manhã, café o dia todo" },
  { id: "demo-mari", username: "mari.souza", displayName: "Mari Souza", privacy: "public", role: "friend", bio: "lendo, cozinhando e colecionando domingos bons" },
  // Perfis públicos com dumps públicos (aparecem no Descobrir)
  { id: "demo-davi", username: "davi.lopes", displayName: "Davi Lopes", privacy: "public", role: "creator", bio: "subindo montanha pra ver de cima" },
  { id: "demo-bela", username: "bela.costa", displayName: "Bela Costa", privacy: "public", role: "creator", bio: "flores, feiras e cores" },
  { id: "demo-rafa", username: "rafa.lima", displayName: "Rafa Lima", privacy: "public", role: "creator", bio: "show bom é show na grade" },
  { id: "demo-jo", username: "jo.alves", displayName: "Jô Alves", privacy: "public", role: "creator", bio: "a cidade depois das 22h" },
  // Perfil privado que pede para seguir você
  { id: "demo-nina", username: "nina.ferraz", displayName: "Nina Ferraz", privacy: "private", role: "requester", bio: "dois gatos e uma planta que resiste" },
].map((person) => ({ ...person, avatar: picsum(`closie-${person.id}`, 200, 200) })) as (Person & {
  role: DemoRole;
})[];

type DemoStory = { ownerId: string; minutesAgo: number; seed: string; caption?: string; privacy: StoryPrivacy; video?: boolean };

const DEMO_STORIES: DemoStory[] = [
  { ownerId: "demo-lia", minutesAgo: 380, seed: "cafe", caption: "café antes de tudo", privacy: "followers" },
  { ownerId: "demo-lia", minutesAgo: 95, seed: "praia", caption: "fim de tarde", privacy: "followers" },
  { ownerId: "demo-teo", minutesAgo: 30, seed: "skate", privacy: "followers" },
  { ownerId: "demo-mari", minutesAgo: 600, seed: "livros", caption: "lendo de novo", privacy: "public" },
  { ownerId: "demo-mari", minutesAgo: 250, seed: "janela", privacy: "followers" },
  { ownerId: "demo-mari", minutesAgo: 12, seed: "jantar", caption: "jantar com as amigas", privacy: "followers" },
  { ownerId: "demo-davi", minutesAgo: 45, seed: "trilha", caption: "subida da trilha", privacy: "public" },
  { ownerId: "demo-davi", minutesAgo: 20, seed: "cume", caption: "valeu cada passo", privacy: "public" },
  { ownerId: "demo-bela", minutesAgo: 140, seed: "flor", privacy: "public", video: true },
  { ownerId: "demo-bela", minutesAgo: 70, seed: "feira", caption: "feirinha de domingo", privacy: "public" },
  { ownerId: "demo-rafa", minutesAgo: 300, seed: "show", caption: "que show!!", privacy: "public" },
  { ownerId: "demo-jo", minutesAgo: 520, seed: "cidade", privacy: "public" },
  { ownerId: "demo-jo", minutesAgo: 410, seed: "metro", privacy: "public" },
  { ownerId: "demo-jo", minutesAgo: 8, seed: "pordosol", caption: "o céu hoje", privacy: "public" },
  { ownerId: "demo-nina", minutesAgo: 60, seed: "gato", privacy: "followers" },
];

// Vídeo curto de domínio público (CC0) da MDN, para exercitar o leitor com vídeo
const DEMO_VIDEO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

export const isDemoPerson = (id: string) => id.startsWith("demo-");

export function hasDemoNetwork(): boolean {
  return DEMO_PEOPLE.some((person) => getPerson(person.id) !== null);
}

// Republica os stories de quem não tem nenhum no ar. Devolve quantos foram publicados.
export function refreshDemoStories(now = Date.now()): number {
  const state = loadStories();
  let published = 0;
  for (const person of DEMO_PEOPLE) {
    if (!getPerson(person.id)) continue;
    const active = state.stories.some((story) => story.ownerId === person.id && !story.deletedAt && !isExpired(story, now));
    if (active) continue;
    for (const item of DEMO_STORIES.filter((story) => story.ownerId === person.id)) {
      const result = publishStory(
        {
          ownerId: person.id,
          media: item.video
            ? { type: "video", url: DEMO_VIDEO_URL }
            : { type: "image", url: picsum(`closie-story-${item.seed}`, 1080, 1920) },
          caption: item.caption,
          privacy: item.privacy,
        },
        now - item.minutesAgo * 60_000,
      );
      if (result.ok) published += 1;
    }
  }
  return published;
}

// Cria as pessoas de exemplo e os stories delas. Não segue ninguém por você; uma delas
// (perfil privado) pede para seguir você, para dar pra testar aprovar/recusar.
export function seedDemoNetwork(viewerId: string, now = Date.now()): void {
  for (const person of DEMO_PEOPLE) {
    addPerson({
      id: person.id,
      username: person.username,
      displayName: person.displayName,
      avatar: person.avatar,
      privacy: person.privacy,
      bio: person.bio,
    });
  }
  refreshDemoStories(now);
  follow("demo-nina", viewerId, now);
}

// Atalho do estado vazio: segue os amigos de exemplo de uma vez.
export function followDemoFriends(viewerId: string, now = Date.now()): void {
  for (const person of DEMO_PEOPLE.filter((item) => item.role === "friend")) follow(viewerId, person.id, now);
}
