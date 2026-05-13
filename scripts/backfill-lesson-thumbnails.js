/**
 * Backfill thumbnails para todas las lecciones que tienen videoKey pero no thumbnailKey.
 * Extrae el frame del segundo 2 del video, lo guarda como WebP 512x512 en S3
 * y actualiza el registro en DynamoDB.
 *
 * Uso:
 *   AWS_PROFILE=david node scripts/backfill-lesson-thumbnails.js
 *
 * Requiere:
 *   - AWS credentials con acceso a DynamoDB y S3
 *   - ffmpeg-static instalado en backend/node_modules
 */

'use strict';

const path = require('path');
const { execFileSync } = require('child_process');
const { mkdtempSync, writeFileSync, readFileSync, unlinkSync, existsSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');

// Resuelve los módulos desde backend/node_modules si no están disponibles localmente
function req(mod) {
  try { return require(mod); }
  catch { return require(path.join(__dirname, '../backend/node_modules', mod)); }
}

const { DynamoDBClient } = req('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = req('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand, PutObjectCommand } = req('@aws-sdk/client-s3');

// ── Config ────────────────────────────────────────────────────────────────────
const REGION = process.env.AWS_REGION || 'us-west-2';
const LESSONS_TABLE = process.env.LESSONS_TABLE_NAME || 'LuvaStack-LessonsTableA5C40CCF-162BHQTYBP2PS';
const ASSETS_BUCKET = process.env.ASSETS_BUCKET_NAME || 'luvastack-assetsbucket5cb76180-72mxmgd2mycf';
const ASSETS_BASE_URL = process.env.ASSETS_CLOUDFRONT_URL || 'https://d2ozl81tz5pxlo.cloudfront.net';
const FFMPEG_BIN = process.env.FFMPEG_BIN || join(__dirname, '../backend/node_modules/ffmpeg-static/ffmpeg');
const FRAME_SECOND = 2; // segundo desde el que extraer el frame

// ── AWS clients ───────────────────────────────────────────────────────────────
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({ region: REGION });

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getObjectBuffer(bucket, key) {
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const chunks = [];
  for await (const chunk of out.Body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function listAllLessons() {
  const items = [];
  let lastKey;
  do {
    const page = await dynamo.send(new ScanCommand({
      TableName: LESSONS_TABLE,
      ExclusiveStartKey: lastKey,
    }));
    items.push(...(page.Items || []));
    lastKey = page.LastEvaluatedKey;
  } while (lastKey);
  return items;
}

async function generateThumbnail(lesson) {
  const { lessonId, videoKey } = lesson;
  console.log(`  Descargando video: ${videoKey}`);
  const videoBuffer = await getObjectBuffer(ASSETS_BUCKET, videoKey);

  const tmpDir = mkdtempSync(join(tmpdir(), 'luva-thumb-'));
  const videoPath = join(tmpDir, 'input.mp4');
  const thumbPath = join(tmpDir, 'thumbnail.webp');

  try {
    writeFileSync(videoPath, videoBuffer);

    execFileSync(FFMPEG_BIN, [
      '-ss', String(FRAME_SECOND),
      '-i', videoPath,
      '-vframes', '1',
      '-vf', 'scale=512:512:force_original_aspect_ratio=increase,crop=512:512',
      '-compression_level', '5',
      '-y', thumbPath,
    ], { timeout: 60_000 });

    const thumbnailBuffer = readFileSync(thumbPath);
    const sizeKb = (thumbnailBuffer.length / 1024).toFixed(1);
    console.log(`  Thumbnail generado: ${sizeKb} KB`);

    const thumbnailKey = `lessons/${lessonId}/thumbnail.webp`;
    await s3.send(new PutObjectCommand({
      Bucket: ASSETS_BUCKET,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }));

    const now = new Date().toISOString();
    await dynamo.send(new UpdateCommand({
      TableName: LESSONS_TABLE,
      Key: { lessonId },
      UpdateExpression: 'SET thumbnailKey = :k, updatedAt = :now',
      ExpressionAttributeValues: { ':k': thumbnailKey, ':now': now },
    }));

    const url = `${ASSETS_BASE_URL}/${thumbnailKey}`;
    console.log(`  Guardado: ${url}`);
    return { ok: true, url };
  } finally {
    try { unlinkSync(videoPath); } catch {}
    try { unlinkSync(thumbPath); } catch {}
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(FFMPEG_BIN)) {
    console.error(`ffmpeg no encontrado en: ${FFMPEG_BIN}`);
    console.error('Ejecuta: cd backend && npm install');
    process.exit(1);
  }

  console.log('Leyendo lecciones de DynamoDB...');
  const lessons = await listAllLessons();

  const pending = lessons.filter((l) => l.videoKey && !l.thumbnailKey);
  const alreadyDone = lessons.filter((l) => l.thumbnailKey).length;

  console.log(`Total lecciones: ${lessons.length}`);
  console.log(`Ya tienen thumbnail: ${alreadyDone}`);
  console.log(`Sin thumbnail (a procesar): ${pending.length}\n`);

  if (pending.length === 0) {
    console.log('Nada que hacer.');
    return;
  }

  let ok = 0;
  let failed = 0;

  for (const lesson of pending) {
    console.log(`[${ok + failed + 1}/${pending.length}] ${lesson.title || lesson.lessonId}`);
    try {
      await generateThumbnail(lesson);
      ok++;
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      failed++;
    }
    console.log('');
  }

  console.log(`Completado: ${ok} OK, ${failed} errores`);
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
