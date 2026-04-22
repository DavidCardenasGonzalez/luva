export const MIN_PROGRESS_TIMESTAMP = '1970-01-01T00:00:00.000Z';

export type CardProgressStatus = 'todo' | 'learning' | 'learned';

export type CardProgressState = Record<string, CardProgressStatus>;

export type CardProgressEntry = {
  status: CardProgressStatus;
  updatedAt: string;
};

export type CardProgressDocument = {
  updatedAt: string;
  resetAt?: string;
  items: Record<string, CardProgressEntry>;
};

export type StoryMissionProgress = Record<string, string>;

export type StoryChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

export type StoryRequirementProgress = {
  requirementId: string;
  text: string;
  met: boolean;
  feedback?: string;
};

export type StoryAnalysis = {
  correctness: number;
  result: 'correct' | 'partial' | 'incorrect';
  errors: string[];
  reformulations: string[];
};

export type StoryConversationFeedback = {
  summary: string;
  improvements: string[];
};

export type StoryAttemptSnapshot = {
  messages: StoryChatMessage[];
  requirements: StoryRequirementProgress[];
  analysis: StoryAnalysis | null;
  missionCompleted: boolean;
  storyCompleted: boolean;
  pendingNext: number | null;
  conversationFeedback: StoryConversationFeedback | null;
};

export type StoryRetryState = 'none' | 'optional' | 'required';

export type StoryActiveMission = {
  storyId: string;
  missionId: string;
  sceneIndex: number;
  updatedAt: string;
  startedAt: string;
  storyTitle?: string;
  missionTitle?: string;
  sceneSummary?: string;
  caracterName?: string;
  avatarImageUrl?: string;
  messages: StoryChatMessage[];
  requirements: StoryRequirementProgress[];
  analysis: StoryAnalysis | null;
  missionCompleted: boolean;
  storyCompleted: boolean;
  pendingNext: number | null;
  conversationFeedback: StoryConversationFeedback | null;
  retryState: StoryRetryState;
  lastAttemptSnapshot: StoryAttemptSnapshot | null;
  missionUnlocked: boolean;
};

export type StoryProgressEntry = {
  completedMissions: StoryMissionProgress;
  storyCompleted: boolean;
  storyCompletedAt?: string;
  activeMission?: StoryActiveMission;
};

export type StoryProgressState = Record<string, StoryProgressEntry>;

export type StoryProgressItem = {
  updatedAt: string;
  deletedAt?: string;
  storyCompletedAt?: string;
  completedMissions: StoryMissionProgress;
  activeMission?: StoryActiveMission;
};

export type StoryProgressDocument = {
  updatedAt: string;
  resetAt?: string;
  items: Record<string, StoryProgressItem>;
};

export type UserProgressRecord = {
  cards: CardProgressDocument;
  stories: StoryProgressDocument;
};
