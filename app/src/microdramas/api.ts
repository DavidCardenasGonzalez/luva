import { api } from '../api/api';
import type {
  MicrodramaDetail,
  MicrodramaEpisodeProgress,
  MicrodramaPage,
  MicrodramaProgressSummary,
} from './types';

export function getMicrodramas(options: { q?: string; cursor?: string; discovery?: boolean; seed?: string } = {}) {
  const query = new URLSearchParams();
  if (options.q?.trim()) query.set('q', options.q.trim());
  if (options.cursor) query.set('cursor', options.cursor);
  if (options.seed) query.set('seed', options.seed);
  const route = options.discovery ? '/microdramas/discovery' : '/microdramas';
  const suffix = query.size ? `?${query.toString()}` : '';
  return api.get<MicrodramaPage>(`${route}${suffix}`);
}

export function getMicrodramaDetail(seriesId: string) {
  return api.get<MicrodramaDetail>(`/microdramas/${encodeURIComponent(seriesId)}`);
}

export function getMicrodramaProgress(seriesId: string) {
  return api.get<{ summary?: MicrodramaProgressSummary; episodes: MicrodramaEpisodeProgress[] }>(
    `/microdramas/${encodeURIComponent(seriesId)}/progress`,
  );
}

export function getMicrodramaProgressBatch(seriesIds: string[]) {
  return api.post<{ items: MicrodramaProgressSummary[] }>('/microdramas/progress/batch', { seriesIds });
}

export function saveMicrodramaProgress(
  seriesId: string,
  progress: { episodeId: string; positionMs: number; event: 'position' | 'ended'; expectedRevision: number },
) {
  return api.put<{ summary: MicrodramaProgressSummary; episode: MicrodramaEpisodeProgress }>(
    `/microdramas/${encodeURIComponent(seriesId)}/progress`,
    progress,
  );
}
