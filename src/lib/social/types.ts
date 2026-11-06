import type { ProfilePrivacy } from "@/lib/profile";

// Pessoa como os stories enxergam: conta local ou pessoa extra (testes, demonstração).
export type Person = {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  privacy: ProfilePrivacy;
  bio?: string | null;
};

// Denúncia de um perfil (uma por pessoa denunciando); a moderação de verdade vem com o backend
export type UserReport = { reporterId: string; targetId: string; reason: string; createdAt: string };

// Como quem está vendo se relaciona com o dono do perfil
export type Relationship = "self" | "following" | "requested" | "none" | "blocked" | "blocked_by";

export type FollowStatus = "pending" | "approved";

export type Follow = {
  followerId: string;
  followingId: string;
  status: FollowStatus;
  createdAt: string;
  // Só em pedido que ficou pendente e foi aceito depois (perfil privado)
  approvedAt?: string;
};

export type Block = { blockerId: string; blockedId: string; createdAt: string };

export type Mute = { userId: string; mutedId: string; createdAt: string };

export type SocialState = {
  people: Person[];
  follows: Follow[];
  // Dono → ids escolhidos como amigos próximos
  closeFriends: Record<string, string[]>;
  blocks: Block[];
  mutes: Mute[];
  reports: UserReport[];
};

// "self": seguir a si mesmo; "blocked": há bloqueio entre as duas pessoas
export type FollowResult = "approved" | "pending" | "blocked" | "self";
