import { useEffect, useState } from 'react';
import { api } from '../api/api';

export type ProgressRes = { points: number; streak: number };

export function useProgress() {
  const [data, setData] = useState<ProgressRes | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get<ProgressRes>('/me/progress');
      // backend mock returns { points, streaks: {max,current} } but contract expects { points, streak }
      // Normalize if needed
      // @ts-ignore
      const streak = (res as any).streak ?? (res as any).streaks?.current ?? 0;
      setData({ points: (res as any).points ?? 0, streak });
    } catch (e: any) {
      setError(e?.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  return { data, loading, error, reload: load };
}

