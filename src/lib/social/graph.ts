import { getPerson } from "./directory";
import { loadSocial, updateSocial } from "./storage";
import type { Follow, FollowResult, FollowStatus, Relationship } from "./types";

// Regras das relações entre pessoas: seguir (com aprovação para perfil privado), amigos
// próximos, bloquear e silenciar. Toda função lê o estado salvo na hora (nada em cache).

export function isBlockedEitherWay(a: string, b: string): boolean {
  return loadSocial().blocks.some(
    (item) => (item.blockerId === a && item.blockedId === b) || (item.blockerId === b && item.blockedId === a),
  );
}

export function blockedIds(userId: string): string[] {
  return loadSocial()
    .blocks.filter((item) => item.blockerId === userId)
    .map((item) => item.blockedId);
}

// Perfil público aprova na hora; perfil privado (ou pessoa desconhecida) fica pendente.
export function follow(followerId: string, targetId: string, now = Date.now()): FollowResult {
  if (followerId === targetId) return "self";
  if (isBlockedEitherWay(followerId, targetId)) return "blocked";
  const existing = loadSocial().follows.find(
    (item) => item.followerId === followerId && item.followingId === targetId,
  );
  if (existing) return existing.status;
  const status = getPerson(targetId)?.privacy === "public" ? "approved" : "pending";
  updateSocial((state) => ({
    ...state,
    follows: [
      ...state.follows,
      { followerId, followingId: targetId, status, createdAt: new Date(now).toISOString() },
    ],
  }));
  return status;
}

export function approveFollow(ownerId: string, followerId: string, now = Date.now()): boolean {
  const pending = loadSocial().follows.some(
    (item) => item.followerId === followerId && item.followingId === ownerId && item.status === "pending",
  );
  if (!pending) return false;
  updateSocial((state) => ({
    ...state,
    follows: state.follows.map((item) =>
      item.followerId === followerId && item.followingId === ownerId
        ? { ...item, status: "approved", approvedAt: new Date(now).toISOString() }
        : item,
    ),
  }));
  return true;
}

// O perfil virou público: todo pedido pendente vira seguidor (como seguir um perfil público).
// Devolve quantos foram aceitos.
export function approveAllPending(ownerId: string, now = Date.now()): number {
  const pending = loadSocial().follows.filter((item) => item.followingId === ownerId && item.status === "pending").length;
  if (pending === 0) return 0;
  updateSocial((state) => ({
    ...state,
    follows: state.follows.map((item) =>
      item.followingId === ownerId && item.status === "pending"
        ? { ...item, status: "approved", approvedAt: new Date(now).toISOString() }
        : item,
    ),
  }));
  return pending;
}

// Para a página de perfil: você mesmo, seguindo, pedido enviado, nada, ou bloqueio (de quem).
export function relationship(viewerId: string, ownerId: string): Relationship {
  if (viewerId === ownerId) return "self";
  const { blocks, follows } = loadSocial();
  if (blocks.some((item) => item.blockerId === viewerId && item.blockedId === ownerId)) return "blocked";
  if (blocks.some((item) => item.blockerId === ownerId && item.blockedId === viewerId)) return "blocked_by";
  const found = follows.find((item) => item.followerId === viewerId && item.followingId === ownerId);
  if (!found) return "none";
  return found.status === "approved" ? "following" : "requested";
}

export function rejectFollow(ownerId: string, followerId: string): boolean {
  const pending = loadSocial().follows.some(
    (item) => item.followerId === followerId && item.followingId === ownerId && item.status === "pending",
  );
  if (!pending) return false;
  updateSocial((state) => ({
    ...state,
    follows: state.follows.filter((item) => !(item.followerId === followerId && item.followingId === ownerId)),
  }));
  return true;
}

export function unfollow(followerId: string, targetId: string): void {
  updateSocial((state) => ({
    ...state,
    follows: state.follows.filter((item) => !(item.followerId === followerId && item.followingId === targetId)),
  }));
}

// Pedidos esperando o dono aprovar, do mais antigo para o mais novo.
export function pendingFollowRequests(ownerId: string): string[] {
  return loadSocial()
    .follows.filter((item) => item.followingId === ownerId && item.status === "pending")
    .sort((x, y) => x.createdAt.localeCompare(y.createdAt))
    .map((item) => item.followerId);
}

// Quem a pessoa segue de fato (só aprovados).
export function followingIds(viewerId: string): string[] {
  return loadSocial()
    .follows.filter((item) => item.followerId === viewerId && item.status === "approved")
    .map((item) => item.followingId);
}

// Quem segue a pessoa de fato (só aprovados).
export function followerIds(ownerId: string): string[] {
  return loadSocial()
    .follows.filter((item) => item.followingId === ownerId && item.status === "approved")
    .map((item) => item.followerId);
}

// Para as notificações: pedidos e relações que envolvem a pessoa (nos dois sentidos), com as datas.
export function followsInvolving(userId: string): Follow[] {
  return loadSocial().follows.filter((item) => item.followerId === userId || item.followingId === userId);
}

// "approved", "pending" (pedido esperando o dono) ou null (não segue)
export function followStatus(followerId: string, targetId: string): FollowStatus | null {
  const found = loadSocial().follows.find((item) => item.followerId === followerId && item.followingId === targetId);
  return found ? found.status : null;
}

export function isApprovedFollower(viewerId: string, ownerId: string): boolean {
  return loadSocial().follows.some(
    (item) => item.followerId === viewerId && item.followingId === ownerId && item.status === "approved",
  );
}

export function setCloseFriends(ownerId: string, ids: string[]): void {
  const unique = [...new Set(ids)].filter((id) => id !== ownerId);
  updateSocial((state) => ({ ...state, closeFriends: { ...state.closeFriends, [ownerId]: unique } }));
}

export function getCloseFriends(ownerId: string): string[] {
  return loadSocial().closeFriends[ownerId] ?? [];
}

export function isCloseFriend(viewerId: string, ownerId: string): boolean {
  return getCloseFriends(ownerId).includes(viewerId);
}

// Bloquear desfaz o seguir nos dois sentidos; a outra pessoa não consegue seguir de novo.
export function block(blockerId: string, blockedId: string, now = Date.now()): void {
  if (blockerId === blockedId) return;
  updateSocial((state) => ({
    ...state,
    follows: state.follows.filter(
      (item) =>
        !(item.followerId === blockerId && item.followingId === blockedId) &&
        !(item.followerId === blockedId && item.followingId === blockerId),
    ),
    blocks: state.blocks.some((item) => item.blockerId === blockerId && item.blockedId === blockedId)
      ? state.blocks
      : [...state.blocks, { blockerId, blockedId, createdAt: new Date(now).toISOString() }],
  }));
}

export function unblock(blockerId: string, blockedId: string): void {
  updateSocial((state) => ({
    ...state,
    blocks: state.blocks.filter((item) => !(item.blockerId === blockerId && item.blockedId === blockedId)),
  }));
}

// Silenciar só tira os stories da pessoa do feed de quem silenciou; ela não fica sabendo.
export function mute(userId: string, targetId: string, now = Date.now()): void {
  if (userId === targetId || isMuted(userId, targetId)) return;
  updateSocial((state) => ({
    ...state,
    mutes: [...state.mutes, { userId, mutedId: targetId, createdAt: new Date(now).toISOString() }],
  }));
}

export function unmute(userId: string, targetId: string): void {
  updateSocial((state) => ({
    ...state,
    mutes: state.mutes.filter((item) => !(item.userId === userId && item.mutedId === targetId)),
  }));
}

export function isMuted(userId: string, targetId: string): boolean {
  return loadSocial().mutes.some((item) => item.userId === userId && item.mutedId === targetId);
}
