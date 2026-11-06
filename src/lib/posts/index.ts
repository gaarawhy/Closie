// Momentos (publicações em álbum): tudo o que as telas usam passa por aqui. Para ligar um
// backend, troque storage.ts mantendo estas assinaturas.
export { canViewPosts } from "./access";
export { POST_CAPTION_MAX, POST_PHOTOS_MAX } from "./constants";
export { seedDemoPosts } from "./demo";
export { groupByMonth, momentDate } from "./format";
export { usePostsSnapshot } from "./hooks";
export { createPost, deletePost, updatePostCaption } from "./publish";
export { countPosts, friendsMoments, getPost, hasLikedPost, listPosts, postLikeCount, togglePostLike } from "./queries";
export type { NewPhoto, Post, PostFailure, PostLike, PostPhoto } from "./types";
