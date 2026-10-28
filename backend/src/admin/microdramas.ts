import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { createCharactersRepository } from '../characters';
import { getMicrodramasTableName } from '../microdramas';
import { toMicrodramaDynamoItems, validateMicrodramaManifest, type MicrodramaManifest } from '../microdramas-data';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });
type Row = Record<string, any>;
const ID = /^[a-z0-9][a-z0-9_-]{0,79}$/;

export class AdminMicrodramaError extends Error {
  constructor(public statusCode: number, public code: string, message: string, public details: string[] = []) {
    super(message);
  }
}

function invalid(message: string): never {
  throw new AdminMicrodramaError(400, 'INVALID_MICRODRAMA', message);
}

function text(value: unknown, label: string, max: number, required = false): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) invalid(`Revisa ${label}.`);
  return (value as string).trim();
}

function url(value: unknown, label: string): string {
  const result = text(value ?? '', label, 2048);
  if (result) {
    try { if (new URL(result).protocol !== 'https:') invalid(`${label} debe usar HTTPS.`); }
    catch { invalid(`${label} debe ser una URL HTTPS válida.`); }
  }
  return result;
}

function status(value: unknown): 'draft' | 'published' {
  if (value !== 'draft' && value !== 'published') invalid('Selecciona un estado válido.');
  return value as 'draft' | 'published';
}

export function normalizeAdminMicrodrama(input: unknown): MicrodramaManifest {
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid('Faltan los datos de la serie.');
  const data = input as Row;
  const series = data.series;
  if (!series || typeof series !== 'object' || Array.isArray(series)) invalid('Faltan los datos de la serie.');
  const seriesId = text(series.seriesId, 'el identificador', 80, true);
  if (!ID.test(seriesId)) invalid('El identificador solo admite minúsculas, números, guiones y guiones bajos.');
  if (!Number.isInteger(series.catalogOrder) || series.catalogOrder < 0 || series.catalogOrder > 99999999) invalid('El orden del catálogo debe ser un entero de 0 a 99999999.');
  if (!Array.isArray(series.chatCharacterIds) || series.chatCharacterIds.length > 5 || series.chatCharacterIds.some((id: unknown) => typeof id !== 'string' || !id.trim()) || new Set(series.chatCharacterIds).size !== series.chatCharacterIds.length) invalid('Selecciona hasta cinco personajes distintos.');
  if (!Array.isArray(data.episodes) || data.episodes.length > 99) invalid('Una serie admite hasta 99 episodios.');
  const ids = new Set<string>();
  const numbers = new Set<number>();
  const episodes = data.episodes.map((item: Row) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) invalid('Revisa los datos de los episodios.');
    const episodeId = text(item.episodeId, 'el identificador del episodio', 80, true);
    if (!ID.test(episodeId) || ids.has(episodeId)) invalid('Los identificadores de episodio deben ser válidos y únicos.');
    ids.add(episodeId);
    if (!Number.isInteger(item.episodeNumber) || item.episodeNumber < 1 || numbers.has(item.episodeNumber)) invalid('Los números de episodio deben ser enteros positivos y únicos.');
    numbers.add(item.episodeNumber);
    if (!Number.isSafeInteger(item.durationMs) || item.durationMs < 0) invalid('La duración debe ser válida.');
    const subtitlesUrl = url(item.subtitlesUrl, 'La URL de subtítulos');
    return {
      episodeId, episodeNumber: item.episodeNumber,
      title: text(item.title, 'el título del episodio', 120, true),
      durationMs: item.durationMs,
      videoUrl: url(item.videoUrl, 'La URL del video'),
      ...(subtitlesUrl ? { subtitlesUrl } : {}),
      publicationStatus: status(item.publicationStatus),
    };
  }).sort((a: Row, b: Row) => a.episodeNumber - b.episodeNumber);
  if (episodes.some((item: Row, i: number) => item.episodeNumber !== i + 1)) invalid('Los episodios deben estar numerados consecutivamente desde el 1.');
  return {
    series: {
      seriesId, title: text(series.title, 'el título de la serie', 120, true),
      synopsis: text(series.synopsis ?? '', 'la sinopsis', 500),
      coverUrl: url(series.coverUrl, 'La URL de portada'),
      chatCharacterIds: series.chatCharacterIds,
      catalogOrder: series.catalogOrder,
      publicationStatus: status(series.publicationStatus),
    },
    episodes,
  };
}

function manifestFromRows(rows: Row[]): MicrodramaManifest {
  const meta = rows.find(row => row.sk === 'META')!;
  return {
    series: {
      seriesId: meta.seriesId, title: meta.title, synopsis: meta.synopsis || '', coverUrl: meta.coverUrl || '',
      chatCharacterIds: meta.chatCharacterIds || [], catalogOrder: meta.catalogOrder,
      publicationStatus: meta.publicationStatus,
    },
    episodes: rows.filter(row => row.sk.startsWith('EPISODE#')).sort((a, b) => a.episodeNumber - b.episodeNumber).map(row => ({
      episodeId: row.episodeId, episodeNumber: row.episodeNumber, title: row.title,
      durationMs: row.durationMs, videoUrl: row.videoUrl,
      ...(row.subtitlesUrl ? { subtitlesUrl: row.subtitlesUrl } : {}), publicationStatus: row.publicationStatus,
    })),
  };
}

function conflict(error: any): never {
  if (error?.name === 'ConditionalCheckFailedException' || (error?.name === 'TransactionCanceledException' && error.CancellationReasons?.some((reason: Row) => reason.Code === 'ConditionalCheckFailed'))) {
    throw new AdminMicrodramaError(409, 'MICRODRAMA_VERSION_CONFLICT', 'La serie cambió en otra sesión. Recarga la serie antes de guardar.');
  }
  throw error;
}

export function createAdminMicrodramasRepository(client = dynamo, characters = createCharactersRepository()) {
  const table = () => getMicrodramasTableName();
  async function read(seriesId: string): Promise<Row[]> {
    if (!ID.test(seriesId)) invalid('Identificador de serie inválido.');
    const rows: Row[] = [];
    let cursor: Record<string, any> | undefined;
    do {
      const page = await client.send(new QueryCommand({ TableName: table(), ConsistentRead: true, KeyConditionExpression: 'pk = :pk', ExpressionAttributeValues: { ':pk': `SERIES#${seriesId}` }, ExclusiveStartKey: cursor }));
      rows.push(...(page.Items || []));
      cursor = page.LastEvaluatedKey;
    } while (cursor);
    return rows;
  }
  return {
    async list() {
      const rows: Row[] = [];
      let cursor: Record<string, any> | undefined;
      do {
        const page = await client.send(new ScanCommand({ TableName: table(), FilterExpression: 'sk = :meta', ExpressionAttributeValues: { ':meta': 'META' }, ExclusiveStartKey: cursor }));
        rows.push(...(page.Items || []));
        cursor = page.LastEvaluatedKey;
      } while (cursor);
      return { items: rows.sort((a, b) => a.catalogOrder - b.catalogOrder || a.seriesId.localeCompare(b.seriesId)).map(row => ({
        seriesId: row.seriesId, title: row.title, synopsis: row.synopsis, coverUrl: row.coverUrl,
        publicationStatus: row.publicationStatus, catalogOrder: row.catalogOrder,
        episodeCount: row.episodeCount || 0, totalEpisodeCount: row.totalEpisodeCount ?? row.episodeCount ?? 0,
        chatCharacterIds: row.chatCharacterIds, version: row.version,
        createdAt: row.createdAt, updatedAt: row.updatedAt,
      })), generatedAt: new Date().toISOString() };
    },
    async get(seriesId: string) {
      const rows = await read(seriesId);
      const meta = rows.find(row => row.sk === 'META');
      if (!meta) throw new AdminMicrodramaError(404, 'MICRODRAMA_NOT_FOUND', 'No encontramos esta serie.');
      return { manifest: manifestFromRows(rows), version: meta.version as number, createdAt: meta.createdAt as string, updatedAt: meta.updatedAt as string };
    },
    async save(input: unknown, expectedVersion: number, routeSeriesId?: string) {
      if (!Number.isInteger(expectedVersion) || expectedVersion < 0) invalid('Falta la versión de la serie.');
      const manifest = normalizeAdminMicrodrama(input);
      if (routeSeriesId && routeSeriesId !== manifest.series.seriesId) invalid('El identificador de la serie no puede cambiar.');
      const available = await characters.listCharacters();
      const known = new Set(available.map(character => character.characterId));
      if (manifest.series.chatCharacterIds.some(id => !known.has(id))) invalid('Uno de los personajes seleccionados ya no existe.');
      if (manifest.series.publicationStatus === 'published') {
        const errors = validateMicrodramaManifest({ ...manifest, episodes: manifest.episodes.filter(episode => episode.publicationStatus === 'published') }, available);
        if (errors.length) throw new AdminMicrodramaError(400, 'MICRODRAMA_NOT_READY', 'Para publicar completa la portada, sinopsis, personajes y videos con duración. Publica al menos un episodio y mantén su numeración consecutiva.', errors);
      }
      const oldRows = await read(manifest.series.seriesId);
      const meta = oldRows.find(row => row.sk === 'META');
      if ((meta?.version ?? 0) !== expectedVersion) throw new AdminMicrodramaError(409, 'MICRODRAMA_VERSION_CONFLICT', 'La serie ya existe o cambió en otra sesión. Recarga antes de guardar.');
      if (expectedVersion && !meta) throw new AdminMicrodramaError(404, 'MICRODRAMA_NOT_FOUND', 'No encontramos esta serie.');
      const oldByKey = new Map(oldRows.map(row => [row.sk, row]));
      const items = toMicrodramaDynamoItems(manifest).map(item => ({ ...item, createdAt: oldByKey.get(item.sk)?.createdAt || item.createdAt }));
      Object.assign(items[0], { version: expectedVersion + 1, totalEpisodeCount: manifest.episodes.length });
      const keys = new Set(items.map(item => item.sk));
      const removed = oldRows.filter(row => row.sk.startsWith('EPISODE#') && !keys.has(row.sk));
      if (items.length + removed.length > 100) invalid('Hay demasiados cambios de episodios en una sola operación. Guarda las eliminaciones antes de agregar nuevos episodios.');
      try {
        await client.send(new TransactWriteCommand({ TransactItems: [
          ...items.map(item => ({ Put: {
            TableName: table(), Item: item,
            ...(item.sk === 'META' ? expectedVersion ? {
              ConditionExpression: '#version = :version', ExpressionAttributeNames: { '#version': 'version' }, ExpressionAttributeValues: { ':version': expectedVersion },
            } : { ConditionExpression: 'attribute_not_exists(pk)' } : {}),
          } })),
          ...removed.map(row => ({ Delete: { TableName: table(), Key: { pk: row.pk, sk: row.sk } } })),
        ] }));
      } catch (error) { conflict(error); }
      return { manifest, version: expectedVersion + 1, createdAt: items[0].createdAt, updatedAt: items[0].updatedAt };
    },
    async delete(seriesId: string, expectedVersion: number) {
      if (!Number.isInteger(expectedVersion) || expectedVersion < 1) invalid('Falta la versión de la serie.');
      const rows = await read(seriesId);
      const meta = rows.find(row => row.sk === 'META');
      if (!meta) throw new AdminMicrodramaError(404, 'MICRODRAMA_NOT_FOUND', 'No encontramos esta serie.');
      if (meta.publicationStatus !== 'draft') invalid('Primero retira la serie del catálogo guardándola como borrador.');
      if (rows.length > 100) invalid('Reduce la cantidad de episodios antes de eliminar esta serie.');
      try {
        await client.send(new TransactWriteCommand({ TransactItems: rows.map(row => ({ Delete: {
          TableName: table(), Key: { pk: row.pk, sk: row.sk },
          ...(row.sk === 'META' ? { ConditionExpression: '#version = :version', ExpressionAttributeNames: { '#version': 'version' }, ExpressionAttributeValues: { ':version': expectedVersion } } : {}),
        } })) }));
      } catch (error) { conflict(error); }
      return { deleted: true, seriesId };
    },
  };
}
