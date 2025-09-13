import { useEffect, useState } from 'react';
import { api } from '../api/api';

export type Card = {
  cardId: string;
  type: 'phrasal' | 'structure' | 'vocab';
  prompt: string;
  hints?: string[];
  tags?: string[];
  difficulty: 'B1'|'B1+'|'B2';
};

export function useCards(type?: Card['type']) {
  const [items, setItems] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => { (async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (type) qs.set('type', type);
      const res = await api.get<{ items: Card[] }>(`/cards${qs.toString() ? '?' + qs.toString() : ''}`);
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch cards');
    } finally {
      setLoading(false);
    }
  })(); }, [type]);

  return { items, loading, error, reload: async () => {} };
}

