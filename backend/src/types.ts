export type EvalResult = "correct" | "partial" | "incorrect";

export interface EvaluationFeedback {
  grammar: string[];
  wording: string[];
  naturalness: string[];
  register: string[];
}

export interface EvaluationResponse {
  score: number; // 0-100
  result: EvalResult;
  feedback: EvaluationFeedback;
  suggestions: string[];
  nextHint?: string;
}

export interface ApiResponse<T = unknown> {
  statusCode: number;
  headers?: Record<string, string>;
  body: string; // JSON
}

export interface SessionStartResponse {
  sessionId: string;
  uploadUrl: string;
}

export interface CardItem {
  cardId: string;
  type: "phrasal" | "structure" | "vocab";
  prompt: string;
  answers: string[];
  hints: string[];
  examples: string[];
  tags: string[];
  difficulty: "B1" | "B1+" | "B2";
}

export interface StoryRequirement {
  requirementId: string;
  text: string;
}

export interface StoryMission {
  missionId: string;
  title: string;
  sceneSummary?: string;
  aiRole: string;
  aiRoleFriends?: string;
  caracterName?: string;
  caracterPrompt?: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
  videoIntro?: string;
  videoPreviewUrl?: string;
  videoThumbnailUrl?: string;
  requirements: StoryRequirement[];
}

export interface StoryDefinition {
  storyId: string;
  isInitial?: boolean;
  title: string;
  summary: string;
  level?: string;
  tags?: string[];
  unlockCost?: number;
  missions: StoryMission[];
}

export interface CharacterDefinition {
  characterId: string;
  storyIsInitial?: boolean;
  characterTags?: string[];
  aiRole: string;
  caracterName?: string;
  caracterPrompt?: string;
  characterBio?: string;
  characterSheetImageUrl?: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
}

export interface StorySummaryItem {
  storyId: string;
  isInitial?: boolean;
  title: string;
  summary: string;
  level?: string;
  tags: string[];
  unlockCost?: number;
  locked: boolean;
  missionsCount: number;
}

export interface StoryAdvanceRequest {
  sessionId: string;
  transcript: string;
  sceneIndex: number;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  storyDefinition?: StoryDefinition;
  missionDefinition?: StoryMission;
  persistedRequirements?: StoryAdvanceRequirementState[];
  persistedMissionCompleted?: boolean;
}

export interface StoryAdvanceRequirementState {
  requirementId: string;
  text: string;
  met: boolean;
  feedback?: string;
}

export interface StoryAdvancePayload {
  sceneIndex: number;
  missionCompleted: boolean;
  storyCompleted: boolean;
  requirements: StoryAdvanceRequirementState[];
  aiReply: string;
  correctness: number;
  result: EvalResult;
  errors: string[];
  reformulations: string[];
  conversationFeedback?: {
    summary: string;
    improvements: string[];
  } | null;
}

export interface StoryAssistanceRequest {
  question: string;
  sceneIndex?: number;
  sessionId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  storyDefinition?: StoryDefinition;
  missionDefinition?: StoryMission;
  requirements?: StoryAdvanceRequirementState[];
  conversationFeedback?: {
    summary?: string;
    improvements?: string[];
  } | null;
}

export interface StoryAssistanceResponse {
  answer: string;
}

export interface FriendCharacter {
  friendId: string;
  characterName: string;
  aiRole: string;
  characterPrompt?: string;
  characterBio?: string;
  characterSheetImageUrl?: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  messageCount?: number;
  conversationCount?: number;
  affinityPoints?: number;
  friendshipContext?: string;
  conversationSnapshot?: FriendConversationSnapshot;
}

export interface FriendAffinityUpdate {
  pointsEarned: number;
  qualityMultiplier: number;
  previousPoints: number;
  totalPoints: number;
  previousLevel: number;
  level: number;
  levelName: string;
  leveledUp: boolean;
}

export interface FriendConversationSnapshot {
  messages: Array<{ role: 'user' | 'assistant'; content: string; imageUrl?: string }>;
  conversationEnded: boolean;
  conversationFeedback?: {
    summary: string;
    improvements: string[];
  } | null;
  conversationSummary?: string;
  summaryUpToCount?: number;
  updatedAt: string;
}

export interface CreateFriendRequest {
  characterId?: string;
  storyId?: string;
  missionId?: string;
  lastMessageAt?: string;
  lastUserMessage?: string;
  messageCount?: number;
  conversationCount?: number;
  affinityPoints?: number;
  friendshipContext?: string;
  conversationSnapshot?: FriendConversationSnapshot;
}

export interface FriendsListResponse {
  items: FriendCharacter[];
}

export interface FriendChatRequest {
  sessionId?: string;
  transcript: string;
  userImageBase64?: string;
  postId?: string;
  postContext?: string;
  postCaption?: string;
  postImageUrl?: string;
  postVideoUrl?: string;
  englishDifficulty?: 'easy' | 'medium' | 'hard';
  friendshipContext?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string; imageUrl?: string }>;
}

export interface FriendChatPayload {
  friendId: string;
  aiReply: string;
  sceneNarration?: string;
  correctness: number;
  result: EvalResult;
  errors: string[];
  reformulations: string[];
  feedbackType?: 'correction' | 'translation_help';
  conversationEnded: boolean;
  conversationFeedback?: {
    summary: string;
    improvements: string[];
  } | null;
}

export interface FriendImageRequest {
  prompt?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string; imageUrl?: string }>;
}

export interface FriendshipImage {
  imageId: string;
  friendId: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl: string;
  prompt: string;
  referenceImageUrl: string;
  model: string;
  bucketName: string;
  bucketKey: string;
  contentType: string;
  createdAt: string;
  width?: number;
  height?: number;
  falRequestId?: string;
  falSeed?: number;
}

export interface FriendImagePayload {
  friendId: string;
  imageId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  userMessage: string;
  aiReply: string;
  image?: FriendshipImage;
  errorMessage?: string;
  conversationSnapshot?: FriendConversationSnapshot;
}

export interface TranslationRequest {
  text: string;
  source?: string;
  target?: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

export interface PromoCodeValidationRequest {
  code: string;
}

export interface PromoCodeValidationResponse {
  code: string;
  isValid: boolean;
  premiumDays: number;
}

export type AppVersionCheckStatus = "ok" | "optional_update" | "required_update";

export interface AppVersionCheckRequest {
  version: string;
  platform?: string;
}

export interface AppVersionCheckResponse {
  status: AppVersionCheckStatus;
  force: boolean;
  title: string;
  message: string;
  currentVersion: string;
  latestVersion: string;
  recommendedMinimumVersion: string;
  minimumSupportedVersion: string;
  storeUrl: string;
  urls: {
    ios: string;
    android: string;
    fallback: string;
  };
}
