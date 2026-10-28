import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { reviewApi } from './api';
import type { ReviewHistoryMessage, ReviewItem, ReviewPage, ReviewSource, ReviewStatus } from './types';

type ReviewContextValue = {
  save: (input: { originalText: string; translatedText: string; sourceLanguage: string; targetLanguage: string; contextText?: string; source: ReviewSource }) => Promise<ReviewItem>;
  list: (status: ReviewStatus, cursor?: string) => Promise<ReviewPage>;
  get: (id: string) => Promise<ReviewItem>;
  setStatus: (id: string, status: ReviewStatus) => Promise<ReviewItem>;
  ask: (id: string, question: string, history: ReviewHistoryMessage[], supportLanguage: string) => Promise<string>;
  refreshKey: number;
};
const ReviewContext = createContext<ReviewContextValue | undefined>(undefined);

export function ReviewProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const generation = useRef(0);
  const account = isSignedIn ? user?.email?.toLowerCase() : undefined;

  useEffect(() => {
    generation.current += 1;
    setRefreshKey(value => value + 1);
    return () => { generation.current += 1; };
  }, [account]);

  const save = useCallback(async (input: Parameters<typeof reviewApi.save>[0]) => {
    if (!account) throw new Error('SIGN_IN_REQUIRED');
    const current = generation.current;
    const result = await reviewApi.save(input);
    if (current === generation.current) setRefreshKey(value => value + 1);
    return result.item;
  }, [account]);
  const list = useCallback(async (status: ReviewStatus, cursor?: string) => {
    const current = generation.current;
    const result = await reviewApi.list(status, cursor);
    if (current !== generation.current) throw new Error('SESSION_CHANGED');
    return result;
  }, []);
  const get = useCallback(async (id: string) => {
    const current = generation.current;
    const result = await reviewApi.get(id);
    if (current !== generation.current) throw new Error('SESSION_CHANGED');
    return result;
  }, []);
  const setStatus = useCallback(async (id: string, status: ReviewStatus) => {
    const current = generation.current;
    const result = await reviewApi.setStatus(id, status);
    if (current !== generation.current) throw new Error('SESSION_CHANGED');
    setRefreshKey(value => value + 1);
    return result;
  }, []);
  const ask = useCallback(async (id: string, question: string, history: ReviewHistoryMessage[], supportLanguage: string) => {
    const current = generation.current;
    const result = await reviewApi.ask(id, question, history, supportLanguage);
    if (current !== generation.current) throw new Error('SESSION_CHANGED');
    return result.answer;
  }, []);

  const value = useMemo(() => ({ save, list, get, setStatus, ask, refreshKey }), [save, list, get, setStatus, ask, refreshKey]);
  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}

export function useReview() {
  const context = useContext(ReviewContext);
  if (!context) throw new Error('useReview must be used within ReviewProvider');
  return context;
}
