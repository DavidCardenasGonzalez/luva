import { useEffect, useState } from 'react';
import { api } from '../api/api';

export type Story = { storyId: string; title: string; unlockCost: number; tags?: string[]; locked: boolean };

export function useStories() {
  const [items, setItems] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => { (async () => {
    try {
      setLoading(true);
      const res = await api.get<{ items: Story[] }>(`/stories`);
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  })(); }, []);

  return { items, loading, error };
}

