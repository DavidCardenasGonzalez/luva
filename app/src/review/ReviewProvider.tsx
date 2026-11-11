import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { localReviews } from './local';
import { useAuth } from '../auth/AuthProvider';
import { reviewApi } from './api';
import type { ReviewHistoryMessage, ReviewItem, ReviewPage, ReviewSource, ReviewStatus } from './types';

type ReviewContextValue = {
  save: (input: { originalText: string; translatedText: string; sourceLanguage: string; targetLanguage: string; contextText?: string; source: ReviewSource }) => Promise<ReviewItem>;
  list: (status?: ReviewStatus, cursor?: string) => Promise<ReviewPage>;
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

  const accountRef = useRef(account);
  accountRef.current = account;
  const sync = useCallback(async () => {
    if (!account) return;
    await localReviews.sync(account, () => accountRef.current === account);
    if (accountRef.current !== account) throw new Error('SESSION_CHANGED');
  }, [account]);

  useEffect(() => {
    const attempt = () => { void sync().then(() => {
      if (accountRef.current === account) setRefreshKey(value => value + 1);
    }).catch(() => {}); };
    attempt();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') attempt(); });
    return () => subscription.remove();
  }, [account, sync]);

  useEffect(() => {
    generation.current += 1;
    setRefreshKey(value => value + 1);
    return () => { generation.current += 1; };
  }, [account]);

  const save = useCallback(async (input: Parameters<typeof reviewApi.save>[0]) => {
    if (!account) {
      const item = await localReviews.save(input);
      setRefreshKey(value => value + 1);
      return item;
    }
    await sync();
    const current = generation.current;
    const result = await reviewApi.save(input);
    if (current === generation.current) setRefreshKey(value => value + 1);
    return result.item;
  }, [account, sync]);
  const list = useCallback(async (status?: ReviewStatus, cursor?: string) => {
    const current = generation.current;
    if (!account) return localReviews.list(status);
    await sync();
    const result = await reviewApi.list(status, cursor);
    if (current !== generation.current) throw new Error('SESSION_CHANGED');
    return result;
  }, [account, sync]);
  const get = useCallback(async (id: string) => {
    const current = generation.current;
    if (!account) return (await localReviews.get(id)).item;
    await sync();
    const remoteId = id.startsWith('local-') ? (await localReviews.get(id, account)).remoteId! : id;
    const result = await reviewApi.get(remoteId);
    if (current !== generation.current) throw new Error('SESSION_CHANGED');
    return result;
  }, [account, sync]);
  const setStatus = useCallback(async (id: string, status: ReviewStatus) => {
    const current = generation.current;
    if (!account) {
      const item = await localReviews.setStatus(id, status);
      setRefreshKey(value => value + 1);
      return item;
    }
    await sync();
    const remoteId = id.startsWith('local-') ? (await localReviews.get(id, account)).remoteId! : id;
    const result = await reviewApi.setStatus(remoteId, status);
    if (current !== generation.current) throw new Error('SESSION_CHANGED');
    setRefreshKey(value => value + 1);
    return result;
  }, [account, sync]);
  const ask = useCallback(async (id: string, question: string, history: ReviewHistoryMessage[], supportLanguage: string) => {
    const current = generation.current;
    if (!account) throw new Error('SIGN_IN_REQUIRED');
    await sync();
    const remoteId = id.startsWith('local-') ? (await localReviews.get(id, account)).remoteId! : id;
    const result = await reviewApi.ask(remoteId, question, history, supportLanguage);
    if (current !== generation.current) throw new Error('SESSION_CHANGED');
    return result.answer;
  }, [account, sync]);

  const value = useMemo(() => ({ save, list, get, setStatus, ask, refreshKey }), [save, list, get, setStatus, ask, refreshKey]);
  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}

export function useReview() {
  const context = useContext(ReviewContext);
  if (!context) throw new Error('useReview must be used within ReviewProvider');
  return context;
}
