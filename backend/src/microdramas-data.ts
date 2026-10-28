import type { CharacterDefinition } from './types';
import { normalizeSeriesSearch } from './microdramas';

export type MicrodramaManifest = {
  series: {
    seriesId: string;
    title: string;
    synopsis: string;
    coverUrl: string;
    chatCharacterIds: string[];
    catalogOrder: number;
    publicationStatus: 'draft' | 'published';
  };
  episodes: Array<{
    episodeId: string;
    episodeNumber: number;
    title: string;
    durationMs: number;
    videoUrl: string;
    subtitlesUrl?: string;
    publicationStatus: 'draft' | 'published';
  }>;
};

export function validateMicrodramaManifest(
  manifest: MicrodramaManifest,
  characters: CharacterDefinition[],
): string[] {
  const errors: string[] = [];
  const series = manifest?.series;
  if (!series || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(series.seriesId || '')) errors.push('Invalid seriesId');
  if (!series?.title?.trim() || series.title.length > 120) errors.push('Invalid series title');
  if (!series?.synopsis?.trim() || series.synopsis.length > 500) errors.push('Invalid synopsis');
  if (!validHttpsUrl(series?.coverUrl)) errors.push('Invalid coverUrl');
  if (!Number.isFinite(series?.catalogOrder) || series.catalogOrder < 0) errors.push('Invalid catalogOrder');
  if (!['draft', 'published'].includes(series?.publicationStatus)) errors.push('Invalid series publicationStatus');
  if (!Array.isArray(series?.chatCharacterIds) || series.chatCharacterIds.length < 1 || series.chatCharacterIds.length > 5) {
    errors.push('A series must have 1-5 chat characters');
  } else {
    const available = new Set(characters.map(character => character.characterId));
    if (new Set(series.chatCharacterIds).size !== series.chatCharacterIds.length) errors.push('Duplicate chat characters');
    for (const id of series.chatCharacterIds) if (!available.has(id)) errors.push(`Unknown chat character: ${id}`);
  }
  if (!Array.isArray(manifest.episodes) || manifest.episodes.length < 1) errors.push('A series must have at least one episode');
  else {
    const ids = new Set<string>();
    const numbers = new Set<number>();
    for (const episode of manifest.episodes) {
      if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(episode.episodeId || '')) errors.push('Invalid episodeId');
      if (ids.has(episode.episodeId)) errors.push(`Duplicate episodeId: ${episode.episodeId}`);
      ids.add(episode.episodeId);
      if (!Number.isInteger(episode.episodeNumber) || episode.episodeNumber < 1 || numbers.has(episode.episodeNumber)) errors.push(`Invalid episodeNumber: ${episode.episodeId}`);
      numbers.add(episode.episodeNumber);
      if (!episode.title?.trim() || episode.title.length > 120) errors.push(`Invalid title: ${episode.episodeId}`);
      if (!Number.isInteger(episode.durationMs) || episode.durationMs < 1) errors.push(`Invalid duration: ${episode.episodeId}`);
      if (!validHttpsUrl(episode.videoUrl)) errors.push(`Invalid videoUrl: ${episode.episodeId}`);
      if (episode.subtitlesUrl !== undefined && !validHttpsUrl(episode.subtitlesUrl)) errors.push(`Invalid subtitlesUrl: ${episode.episodeId}`);
      if (!['draft', 'published'].includes(episode.publicationStatus)) errors.push(`Invalid publicationStatus: ${episode.episodeId}`);
      if (series.publicationStatus === 'published' && episode.publicationStatus !== 'published') errors.push(`Published series has draft episode: ${episode.episodeId}`);
    }
    if (series.publicationStatus === 'published' && numbers.size && [...numbers].sort((a,b) => a-b).some((n, i) => n !== i + 1)) {
      errors.push('Published episode numbers must be contiguous from 1');
    }
  }
  return errors;
}

export function toMicrodramaDynamoItems(manifest: MicrodramaManifest) {
  const seriesId = manifest.series.seriesId;
  const now = new Date().toISOString();
  const publishedEpisodes = manifest.episodes.filter(episode => episode.publicationStatus === 'published').sort((a,b) => a.episodeNumber-b.episodeNumber);
  const series = {
    pk: `SERIES#${seriesId}`,
    sk: 'META',
    seriesId,
    title: manifest.series.title.trim(),
    searchTitle: normalizeSeriesSearch(manifest.series.title),
    synopsis: manifest.series.synopsis.trim(),
    coverUrl: manifest.series.coverUrl.trim(),
    publicationStatus: manifest.series.publicationStatus,
    chatCharacterIds: manifest.series.chatCharacterIds,
    episodeCount: publishedEpisodes.length,
    ...(publishedEpisodes[0] ? { firstEpisodeId: publishedEpisodes[0].episodeId } : {}),
    catalogOrder: manifest.series.catalogOrder,
    version: 1,
    ...(manifest.series.publicationStatus === 'published' ? {
      catalogPk: 'PUBLISHED',
      catalogSk: `${String(manifest.series.catalogOrder).padStart(8, '0')}#${seriesId}`,
    } : {}),
    createdAt: now,
    updatedAt: now,
  };
  const episodes = manifest.episodes.map(episode => ({
    pk: `SERIES#${seriesId}`,
    sk: `EPISODE#${episode.episodeId}`,
    episodeId: episode.episodeId,
    seriesId,
    episodeNumber: episode.episodeNumber,
    title: episode.title.trim(),
    durationMs: episode.durationMs,
    videoUrl: episode.videoUrl.trim(),
    ...(episode.subtitlesUrl ? { subtitlesUrl: episode.subtitlesUrl.trim() } : {}),
    subtitlesLanguage: 'en' as const,
    publicationStatus: episode.publicationStatus,
    accessPolicy: 'free' as const,
    createdAt: now,
    updatedAt: now,
  }));
  return [series, ...episodes];
}

function validHttpsUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}
