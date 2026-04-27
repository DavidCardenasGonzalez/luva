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
  caracterName?: string;
  caracterPrompt?: string;
  avatarImageUrl?: string;
  videoIntro?: string;
  requirements: StoryRequirement[];
}

export interface StoryDefinition {
  storyId: string;
  title: string;
  summary: string;
  level?: string;
  tags?: string[];
  unlockCost?: number;
  missions: StoryMission[];
}

export interface StorySummaryItem {
  storyId: string;
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
  storyId: string;
  missionId: string;
  sceneIndex: number;
  storyTitle: string;
  missionTitle: string;
  characterName: string;
  aiRole: string;
  characterPrompt?: string;
  avatarImageUrl?: string;
  videoIntro?: string;
  sceneSummary?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  messageCount?: number;
  conversationCount?: number;
}

export interface CreateFriendRequest {
  storyId?: string;
  missionId?: string;
  sceneIndex?: number;
  storyDefinition?: StoryDefinition;
  missionDefinition?: StoryMission;
}

export interface FriendsListResponse {
  items: FriendCharacter[];
}

export interface FriendChatRequest {
  sessionId?: string;
  transcript: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface FriendChatPayload {
  friendId: string;
  aiReply: string;
  correctness: number;
  result: EvalResult;
  errors: string[];
  reformulations: string[];
  conversationEnded: boolean;
  conversationFeedback?: {
    summary: string;
    improvements: string[];
  } | null;
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
