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

export type StoryProgressEntry = {
  completedMissions: StoryMissionProgress;
  storyCompleted: boolean;
  storyCompletedAt?: string;
};

export type StoryProgressState = Record<string, StoryProgressEntry>;

export type StoryProgressItem = {
  updatedAt: string;
  deletedAt?: string;
  storyCompletedAt?: string;
  completedMissions: StoryMissionProgress;
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
