// Formato dos dados de stories. Quando existir backend, a API deve devolver estes mesmos campos.

export type StoryMediaType = "image" | "video";

export type StoryMedia = {
  type: StoryMediaType;
  // https:/http: ou data: (blob: não sobrevive a recarregar a página)
  url: string;
};

// public: qualquer pessoa (respeitando o perfil); followers: seguidores aprovados;
// close_friends: só a lista de amigos próximos do dono
export type StoryPrivacy = "public" | "followers" | "close_friends";

export type Story = {
  id: string;
  ownerId: string;
  media: StoryMedia;
  caption: string | null;
  privacy: StoryPrivacy;
  createdAt: string; // ISO
  expiresAt: string; // ISO = createdAt + 24 h
  deletedAt: string | null; // ISO; excluído pelo dono antes de expirar (ou do histórico)
};

// Uma por pessoa por story (a primeira vez que viu)
export type StoryView = { storyId: string; viewerId: string; viewedAt: string };

export type StoryReply = { id: string; storyId: string; fromId: string; text: string; createdAt: string };

export type StoryLike = { storyId: string; userId: string; createdAt: string };

export type StoryReaction = { storyId: string; userId: string; emoji: string; createdAt: string };

export type StoryShare = { id: string; storyId: string; fromId: string; toId: string; createdAt: string };

export type StoryReport = { storyId: string; reporterId: string; reason: string; createdAt: string };

export type StoriesState = {
  stories: Story[];
  views: StoryView[];
  replies: StoryReply[];
  likes: StoryLike[];
  reactions: StoryReaction[];
  shares: StoryShare[];
  reports: StoryReport[];
};

// Por que um story não pode ser visto agora
export type Unavailable = "deleted" | "expired" | "blocked" | "forbidden";

export type PublishFailure = "invalid_media" | "invalid_caption" | "invalid_privacy" | "no_owner" | "storage";

export type PublishResult = { ok: true; story: Story } | { ok: false; reason: PublishFailure; message: string };
