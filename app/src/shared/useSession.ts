export default function useSession() {
  const base = process.env.API_BASE_URL || '';

  return {
    async startSession() {
      const res = await fetch(base + '/sessions/start', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start session');
      return res.json();
    },
    async transcribe(sessionId: string) {
      const res = await fetch(`${base}/sessions/${sessionId}/transcribe`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to transcribe');
      return res.json();
    },
    async evaluate(sessionId: string, transcript: string) {
      const res = await fetch(`${base}/sessions/${sessionId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) throw new Error('Failed to evaluate');
      return res.json();
    },
  };
}

