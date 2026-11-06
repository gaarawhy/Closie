import { picsum } from "@/lib/mock";
import { getPerson } from "@/lib/social";
import { createPost } from "./publish";
import { loadPosts } from "./storage";
import { togglePostLike } from "./queries";

// MODO DEMONSTRAÇÃO: álbuns dos perfis de exemplo, para os perfis não nascerem vazios.
// Datas relativas ao momento em que são criados. Some quando houver dados de verdade.

const DAY = 24 * 60 * 60 * 1000;

type DemoPhoto = [seed: string, width: number, height: number];

const DEMO_POSTS: { ownerId: string; daysAgo: number; caption: string | null; photos: DemoPhoto[]; likedBy: string[] }[] = [
  {
    ownerId: "demo-mari",
    daysAgo: 2,
    caption: "domingo de feira, livro novo e café na calçada",
    photos: [["mari-feira", 800, 1000], ["mari-livro", 800, 800], ["mari-cafe", 800, 1000], ["mari-flores", 1000, 750], ["mari-rua", 800, 1000]],
    likedBy: ["demo-lia", "demo-teo", "demo-davi"],
  },
  {
    ownerId: "demo-mari",
    daysAgo: 11,
    caption: "jantar de aniversário com as amigas",
    photos: [["mari-jantar", 800, 1000], ["mari-bolo", 800, 800], ["mari-mesa", 1000, 750]],
    likedBy: ["demo-lia"],
  },
  {
    ownerId: "demo-mari",
    daysAgo: 44,
    caption: "Paraty em quatro fotos",
    photos: [["mari-paraty", 1000, 750], ["mari-barco", 800, 1000], ["mari-praia", 800, 800], ["mari-ceu", 800, 1000]],
    likedBy: ["demo-teo", "demo-bela"],
  },
  {
    ownerId: "demo-lia",
    daysAgo: 1,
    caption: "pôr do sol de quinta",
    photos: [["lia-por-do-sol", 800, 1000]],
    likedBy: ["demo-mari"],
  },
  {
    ownerId: "demo-lia",
    daysAgo: 23,
    caption: "trilha com a turma",
    photos: [["lia-trilha", 800, 1000], ["lia-mata", 1000, 750], ["lia-cachoeira", 800, 1000]],
    likedBy: ["demo-davi", "demo-mari"],
  },
  { ownerId: "demo-teo", daysAgo: 5, caption: "pista nova no bairro", photos: [["teo-pista", 1000, 750], ["teo-manobra", 800, 1000]], likedBy: ["demo-rafa"] },
  {
    ownerId: "demo-davi",
    daysAgo: 3,
    caption: "subida até o cume, valeu cada passo",
    photos: [["davi-cume", 800, 1000], ["davi-trilha", 800, 800], ["davi-mochila", 800, 1000], ["davi-vale", 1000, 750], ["davi-nuvens", 800, 1000], ["davi-topo", 800, 800]],
    likedBy: ["demo-lia", "demo-jo"],
  },
  { ownerId: "demo-davi", daysAgo: 62, caption: null, photos: [["davi-acampamento", 1000, 750]], likedBy: [] },
  { ownerId: "demo-bela", daysAgo: 4, caption: "flores da semana", photos: [["bela-flor", 800, 1000], ["bela-vaso", 800, 800], ["bela-jardim", 800, 1000]], likedBy: ["demo-mari"] },
  { ownerId: "demo-rafa", daysAgo: 7, caption: "show inesquecível", photos: [["rafa-show", 1000, 750], ["rafa-palco", 800, 1000], ["rafa-luzes", 800, 800], ["rafa-galera", 800, 1000]], likedBy: ["demo-teo"] },
  { ownerId: "demo-jo", daysAgo: 2, caption: "a cidade à noite", photos: [["jo-cidade", 800, 1000], ["jo-neon", 800, 800], ["jo-ponte", 1000, 750], ["jo-metro", 800, 1000], ["jo-chuva", 800, 1000]], likedBy: ["demo-davi"] },
  { ownerId: "demo-jo", daysAgo: 35, caption: "café, chuva e metrô", photos: [["jo-cafe", 800, 800], ["jo-guarda-chuva", 800, 1000]], likedBy: [] },
  { ownerId: "demo-nina", daysAgo: 6, caption: "os gatinhos da casa", photos: [["nina-gato", 800, 1000], ["nina-gatos", 800, 800], ["nina-sofa", 1000, 750]], likedBy: [] },
];

// Cria os álbuns de exemplo uma vez (só para quem existe no diretório). Devolve quantos criou.
export function seedDemoPosts(now = Date.now()): number {
  const owners = new Set(DEMO_POSTS.map((item) => item.ownerId));
  if (loadPosts().posts.some((post) => owners.has(post.ownerId))) return 0;
  let created = 0;
  for (const item of DEMO_POSTS) {
    if (!getPerson(item.ownerId)) continue;
    const result = createPost(
      {
        ownerId: item.ownerId,
        caption: item.caption,
        photos: item.photos.map(([seed, width, height]) => ({ url: picsum(`closie-momento-${seed}`, width, height), width, height })),
      },
      now - item.daysAgo * DAY,
    );
    if (!result.ok) continue;
    created += 1;
    for (const likerId of item.likedBy) {
      if (getPerson(likerId)) togglePostLike(result.post.id, likerId, now - item.daysAgo * DAY + 60_000);
    }
  }
  return created;
}
