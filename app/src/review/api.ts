import { api } from '../api/api';
import type { ReviewHistoryMessage, ReviewItem, ReviewPage, ReviewSource, ReviewStatus } from './types';

export const reviewApi = {
  list: (status: ReviewStatus, cursor?: string) => api.get<ReviewPage>(
    `/review-items?status=${status}&limit=30${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
  ),
  get: async (id: string) => (await api.get<{ item: ReviewItem }>(`/review-items/${encodeURIComponent(id)}`)).item,
  save: (input: {
    originalText: string; translatedText: string; sourceLanguage: string; targetLanguage: string;
    contextText?: string; source: ReviewSource;
  }) => api.post<{ item: ReviewItem; created: boolean }>('/review-items', input),
  setStatus: async (id: string, status: ReviewStatus) => (await api.put<{ item: ReviewItem }>(
    `/review-items/${encodeURIComponent(id)}/status`, { status },
  )).item,
  ask: (id: string, question: string, history: ReviewHistoryMessage[], supportLanguage: string) =>
    api.post<{ answer: string }>(`/review-items/${encodeURIComponent(id)}/ask`, {
      question, history, supportLanguage,
    }),
};
