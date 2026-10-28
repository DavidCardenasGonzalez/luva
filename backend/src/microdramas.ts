import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { createCharactersRepository, type CharacterPresentation } from './characters';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const characters = createCharactersRepository();

export type MicrodramaCharacter = Pick<CharacterPresentation, 'characterId' | 'name' | 'avatarUrl' | 'avatarXsUrl' | 'avatarMdUrl'>;
export type MicrodramaSeries = {
  seriesId: string;
  title: string;
  synopsis: string;
  coverUrl: string;
  episodeCount: number;
  firstEpisodeId: string;
  chatCharacters: MicrodramaCharacter[];
};
export type MicrodramaEpisode = {
  episodeId: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  durationMs: number;
  videoUrl: string;
  subtitlesUrl?: string;
  subtitlesLanguage: 'en';
  accessPolicy: 'free';
};
type SeriesRecord = {
  pk: string; sk: string; seriesId: string; title: string; searchTitle: string;
  synopsis: string; coverUrl: string; publicationStatus: 'draft' | 'published';
  chatCharacterIds: string[]; episodeCount: number; firstEpisodeId: string;
  catalogOrder: number; version: number; catalogPk?: string; catalogSk?: string;
};
type EpisodeRecord = MicrodramaEpisode & { pk: string; sk: string; publicationStatus: 'draft' | 'published' };

export function getMicrodramasTableName(env: NodeJS.ProcessEnv = process.env): string {
  const name = env.MICRODRAMAS_TABLE_NAME?.trim();
  if (!name) throw new Error('MICRODRAMAS_TABLE_NAME not set');
  return name;
}

export function normalizeSeriesSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en-US').trim();
}

function encodeCursor(input: { q: string; seed: string; offset: number }): string {
  return Buffer.from(JSON.stringify({ v: 1, ...input })).toString('base64url');
}

function decodeCursor(cursor: string | undefined, q: string, seed: string): number {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (parsed.v !== 1 || parsed.q !== q || parsed.seed !== seed || !Number.isInteger(parsed.offset) || parsed.offset < 0 || parsed.offset > 200) {
      throw new Error();
    }
    return parsed.offset;
  } catch {
    throw new Error('INVALID_MICRODRAMA_CURSOR');
  }
}

function seedHash(seed: string, id: string): number {
  let h = 2166136261;
  for (const char of `${seed}:${id}`) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return h >>> 0;
}

function publicEpisode(record: EpisodeRecord): MicrodramaEpisode {
  return {
    episodeId: record.episodeId,
    seriesId: record.seriesId,
    episodeNumber: record.episodeNumber,
    title: record.title,
    durationMs: record.durationMs,
    videoUrl: record.videoUrl,
    ...(record.subtitlesUrl ? { subtitlesUrl: record.subtitlesUrl } : {}),
    subtitlesLanguage: 'en',
    accessPolicy: 'free',
  };
}

function table() { return getMicrodramasTableName(); }

async function publicSeries(record: SeriesRecord): Promise<MicrodramaSeries> {
  const presentations = await characters.getCharacterPresentations(record.chatCharacterIds);
  return {
    seriesId: record.seriesId,
    title: record.title,
    synopsis: record.synopsis,
    coverUrl: record.coverUrl,
    episodeCount: record.episodeCount,
    firstEpisodeId: record.firstEpisodeId,
    chatCharacters: presentations.map(character => ({
      characterId: character.characterId,
      name: character.name,
      ...(character.avatarUrl ? { avatarUrl: character.avatarUrl } : {}),
      ...(character.avatarXsUrl ? { avatarXsUrl: character.avatarXsUrl } : {}),
      ...(character.avatarMdUrl ? { avatarMdUrl: character.avatarMdUrl } : {}),
    })),
  };
}

export function createMicrodramasRepository(
  client: typeof dynamo = dynamo,
  charactersRepository = characters,
) {
  return {
    async listSeries(input: { q?: string; cursor?: string; seed?: string; limit?: number; discovery?: boolean } = {}) {
      const q = normalizeSeriesSearch(input.q || '');
      const seed = input.discovery ? (input.seed?.trim() || 'default') : '';
      const offset = decodeCursor(input.cursor, q, seed);
      const limit = Math.max(1, Math.min(20, Math.floor(input.limit || 20)));
      const records: SeriesRecord[] = [];
      let ExclusiveStartKey: Record<string, unknown> | undefined;
      do {
        const page = await client.send(new QueryCommand({
          TableName: table(),
          IndexName: 'CatalogIndex',
          KeyConditionExpression: 'catalogPk = :published',
          ExpressionAttributeValues: { ':published': 'PUBLISHED' },
          ...(ExclusiveStartKey ? { ExclusiveStartKey } : {}),
        })) as { Items?: SeriesRecord[]; LastEvaluatedKey?: Record<string, unknown> };
        records.push(...(page.Items || []));
        if (records.length > 200) throw new Error('MICRODRAMA_CATALOG_LIMIT_EXCEEDED');
        ExclusiveStartKey = page.LastEvaluatedKey;
      } while (ExclusiveStartKey);
      const matching = records.filter(record => record.publicationStatus === 'published'
        && (!q || record.searchTitle.includes(q)));
      if (input.discovery) matching.sort((a, b) => seedHash(seed, a.seriesId) - seedHash(seed, b.seriesId));
      const pageRecords = matching.slice(offset, offset + limit);
      const chatCharacters = await charactersRepository.getCharacterPresentations(
        [...new Set(pageRecords.flatMap(record => record.chatCharacterIds))],
      );
      const byId = new Map(chatCharacters.map(character => [character.characterId, character]));
      const items = pageRecords.map(record => ({
        seriesId: record.seriesId,
        title: record.title,
        synopsis: record.synopsis,
        coverUrl: record.coverUrl,
        episodeCount: record.episodeCount,
        firstEpisodeId: record.firstEpisodeId,
        chatCharacters: record.chatCharacterIds.map(id => {
          const character = byId.get(id);
          if (!character) throw new Error(`CHARACTER_REFERENCE_MISSING:${id}`);
          return {
            characterId: character.characterId,
            name: character.name,
            ...(character.avatarUrl ? { avatarUrl: character.avatarUrl } : {}),
            ...(character.avatarXsUrl ? { avatarXsUrl: character.avatarXsUrl } : {}),
            ...(character.avatarMdUrl ? { avatarMdUrl: character.avatarMdUrl } : {}),
          };
        }),
      } satisfies MicrodramaSeries));
      const nextOffset = offset + pageRecords.length;
      return {
        items,
        ...(nextOffset < matching.length ? { nextCursor: encodeCursor({ q, seed, offset: nextOffset }) } : {}),
      };
    },

    async getSeriesDetail(seriesId: string) {
      if (!seriesId?.trim()) throw new Error('INVALID_SERIES_ID');
      const records: Array<SeriesRecord | EpisodeRecord> = [];
      let ExclusiveStartKey: Record<string, unknown> | undefined;
      do {
        const page = await client.send(new QueryCommand({
          TableName: table(),
          KeyConditionExpression: 'pk = :pk',
          ExpressionAttributeValues: { ':pk': `SERIES#${seriesId}` },
          ...(ExclusiveStartKey ? { ExclusiveStartKey } : {}),
        })) as { Items?: Array<SeriesRecord | EpisodeRecord>; LastEvaluatedKey?: Record<string, unknown> };
        records.push(...(page.Items || []));
        ExclusiveStartKey = page.LastEvaluatedKey;
      } while (ExclusiveStartKey);
      const series = records.find((record): record is SeriesRecord => record.sk === 'META');
      if (!series || series.publicationStatus !== 'published') return undefined;
      const episodeRecords = records
        .filter((record): record is EpisodeRecord => record.sk.startsWith('EPISODE#') && record.publicationStatus === 'published')
        .sort((a, b) => a.episodeNumber - b.episodeNumber);
      if (!episodeRecords.length) return undefined;
      const [publicMetadata, publicEpisodes] = await Promise.all([
        publicSeriesWithCharacters(series, charactersRepository),
        Promise.resolve(episodeRecords.map(publicEpisode)),
      ]);
      return { series: publicMetadata, episodes: publicEpisodes };
    },
  };
}

async function publicSeriesWithCharacters(series: SeriesRecord, repository: typeof characters) {
  const presentations = await repository.getCharacterPresentations(series.chatCharacterIds);
  const byId = new Map(presentations.map(character => [character.characterId, character]));
  return {
    seriesId: series.seriesId,
    title: series.title,
    synopsis: series.synopsis,
    coverUrl: series.coverUrl,
    episodeCount: series.episodeCount,
    firstEpisodeId: series.firstEpisodeId,
    chatCharacters: series.chatCharacterIds.map(id => {
      const character = byId.get(id);
      if (!character) throw new Error(`CHARACTER_REFERENCE_MISSING:${id}`);
      return {
        characterId: character.characterId,
        name: character.name,
        ...(character.avatarUrl ? { avatarUrl: character.avatarUrl } : {}),
        ...(character.avatarXsUrl ? { avatarXsUrl: character.avatarXsUrl } : {}),
        ...(character.avatarMdUrl ? { avatarMdUrl: character.avatarMdUrl } : {}),
      };
    }),
  } satisfies MicrodramaSeries;
}
