export type ReviewStatus = 'pending' | 'completed';
export type ReviewSource = {
  type: 'microdrama' | 'feed_video';
  seriesId?: string;
  episodeId?: string;
  characterId?: string;
  postId?: string;
  positionMs?: number;
  title?: string;
};
export type ReviewItem = {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  contextText?: string;
  source: ReviewSource;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};
export type ReviewPage = { items: ReviewItem[]; nextCursor?: string };
export type ReviewHistoryMessage = { role: 'user' | 'assistant'; content: string };
