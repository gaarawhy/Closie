// Formato dos momentos (publicações). Um momento é um álbum: várias fotos contam como UMA
// publicação. Quando existir backend, a API deve devolver estes mesmos campos.

export type PostPhoto = {
  id: string;
  // https: ou data: (blob: não sobrevive a recarregar a página)
  url: string;
  // Tamanho original: monta o mosaico do perfil sem esperar a foto carregar
  width: number;
  height: number;
};

export type Post = {
  id: string;
  ownerId: string;
  // Na ordem do álbum; a primeira é a capa
  photos: PostPhoto[];
  caption: string | null;
  createdAt: string; // ISO
  editedAt: string | null; // ISO da última edição de legenda
};

export type PostLike = { postId: string; userId: string; createdAt: string };

export type PostsState = { posts: Post[]; likes: PostLike[] };

// Foto pronta para publicar (já reduzida, com o tamanho)
export type NewPhoto = { url: string; width: number; height: number };

export type PostFailure = {
  ok: false;
  // "storage": o navegador não conseguiu salvar (armazenamento cheio) — nada foi registrado
  reason: "not_found" | "forbidden" | "invalid" | "storage";
  message: string;
};
