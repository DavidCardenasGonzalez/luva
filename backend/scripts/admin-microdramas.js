#!/usr/bin/env node
'use strict';

const { createInterface } = require('node:readline/promises');
const { Writable } = require('node:stream');
const { openAsBlob } = require('node:fs');
const { readFile, stat } = require('node:fs/promises');
const { basename, dirname, extname, resolve } = require('node:path');
const { execFile, spawn } = require('node:child_process');
const { isDeepStrictEqual, parseArgs, parseEnv, promisify } = require('node:util');
const { setTimeout: delay } = require('node:timers/promises');

const USAGE = `npm --prefix backend run microdramas:admin -- <comando> --stage dev|prod

  list
  show    --series ID
  install --manifest SERIE.json [--publish] [--apply]
  append  --series ID --first N [--title TITULO] [--subtitles EN.srt] [--publish] [--apply] VIDEO...
  publish --series ID [--through N] [--apply]

--apply guarda el cambio. Sin esa opción se muestra el plan.
--email CORREO inicia sesión con Cognito; LUVA_ADMIN_ID_TOKEN acepta un token existente.`;

const COMMANDS = {
  list: [],
  show: ['series'],
  install: ['manifest', 'publish', 'apply'],
  append: ['series', 'first', 'title', 'subtitles', 'publish', 'apply'],
  publish: ['series', 'through', 'apply'],
};
const ID = /^[a-z0-9][a-z0-9_-]{0,79}$/;
const SRT = /\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/;
const workingDirectory = process.env.INIT_CWD || process.cwd();
const execFileAsync = promisify(execFile);
const UPLOAD = {
  cover: { folder: 'microdramaCovers', maxMb: 10 },
  video: { folder: 'microdramaVideos', maxMb: 500 },
  subtitles: { folder: 'microdramaSubtitles', maxMb: 2 },
};

function parseCommand(argv) {
  const [command, ...args] = argv;
  if (command === undefined || argv.includes('--help')) return null;
  if (!Object.hasOwn(COMMANDS, command)) throw new Error('Comando desconocido. Usa --help.');
  const flags = [...COMMANDS[command], 'stage', 'email'];
  const { values, positionals } = parseArgs({
    args,
    options: Object.fromEntries(flags.map(flag => [flag, { type: ['apply', 'publish'].includes(flag) ? 'boolean' : 'string' }])),
    allowPositionals: command === 'append',
  });
  if (!['dev', 'prod'].includes(values.stage)) throw new Error('Indica --stage dev o --stage prod.');
  if (flags.includes('series') && !ID.test(values.series || '')) throw new Error('Indica un identificador válido con --series.');
  if (command === 'install' && !values.manifest) throw new Error('Indica --manifest SERIE.json.');
  if (command === 'append') {
    if (!positionals.length) throw new Error('Indica al menos un archivo de video.');
    if (positionals.length > 1 && (values.title !== undefined || values.subtitles !== undefined)) {
      throw new Error('--title y --subtitles se usan con un solo video.');
    }
  }
  for (const flag of ['first', 'through']) {
    if ((flag !== 'first' || command !== 'append') && values[flag] === undefined) continue;
    const number = Number(values[flag]);
    if (!/^\d+$/.test(values[flag] || '') || number < 1 || number > 99) throw new Error(`--${flag} requiere un entero de 1 a 99.`);
    values[flag] = number;
  }
  return { command, values, positionals };
}

async function request(url, { method = 'GET', headers, body, timeout = 30000, label, adminError = false }) {
  let response;
  try {
    response = await fetch(url, { method, headers, body, redirect: 'error', signal: AbortSignal.timeout(timeout) });
  } catch {
    throw new Error(`${label}: error de conexión o tiempo de espera.`);
  }
  if (!response.ok) {
    const error = new Error(`${label}: HTTP ${response.status}`);
    error.status = response.status;
    if (adminError) {
      const payload = await response.json().catch(() => null);
      if (/^[A-Z][A-Z_]{1,79}$/.test(payload?.code || '')) {
        error.code = payload.code;
        error.message += ` (${error.code})`;
      }
    } else {
      await response.body?.cancel();
    }
    throw error;
  }
  return response;
}

async function ask(question, hidden = false) {
  if (!process.stdin.isTTY || !process.stderr.isTTY) throw new Error('Usa una terminal interactiva o provee LUVA_ADMIN_ID_TOKEN.');
  const output = hidden ? new Writable({ write(_chunk, _encoding, done) { done(); } }) : process.stderr;
  const terminal = createInterface({ input: process.stdin, output, terminal: true, historySize: 0 });
  const abort = new AbortController();
  terminal.once('SIGINT', () => abort.abort());
  terminal.once('close', () => abort.abort());
  if (hidden) process.stderr.write(question);
  try {
    return await terminal.question(hidden ? '' : question, { signal: abort.signal });
  } finally {
    terminal.close();
    if (hidden) process.stderr.write('\n');
  }
}

function keychainService(stage, clientId) {
  return `luva-microdramas-admin-${stage}-${clientId}`;
}

async function readKeychainRefreshToken(service) {
  if (process.platform !== 'darwin') return undefined;
  try {
    const { stdout } = await execFileAsync('security', [
      'find-generic-password', '-s', service, '-a', 'default', '-w',
    ], { timeout: 10000 });
    return stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

async function saveKeychainRefreshToken(service, refreshToken) {
  if (process.platform !== 'darwin' || !refreshToken) return;
  await new Promise((resolve, reject) => {
    const command = spawn('security', [
      'add-generic-password', '-U', '-s', service, '-a', 'default', '-w',
    ], { stdio: ['pipe', 'ignore', 'ignore'] });
    command.once('error', () => reject(new Error('No se pudo guardar la sesión en el Llavero de macOS.')));
    command.once('close', code => {
      if (code === 0) resolve();
      else reject(new Error('No se pudo guardar la sesión en el Llavero de macOS.'));
    });
    command.stdin.end(refreshToken);
  });
}

async function refreshCognitoSession(domain, clientId, refreshToken) {
  const form = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
  });
  const response = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    await response.body?.cancel();
    return undefined;
  }
  return response.json();
}

async function connect(options) {
  const file = options.stage === 'prod' ? '.env' : '.env.development';
  const local = await readFile(resolve(__dirname, '../../admin', file), 'utf8')
    .then(parseEnv).catch(error => { if (error.code === 'ENOENT') return {}; throw error; });
  const base = (process.env.LUVA_ADMIN_API_BASE_URL || local.VITE_ADMIN_API_BASE_URL || '').replace(/\/+$/, '');
  const api = URL.canParse(base) && new URL(base);
  if (!api || api.protocol !== 'https:' || api.username || api.password || api.search || api.hash || api.pathname !== `/${options.stage}/v1/admin`) {
    throw new Error(`Configura admin/${file} o LUVA_ADMIN_API_BASE_URL con la URL HTTPS de /${options.stage}/v1/admin.`);
  }
  let localCredentials = {};
  try {
    const credentials = JSON.parse(await readFile(resolve(__dirname, 'environment.local.json'), 'utf8'));
    if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
      throw new Error('invalid credentials file');
    }
    localCredentials = credentials;
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('backend/scripts/environment.local.json debe contener JSON válido.');
  }
  let token = process.env.LUVA_ADMIN_ID_TOKEN?.trim();
  if (!token) {
    const clientId = process.env.LUVA_ADMIN_COGNITO_CLIENT_ID || local.VITE_COGNITO_CLIENT_ID;
    const domain = (process.env.LUVA_ADMIN_COGNITO_DOMAIN || local.VITE_COGNITO_DOMAIN || '').replace(/\/+$/, '');
    const region = process.env.LUVA_ADMIN_COGNITO_REGION
      || local.VITE_COGNITO_DOMAIN?.match(/\.auth\.([\w-]+)\.amazoncognito\.com(?:\/|$)/)?.[1]
      || api.hostname.match(/\.execute-api\.([\w-]+)\.amazonaws\.com$/)?.[1];
    if (!clientId || !URL.canParse(domain) || new URL(domain).protocol !== 'https:'
        || !/^[a-z]{2}(-[a-z0-9]+)+-\d+$/.test(region || '')) {
      throw new Error('Configura el cliente y región de Cognito o provee LUVA_ADMIN_ID_TOKEN.');
    }
    const service = keychainService(options.stage, clientId);
    const refreshToken = await readKeychainRefreshToken(service)
      || process.env.LUVA_ADMIN_REFRESH_TOKEN?.trim()
      || (typeof localCredentials.LUVA_ADMIN_REFRESH_TOKEN === 'string'
        ? localCredentials.LUVA_ADMIN_REFRESH_TOKEN.trim() : '');
    if (refreshToken) {
      const refreshed = await refreshCognitoSession(domain, clientId, refreshToken).catch(() => undefined);
      if (refreshed?.id_token && refreshed?.access_token) {
        token = refreshed.id_token;
        await saveKeychainRefreshToken(service, refreshed.refresh_token || refreshToken);
      }
    }
    const fileToken = typeof localCredentials.LUVA_ADMIN_ID_TOKEN === 'string'
      ? localCredentials.LUVA_ADMIN_ID_TOKEN.trim() : '';
    if (!token && fileToken) {
      try {
        const payload = JSON.parse(Buffer.from(fileToken.split('.')[1], 'base64url').toString('utf8'));
        if (payload.exp * 1000 > Date.now() + 60000) token = fileToken;
      } catch {
        // Fall through to interactive sign-in when the configured token is invalid.
      }
    }
    if (!token) {
      const email = (options.email || process.env.LUVA_ADMIN_EMAIL || await ask('Correo de administrador: ')).trim().toLowerCase();
      if (!email) throw new Error('Falta el correo de administrador.');
      const password = await ask('Contraseña de Cognito: ', true);
      if (!password) throw new Error('Falta la contraseña de Cognito.');
      const response = await request(`https://cognito-idp.${region}.amazonaws.com/`, {
        label: 'Inicio de sesión de Cognito',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-amz-json-1.1', 'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth' },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH', ClientId: clientId,
          AuthParameters: { USERNAME: email, PASSWORD: password },
        }),
      });
      const auth = await response.json();
      token = auth.AuthenticationResult?.IdToken;
      if (!token) throw new Error('La cuenta requiere completar el inicio de sesión en Cognito y usar LUVA_ADMIN_ID_TOKEN.');
      await saveKeychainRefreshToken(service, auth.AuthenticationResult.RefreshToken);
    }
  }
  return {
    async admin(method, path, body) {
      const response = await request(base + path, {
        method, label: `${method} ${path}`, adminError: true,
        headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body && JSON.stringify(body),
      });
      return response.json();
    },
    async publicSeries(path) {
      const response = await request(base.slice(0, -'/admin'.length) + path, { label: 'Verificación del catálogo' });
      return response.json();
    },
  };
}

async function videoDuration(file) {
  const ffmpeg = process.env.FFMPEG || require('ffmpeg-static');
  try {
    const { stderr } = await promisify(execFile)(ffmpeg, ['-hide_banner', '-nostdin', '-i', file,
      '-map', '0:v:0', '-t', '0', '-f', 'null', '-'], { timeout: 15000 });
    const duration = stderr.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (duration) {
      const ms = Math.round((Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3])) * 1000);
      if (Number.isSafeInteger(ms) && ms > 0) return ms;
    }
  } catch {
    throw new Error(`No se pudo leer el video ${basename(file)}. Revisa el archivo y el binario FFmpeg.`);
  }
  throw new Error(`El video ${basename(file)} no tiene duración válida.`);
}

async function prepareAsset(assets, root, kind, owner, field, fileName) {
  if (fileName === undefined) return;
  if (typeof fileName !== 'string' || !fileName.trim() || owner[field]) {
    throw new Error(`Indica un archivo válido o una URL para ${kind}.`);
  }
  const file = resolve(root, fileName);
  const { folder, maxMb } = UPLOAD[kind];
  const info = await stat(file);
  if (!info.isFile() || !info.size || info.size > maxMb * 1024 * 1024) {
    throw new Error(`${basename(file)} debe ser un archivo de hasta ${maxMb} MB.`);
  }
  const { normalizeAdminAssetUploadRequest } = require('../dist/admin/assets');
  const name = kind === 'cover' ? 'series-cover.webp' : basename(file);
  const { contentType } = normalizeAdminAssetUploadRequest({ folder, fileName: name });
  if (kind === 'subtitles' && !SRT.test(await readFile(file, 'utf8'))) {
    throw new Error(`${basename(file)} debe ser un SRT válido. Usa subtítulos en inglés.`);
  }
  if (kind === 'video') owner.durationMs = await videoDuration(file);
  const body = kind === 'cover'
    ? await require('sharp')(file).rotate().resize(480, 682, { fit: 'cover' }).webp({ quality: 78 }).toBuffer()
    : await openAsBlob(file);
  owner[field] = 'https://local.invalid/pending-upload';
  assets.push({ owner, field, folder, contentType, name, file, body });
}

function validate(manifest, characters) {
  const { normalizeAdminMicrodrama } = require('../dist/admin/microdramas');
  const { validateMicrodramaManifest } = require('../dist/microdramas-data');
  const normalized = normalizeAdminMicrodrama(manifest);
  const { series, episodes } = normalized;
  const known = characters ?? series.chatCharacterIds.map(characterId => ({ characterId }));
  if (series.chatCharacterIds.some(id => !known.some(character => character.characterId === id))) {
    throw new Error('Uno de los personajes de la serie no existe en el ambiente de destino.');
  }
  if (series.publicationStatus === 'published') {
    const errors = validateMicrodramaManifest({ series, episodes: episodes.filter(ep => ep.publicationStatus === 'published') }, known);
    if (errors.length) throw new Error(errors.join(' | '));
  }
  return normalized;
}

async function install(options, assets) {
  const file = resolve(workingDirectory, options.manifest);
  const root = dirname(file);
  const input = JSON.parse(await readFile(file, 'utf8'));
  if (!input?.series || typeof input.series !== 'object' || Array.isArray(input.series)
      || !Array.isArray(input.episodes) || input.episodes.length > 99) {
    throw new Error('El manifiesto requiere series y una lista de hasta 99 episodios.');
  }
  const publicationStatus = options.publish ? 'published' : 'draft';
  const series = { chatCharacterIds: [], catalogOrder: 0, ...input.series, publicationStatus };
  const episodes = input.episodes.map((episode, index) => {
    if (!episode || typeof episode !== 'object' || Array.isArray(episode)) throw new Error(`Revisa el episodio ${index + 1} del manifiesto.`);
    const episodeNumber = episode.episodeNumber ?? index + 1;
    return {
      episodeNumber, episodeId: `ep-${episodeNumber}`, title: `Episodio ${episodeNumber}`,
      durationMs: 0, ...episode, publicationStatus,
    };
  });
  await prepareAsset(assets, root, 'cover', series, 'coverUrl', series.coverFile);
  for (const episode of episodes) {
    await prepareAsset(assets, root, 'video', episode, 'videoUrl', episode.videoFile);
    await prepareAsset(assets, root, 'subtitles', episode, 'subtitlesUrl', episode.subtitlesFile);
  }
  return { series, episodes };
}

async function append(manifest, options, videos, assets) {
  const first = manifest.episodes.length + 1;
  if (options.first !== first) {
    throw new Error(`El siguiente episodio es ${first}. Consulta show antes de repetir una carga o cambiar la numeración.`);
  }
  if (first + videos.length - 1 > 99) throw new Error('Una serie admite hasta 99 episodios.');
  if (options.publish && manifest.series.publicationStatus !== 'published') {
    throw new Error('La serie es un borrador. Agrega los episodios y usa publish para publicar la serie.');
  }
  const usedIds = new Set(manifest.episodes.map(episode => episode.episodeId));
  for (const [index, video] of videos.entries()) {
    const episodeNumber = first + index;
    const baseId = `ep-${episodeNumber}`;
    let episodeId = baseId;
    // Reordering can leave the default ID assigned to a different episode.
    for (let suffix = 2; usedIds.has(episodeId); suffix++) episodeId = `${baseId}-${suffix}`;
    usedIds.add(episodeId);
    const episode = {
      episodeId, episodeNumber, title: options.title ?? `Episodio ${episodeNumber}`,
      publicationStatus: options.publish ? 'published' : 'draft',
    };
    const sibling = video.slice(0, video.length - extname(video).length) + '_en.srt';
    const subtitles = options.subtitles ?? await stat(resolve(workingDirectory, sibling))
      .then(() => sibling).catch(error => { if (error.code !== 'ENOENT') throw error; });
    await prepareAsset(assets, workingDirectory, 'video', episode, 'videoUrl', video);
    await prepareAsset(assets, workingDirectory, 'subtitles', episode, 'subtitlesUrl', subtitles);
    manifest.episodes.push(episode);
  }
}

function publish(manifest, through = manifest.episodes.length) {
  if (through > manifest.episodes.length || !through) throw new Error('Indica un rango de episodios existente.');
  manifest.series.publicationStatus = 'published';
  for (const episode of manifest.episodes.slice(0, through)) episode.publicationStatus = 'published';
}

function summary(detail) {
  const { series, episodes } = detail.manifest;
  return {
    seriesId: series.seriesId, title: series.title, status: series.publicationStatus, version: detail.version,
    episodes: episodes.map(({ episodeId, episodeNumber, title, durationMs, publicationStatus, subtitlesUrl }) => ({
      episodeId, episodeNumber, title, durationMs, status: publicationStatus, subtitles: Boolean(subtitlesUrl),
    })),
  };
}

async function upload(client, asset) {
  process.stderr.write(`Subiendo ${basename(asset.file)}…\n`);
  const target = await client.admin('POST', '/assets/upload', {
    folder: asset.folder, contentType: asset.contentType, fileName: asset.name,
  });
  if (!URL.canParse(target.uploadUrl) || new URL(target.uploadUrl).protocol !== 'https:'
      || !URL.canParse(target.url) || new URL(target.url).protocol !== 'https:') {
    throw new Error('La API devolvió un destino de carga inválido.');
  }
  await request(target.uploadUrl, {
    method: 'PUT', label: `Subida de ${basename(asset.file)}`, timeout: 10 * 60 * 1000, body: asset.body,
    headers: { 'Content-Type': target.contentType, 'Cache-Control': target.cacheControl },
  });
  asset.owner[asset.field] = target.url;
}

async function verifyPublic(client, path, manifest) {
  const { series, episodes } = manifest;
  if (series.publicationStatus !== 'published') return;
  const expected = episodes.filter(ep => ep.publicationStatus === 'published');
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await delay(1000);
    const detail = await client.publicSeries(path).catch(error => { if (error.status !== 404) throw error; });
    if (detail?.series?.seriesId === series.seriesId && detail.series.coverUrl === series.coverUrl
        && detail.episodes.length === expected.length
        && detail.episodes.every((episode, i) => episode.episodeId === expected[i].episodeId
          && episode.videoUrl === expected[i].videoUrl && episode.subtitlesUrl === expected[i].subtitlesUrl)) return;
  }
  throw new Error('El catálogo aún no refleja todos los episodios guardados.');
}

async function main() {
  const input = parseCommand(process.argv.slice(2));
  if (!input) return console.log(USAGE);
  const { command, values: options, positionals } = input;
  const assets = [];
  const basePath = '/microdramas';
  let manifest;
  let planned;
  if (command === 'install') {
    manifest = await install(options, assets);
    planned = validate(manifest);
    if (!options.apply) {
      return console.log(JSON.stringify({ stage: options.stage, mode: 'plan', uploads: assets.length, ...summary({ manifest: planned }) }, null, 2));
    }
  }

  const client = await connect(options);
  if (command === 'list') {
    const { items } = await client.admin('GET', basePath);
    return console.log(JSON.stringify(items.map(({ seriesId, title, publicationStatus, totalEpisodeCount, episodeCount, version }) => ({
      seriesId, title, status: publicationStatus, totalEpisodeCount, episodeCount, version,
    })), null, 2));
  }
  const path = `${basePath}/${options.series ?? planned.series.seriesId}`;
  let current;
  if (command === 'install') {
    const existing = await client.admin('GET', path).catch(error => {
      if (error.code !== 'MICRODRAMA_NOT_FOUND') throw error;
    });
    if (existing) throw new Error('La serie ya existe. Usa show para verificar su estado.');
  } else {
    current = await client.admin('GET', path);
    if (command === 'show') return console.log(JSON.stringify(summary(current), null, 2));
    manifest = structuredClone(current.manifest);
    if (command === 'append') await append(manifest, options, positionals, assets);
    else publish(manifest, options.through);
  }
  const { characters } = await client.admin('GET', '/story-characters');
  planned = validate(manifest, characters);
  if (!options.apply) {
    return console.log(JSON.stringify({ stage: options.stage, mode: 'plan', uploads: assets.length, ...summary({ manifest: planned, version: current?.version }) }, null, 2));
  }
  if (isDeepStrictEqual(planned, current?.manifest) && !assets.length) {
    await verifyPublic(client, path, planned);
    return console.log(JSON.stringify({ stage: options.stage, mode: 'unchanged', ...summary(current) }, null, 2));
  }
  for (const asset of assets) await upload(client, asset);
  const ready = validate(manifest, characters);
  try {
    const saved = current
      ? await client.admin('PUT', path, { manifest: ready, expectedVersion: current.version })
      : await client.admin('POST', basePath, { manifest: ready });
    const verified = await client.admin('GET', path);
    if (verified.version !== saved.version || !isDeepStrictEqual(verified.manifest, ready)) {
      throw new Error('La lectura administrativa no coincide con el guardado.');
    }
    await verifyPublic(client, path, ready);
    console.log(JSON.stringify({ stage: options.stage, mode: 'applied', ...summary(verified) }, null, 2));
  } catch (error) {
    throw new Error(`${error.message} Consulta show antes de reintentar.`);
  }
}

main().catch(error => {
  if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('../dist/')) {
    console.error('Compila el backend con npm --prefix backend run build.');
  } else {
    console.error(error.name === 'SyntaxError' ? 'No se pudo leer un JSON válido.' : error.message);
  }
  process.exitCode = 1;
});
