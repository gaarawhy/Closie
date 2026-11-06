import { getPerson, isApprovedFollower, isBlockedEitherWay } from "@/lib/social";

// Quem vê os momentos (e as listas de seguidores/seguindo) de um perfil: o dono sempre;
// perfil público, qualquer pessoa; perfil privado, só seguidores aprovados. Bloqueio esconde tudo.
export function canViewPosts(viewerId: string, ownerId: string): boolean {
  if (viewerId === ownerId) return true;
  if (isBlockedEitherWay(viewerId, ownerId)) return false;
  const owner = getPerson(ownerId);
  if (!owner) return false;
  return owner.privacy === "public" || isApprovedFollower(viewerId, ownerId);
}
