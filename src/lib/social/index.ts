// Pessoas e relações (seguir, amigos próximos, bloquear, silenciar). Para usar uma API,
// troque storage.ts (ou graph.ts/directory.ts) mantendo estas assinaturas.
export { addPerson, getPerson, listPeople } from "./directory";
export {
  approveAllPending,
  approveFollow,
  block,
  blockedIds,
  follow,
  followerIds,
  followsInvolving,
  followStatus,
  followingIds,
  getCloseFriends,
  isApprovedFollower,
  isBlockedEitherWay,
  isCloseFriend,
  isMuted,
  mute,
  pendingFollowRequests,
  rejectFollow,
  relationship,
  setCloseFriends,
  unblock,
  unfollow,
  unmute,
} from "./graph";
export { hasReported, reportUser, USER_REPORT_REASONS } from "./reports";
export { normalizeSearch, searchPeople } from "./search";
export { socialSnapshot, subscribeSocial } from "./storage";
export { useSocialSnapshot } from "./useSocial";
export type {
  Block,
  Follow,
  FollowResult,
  FollowStatus,
  Mute,
  Person,
  Relationship,
  SocialState,
  UserReport,
} from "./types";
