// Stories: tudo o que a futura tela usa passa por aqui. Para ligar um backend, troque
// storage.ts (e src/lib/social/storage.ts) mantendo estas assinaturas.
export { canViewStory, getStory, isExpired, unavailableReason } from "./access";
export {
  CAPTION_MAX,
  DEFAULT_STORY_PRIVACY,
  IMAGE_DURATION_MS,
  REPLY_MAX,
  REPORT_REASONS,
  STORY_PRIVACY_OPTIONS,
  STORY_REACTIONS,
  STORY_TTL_MS,
  VIDEO_FALLBACK_MS,
  VIDEO_MAX_MS,
  VIDEO_MIN_MS,
} from "./constants";
export { useNow } from "./clock";
export { followDemoFriends, hasDemoNetwork, isDemoPerson, refreshDemoStories, seedDemoNetwork } from "./demo";
export { buildDiscoverFeed, buildPersonGroup, buildStoriesFeed, getMyActiveStories, getMyExpiredStories } from "./feed";
export { timeAgo, timeLeft } from "./format";
export type { FeedGroup, FeedGroupStatus, StoriesFeed } from "./feed";
export { useDiscoverFeed, useMyStories, useStoriesFeed, useStoriesSnapshot, useStoryViewer } from "./hooks";
export {
  activityOnStories,
  getStoryLikes,
  getStoryReplies,
  hasLiked,
  replyToStory,
  reportStory,
  sendStoryReaction,
  shareStory,
  toggleStoryLike,
} from "./interactions";
export type { InteractionFailure } from "./interactions";
export { deleteStory, publishStory, updateStoryPrivacy } from "./publish";
export { suggestPeople } from "./suggest";
export type { Suggestion, SuggestionReason } from "./suggest";
export type {
  PublishFailure,
  PublishResult,
  Story,
  StoryMedia,
  StoryMediaType,
  StoryLike,
  StoryPrivacy,
  StoryReaction,
  StoryReply,
  Unavailable,
} from "./types";
export { createViewer, currentStoryId, durationFor, segmentProgress, viewerReducer } from "./viewer";
export type { ViewerAction, ViewerGroupRef, ViewerState, ViewerStatus } from "./viewer";
export { getStoryViewers, hasViewed, markStoryViewed } from "./views";
