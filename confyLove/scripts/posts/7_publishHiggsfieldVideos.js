/**
 * Publishes the Higgsfield video posts via the SAME admin HTTP API the portal
 * uses. This guarantees every server-side feature runs identically to the UI:
 *
 *   - Asset upload through /v1/admin/assets/upload (presigned S3 PUT)
 *   - Mobile MP4 compression via local ffmpeg-static with the exact flags
 *     `optimizeVideoForMobile()` uses in admin/src/features/admin/ui/
 *     AdminCharacterPostsPage.tsx
 *   - Thumbnail captured at ~1s, exported as WebP full (720x1280, q=0.82) and
 *     md (360x640, q=0.78) — same shape as the in-browser canvas variants
 *   - Whisper subtitles, order auto-assignment, defaulted suggested replies,
 *     avatar variant resolution — all handled server-side once the POST hits
 *     /v1/admin/story-characters/{characterId}/posts
 *
 * Source data: higgsfield_videos_june19_20_classified.json
 * Local files: /Users/cardenas/Desktop/Luva Personajes/<folder>/<filename>
 * Tracking:    published_higgsfield_videos.json (idempotency)
 *
 * Run:
 *   node confyLove/scripts/posts/7_publishHiggsfieldVideos.js
 *   node confyLove/scripts/posts/7_publishHiggsfieldVideos.js --dry-run
 *   node confyLove/scripts/posts/7_publishHiggsfieldVideos.js --character initials:meet_zoe_first_mission
 *   node confyLove/scripts/posts/7_publishHiggsfieldVideos.js --limit 1
 *
 * Required env (confyLove/scripts/.env):
 *   LUVA_ADMIN_JWT_TOKEN  Cognito ID token for an admin user
 *   LUVA_ADMIN_API_URL    optional override, defaults to prod stack
 */

const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const dotenv = require("dotenv");
const ffmpegPath = require("ffmpeg-static");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// ── Config ────────────────────────────────────────────────────────────────────

const SOURCE_JSON = path.join(
  __dirname,
  "higgsfield_videos_june19_20_classified.json",
);
const TRACKING_JSON = path.join(__dirname, "published_higgsfield_videos.json");
const VIDEOS_ROOT = "/Users/cardenas/Desktop/Luva Personajes";

const ADMIN_API_URL =
  process.env.LUVA_ADMIN_API_URL ||
  "https://45vwgzmxke.execute-api.us-west-2.amazonaws.com/prod/v1/admin";
const COGNITO_DOMAIN =
  process.env.LUVA_COGNITO_DOMAIN ||
  "https://luva-luvastack-863186504931-us-west-2-v2.auth.us-west-2.amazoncognito.com";
const COGNITO_CLIENT_ID =
  process.env.LUVA_COGNITO_CLIENT_ID || "15actpb2oufovi6ffjfas2al02";
const ADMIN_REFRESH_TOKEN = process.env.LUVA_ADMIN_REFRESH_TOKEN;

// In-memory token cache. Starts with whatever is in .env, then auto-refreshes
// using the Cognito refresh token whenever the cached ID token is within 60s
// of expiry. Refresh tokens last ~30 days, so the user only has to paste once.
let cachedIdToken = process.env.LUVA_ADMIN_JWT_TOKEN || "";

const ARGS = parseArgs(process.argv.slice(2));

// ── ffmpeg compression strategy ───────────────────────────────────────────────
// Admin portal flags target a 720p downscale at CRF 28 with a 1600 kb/s cap —
// that's right for high-bitrate sources but visibly degrades 480p material
// (most Higgsfield outputs are 496×864 @ 5 Mb/s). When the source is already
// ≤720 on its long edge we keep the same normalization (yuv420p, +faststart,
// 30 fps, AAC) but drop the bitrate cap and tighten CRF to 20.

function buildVideoCompressFlags(inputPath, outputPath, sourceMinDim) {
  // Check the SHORT edge: vertical 9:16 480p is ~496×864 (short=496) and
  // 720p is 720×1280 (short=720). Anything ≤720 on its short edge is already
  // at or below our target output, so we drop the bitrate cap and tighten CRF.
  const isLowRes = sourceMinDim > 0 && sourceMinDim <= 720;
  const crf = isLowRes ? "20" : "28";
  const bitrateCap = isLowRes ? [] : ["-maxrate", "1600k", "-bufsize", "3200k"];

  return [
    "-y",
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-map",
    "0:a?",
    "-vf",
    "scale=w='min(720,iw)':h='min(1280,ih)':force_original_aspect_ratio=decrease,scale=w='trunc(iw/2)*2':h='trunc(ih/2)*2',setsar=1",
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    crf,
    ...bitrateCap,
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "96k",
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    outputPath,
  ];
}

// libwebp quality is 0-100 — admin uses canvas WebP at 0.82 (full) and 0.78 (md)
const THUMBNAIL_FULL = { maxWidth: 720, maxHeight: 1280, quality: 82 };
const THUMBNAIL_MD = { maxWidth: 360, maxHeight: 640, quality: 78 };

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!cachedIdToken && !ADMIN_REFRESH_TOKEN) {
    fail(
      "Falta LUVA_ADMIN_JWT_TOKEN o LUVA_ADMIN_REFRESH_TOKEN en confyLove/scripts/.env.\n" +
        "  Copia desde el portal admin (devtools → Application → Local Storage):\n" +
        "    LUVA_ADMIN_JWT_TOKEN     ← valor de  luva_admin_id\n" +
        "    LUVA_ADMIN_REFRESH_TOKEN ← valor de  luva_admin_refresh (recomendado, evita expiraciones a mitad de batch)",
    );
  }

  const videos = JSON.parse(await fsp.readFile(SOURCE_JSON, "utf-8"));
  const tracking = await loadTracking();

  const queue = videos.filter((video) => {
    if (!video.characterId) return false;
    if (!video.caption || !video.context) return false;
    if (!ARGS.force && tracking.publishedByFilename[video.filename]) return false;
    if (ARGS.character && video.characterId !== ARGS.character) return false;
    return true;
  });

  const planned = ARGS.limit ? queue.slice(0, ARGS.limit) : queue;

  console.log(
    `Encontrados ${planned.length} videos por publicar` +
      (ARGS.character ? ` (filtro: ${ARGS.character})` : "") +
      (ARGS.limit ? ` (límite: ${ARGS.limit})` : "") +
      (ARGS.dryRun ? " — dry-run" : ""),
  );
  if (!planned.length) {
    console.log("Nada que hacer.");
    return;
  }

  const tmpRoot = await fsp.mkdtemp(
    path.join(os.tmpdir(), "luva-publish-videos-"),
  );

  let successCount = 0;
  let failCount = 0;
  const failures = [];

  for (let i = 0; i < planned.length; i += 1) {
    const video = planned[i];
    const label = `[${i + 1}/${planned.length}] ${video.filename}`;
    console.log(`\n${label}`);
    console.log(`  characterId: ${video.characterId}`);

    try {
      await publishOne(video, tmpRoot, tracking);
      successCount += 1;
      await saveTracking(tracking);
    } catch (error) {
      failCount += 1;
      const message = error?.message || String(error);
      console.error(`  ✗ Falló: ${message}`);
      failures.push({ filename: video.filename, message });
    }
  }

  try {
    await fsp.rm(tmpRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }

  console.log(`\n──────────────────────────────────────────────────`);
  console.log(`Publicados: ${successCount} | Fallaron: ${failCount}`);
  if (failures.length) {
    console.log(`\nFallas:`);
    for (const failure of failures) {
      console.log(`  - ${failure.filename}: ${failure.message}`);
    }
  }
}

// ── Publish one video ─────────────────────────────────────────────────────────

async function publishOne(video, tmpRoot, tracking) {
  const sourcePath = resolveSourcePath(video);
  console.log(`  archivo: ${sourcePath}`);

  const priorEntry = tracking.publishedByFilename[video.filename];
  if (priorEntry && ARGS.force && !ARGS.dryRun) {
    console.log(`  → borrando post anterior (${priorEntry.postId})...`);
    try {
      await deletePost(priorEntry.characterId, priorEntry.postId);
    } catch (error) {
      console.warn(`    aviso: no pude borrar el post anterior — ${error.message}`);
    }
    delete tracking.publishedByFilename[video.filename];
  }

  const workDir = await fsp.mkdtemp(path.join(tmpRoot, "video-"));
  const compressedVideoPath = path.join(workDir, "mobile.mp4");
  const thumbFullPath = path.join(workDir, "thumbnail.webp");
  const thumbMdPath = path.join(workDir, "thumbnail-md.webp");

  const probe = await ffprobeSource(sourcePath);
  const sourceMinDim = Math.min(probe.width || Infinity, probe.height || Infinity);
  const lowRes = sourceMinDim > 0 && sourceMinDim <= 720;
  console.log(
    `  → source ${probe.width || "?"}x${probe.height || "?"} @ ${probe.bitrateKbps || "?"} kb/s — ` +
      (lowRes ? "modo low-res (CRF 20, sin cap)" : "modo estándar (CRF 28, cap 1600k)"),
  );

  console.log(`  → comprimiendo video...`);
  await runFfmpeg(
    buildVideoCompressFlags(sourcePath, compressedVideoPath, sourceMinDim),
  );

  console.log(`  → generando thumbnails...`);
  const captureTime = pickThumbnailTimeFromDuration(probe.durationSeconds);
  await extractThumbnailWebp(
    compressedVideoPath,
    thumbFullPath,
    captureTime,
    THUMBNAIL_FULL,
  );
  await extractThumbnailWebp(
    compressedVideoPath,
    thumbMdPath,
    captureTime,
    THUMBNAIL_MD,
  );

  const videoSize = (await fsp.stat(compressedVideoPath)).size;
  const thumbFullSize = (await fsp.stat(thumbFullPath)).size;
  const thumbMdSize = (await fsp.stat(thumbMdPath)).size;
  console.log(
    `  → video ${formatBytes(videoSize)} | thumb full ${formatBytes(thumbFullSize)} | thumb md ${formatBytes(thumbMdSize)}`,
  );

  if (ARGS.dryRun) {
    console.log(`  (dry-run) — skipping upload + create post`);
    return;
  }

  const stem = stripExtension(video.filename);

  console.log(`  → subiendo a S3 (presigned)...`);
  const videoUrl = await uploadAsset({
    blobPath: compressedVideoPath,
    fileName: `${stem}-mobile.mp4`,
    contentType: "video/mp4",
  });
  const thumbnailUrl = await uploadAsset({
    blobPath: thumbFullPath,
    fileName: `${stem}-thumbnail.webp`,
    contentType: "image/webp",
  });
  const thumbnailMdUrl = await uploadAsset({
    blobPath: thumbMdPath,
    fileName: `${stem}-thumbnail-md.webp`,
    contentType: "image/webp",
  });

  const payload = {
    caption: video.caption,
    context: video.context,
    conversationNarration: video.conversationNarration,
    initialMessage: video.initialMessage,
    imageUrl: thumbnailUrl, // admin sets imageUrl = thumbnail for video posts
    thumbnailUrl,
    thumbnailMdUrl,
    videoUrl,
  };

  console.log(`  → creando post (subtítulos Whisper se generan en backend)...`);
  const response = await createPost(video.characterId, payload);
  const post = response.post;

  tracking.publishedByFilename[video.filename] = {
    filename: video.filename,
    characterId: video.characterId,
    postId: post.postId,
    order: post.order,
    videoUrl,
    thumbnailUrl,
    thumbnailMdUrl,
    publishedAt: new Date().toISOString(),
  };

  console.log(
    `  ✓ Post creado: ${post.postId} (order ${post.order})${post.subtitlesUrl ? " — subtítulos ✓" : ""}`,
  );
}

// ── Source file resolution ────────────────────────────────────────────────────

function resolveSourcePath(video) {
  const candidates = [
    path.join(VIDEOS_ROOT, video.folder, video.filename),
    path.join(VIDEOS_ROOT, video.filename),
    path.join(VIDEOS_ROOT, video.folder.toLowerCase(), video.filename),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    `No encontré el video. Busqué en: ${candidates.join(", ")}`,
  );
}

// ── ffmpeg helpers ────────────────────────────────────────────────────────────

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `ffmpeg salió con código ${code}.\n${stderr.split("\n").slice(-12).join("\n")}`,
          ),
        );
      }
    });
  });
}

function pickThumbnailTimeFromDuration(duration) {
  // Match captureAt logic from the admin portal: 1s if duration > 1.2s, else
  // halfway through.
  if (!Number.isFinite(duration) || duration <= 0.05) return 0;
  return duration > 1.2 ? 1 : duration * 0.5;
}

function ffprobeSource(videoPath) {
  return new Promise((resolve) => {
    // ffmpeg self-probes via `-i` + stderr parse — keeps this script
    // dependency-light (no separate ffprobe binary required).
    const child = spawn(ffmpegPath, ["-i", videoPath, "-hide_banner"], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", () => {
      const durationMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      const dimMatch = stderr.match(/, (\d+)x(\d+)[ ,\[]/);
      const bitrateMatch = stderr.match(/bitrate:\s*(\d+)\s*kb\/s/);
      resolve({
        durationSeconds: durationMatch
          ? Number(durationMatch[1]) * 3600 +
            Number(durationMatch[2]) * 60 +
            Number(durationMatch[3])
          : NaN,
        width: dimMatch ? Number(dimMatch[1]) : 0,
        height: dimMatch ? Number(dimMatch[2]) : 0,
        bitrateKbps: bitrateMatch ? Number(bitrateMatch[1]) : 0,
      });
    });
    child.on("error", () =>
      resolve({
        durationSeconds: NaN,
        width: 0,
        height: 0,
        bitrateKbps: 0,
      }),
    );
  });
}

async function extractThumbnailWebp(videoPath, outputPath, atSeconds, opts) {
  const safeAt = Math.max(0, atSeconds).toFixed(3);
  // -ss before -i is faster; libwebp encoder + scale matches the canvas
  // "contain" math used in the admin portal.
  const args = [
    "-y",
    "-ss",
    safeAt,
    "-i",
    videoPath,
    "-frames:v",
    "1",
    "-vf",
    `scale='if(gt(iw/ih,${opts.maxWidth}/${opts.maxHeight}),min(${opts.maxWidth},iw),-2)':'if(gt(iw/ih,${opts.maxWidth}/${opts.maxHeight}),-2,min(${opts.maxHeight},ih))'`,
    "-c:v",
    "libwebp",
    "-quality",
    String(opts.quality),
    "-an",
    outputPath,
  ];
  await runFfmpeg(args);
}

// ── Admin API ─────────────────────────────────────────────────────────────────

async function adminFetch(endpoint, init = {}) {
  const url = `${ADMIN_API_URL}${endpoint}`;

  const doRequest = async (token) =>
    fetch(url, {
      ...init,
      headers: {
        ...(init.body && !init.headers?.["Content-Type"]
          ? { "Content-Type": "application/json" }
          : {}),
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

  let token = await getValidIdToken();
  let response = await doRequest(token);

  // 401 fallback: if the token slipped through expiry (clock skew, server-side
  // grace period), try one forced refresh and retry once.
  if (response.status === 401 && ADMIN_REFRESH_TOKEN) {
    console.log("    (token expirado, refrescando...)");
    token = await refreshIdToken();
    response = await doRequest(token);
  }

  if (!response.ok) {
    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* ignore */
    }
    const message = parsed?.message || text || `HTTP ${response.status}`;
    throw new Error(`${endpoint} → HTTP ${response.status}: ${message}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

// ── Cognito token management ──────────────────────────────────────────────────

function decodeJwtExp(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return 0;
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8"),
    );
    return Number(decoded.exp) || 0;
  } catch {
    return 0;
  }
}

async function getValidIdToken() {
  const expSeconds = decodeJwtExp(cachedIdToken);
  const nowSeconds = Math.floor(Date.now() / 1000);
  // Refresh proactively if the current token expires within 60s.
  if (cachedIdToken && expSeconds - nowSeconds > 60) {
    return cachedIdToken;
  }
  if (!ADMIN_REFRESH_TOKEN) {
    if (!cachedIdToken) {
      throw new Error(
        "No tengo ID token y falta LUVA_ADMIN_REFRESH_TOKEN para refrescarlo.",
      );
    }
    return cachedIdToken; // Best effort — will surface as 401 if truly expired.
  }
  return refreshIdToken();
}

let refreshInflight = null;

async function refreshIdToken() {
  if (refreshInflight) return refreshInflight;
  if (!ADMIN_REFRESH_TOKEN) {
    throw new Error("LUVA_ADMIN_REFRESH_TOKEN no configurado.");
  }

  refreshInflight = (async () => {
    const form = new URLSearchParams();
    form.append("grant_type", "refresh_token");
    form.append("client_id", COGNITO_CLIENT_ID);
    form.append("refresh_token", ADMIN_REFRESH_TOKEN);

    const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.error) {
      throw new Error(
        `Refresh fallido: ${payload.error_description || payload.error || `HTTP ${response.status}`}`,
      );
    }
    if (!payload.id_token) {
      throw new Error("Cognito no devolvió id_token al refrescar.");
    }
    cachedIdToken = payload.id_token;
    return cachedIdToken;
  })();

  try {
    return await refreshInflight;
  } finally {
    refreshInflight = null;
  }
}

async function uploadAsset({ blobPath, fileName, contentType }) {
  const upload = await adminFetch("/assets/upload", {
    method: "POST",
    body: JSON.stringify({
      folder: "avatarPosts",
      contentType,
      fileName,
    }),
  });

  const buffer = await fsp.readFile(blobPath);
  const putResponse = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": upload.contentType,
      ...(upload.cacheControl ? { "Cache-Control": upload.cacheControl } : {}),
    },
    body: buffer,
  });
  if (!putResponse.ok) {
    throw new Error(
      `PUT ${fileName} → HTTP ${putResponse.status}: ${await putResponse.text()}`,
    );
  }
  return upload.url;
}

async function createPost(characterId, payload) {
  return adminFetch(
    `/story-characters/${encodeURIComponent(characterId)}/posts`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

async function deletePost(characterId, postId) {
  return adminFetch(
    `/story-characters/${encodeURIComponent(characterId)}/posts/delete`,
    {
      method: "POST",
      body: JSON.stringify({ postId }),
    },
  );
}

// ── Tracking ──────────────────────────────────────────────────────────────────

async function loadTracking() {
  try {
    const raw = await fsp.readFile(TRACKING_JSON, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return { publishedByFilename: {} };
    }
    throw error;
  }
}

async function saveTracking(tracking) {
  await fsp.writeFile(
    TRACKING_JSON,
    JSON.stringify(tracking, null, 2) + "\n",
    "utf-8",
  );
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { dryRun: false, character: null, limit: null, force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--character") args.character = argv[++i];
    else if (arg === "--limit") args.limit = Number(argv[++i]);
    else fail(`Argumento desconocido: ${arg}`);
  }
  return args;
}

function stripExtension(filename) {
  return filename.replace(/\.[^./]+$/, "");
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

main().catch((error) => {
  console.error("\nError fatal:", error?.stack || error?.message || error);
  process.exit(1);
});
