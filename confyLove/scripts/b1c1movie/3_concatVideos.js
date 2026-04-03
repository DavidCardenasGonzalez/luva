const axios = require("axios");
const fs = require("fs/promises");
const path = require("path");
const util = require("util");
const storyData = require("../story.json");
const { getStories, getStoryId } = require("./storyUtils");
const { findFfmpegPath, runFfmpeg } = require("./ffmpegUtils");

const COMFYUI_OUTPUT_DIR = "C:\\ComfyUI\\output";
const COMFYUI_VIDEO_DIR = path.join(COMFYUI_OUTPUT_DIR, "video");
const MANIFEST_DIR = path.join(__dirname, "..", "manifests");
const BADGE_DIR = __dirname;
const BADGE_WIDTH = 180;
const BADGE_MARGIN_X = 28;
const BADGE_MARGIN_Y = 28;

const BADGE_BY_LEVEL = {
  b1: path.join(BADGE_DIR, "b1_badge.png"),
  b2: path.join(BADGE_DIR, "b2_badge.png"),
  c1: path.join(BADGE_DIR, "c1_badge.png"),
  native: path.join(BADGE_DIR, "c1_badge.png"),
};

function getManifestPath(storyId) {
  return path.join(MANIFEST_DIR, `${storyId}.video-manifest.json`);
}

async function loadManifest(storyId) {
  const manifestPath = getManifestPath(storyId);

  try {
    const content = await fs.readFile(manifestPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        `No encontre el manifest ${manifestPath}. Ejecuta primero 2_image2video.js`
      );
    }

    throw error;
  }
}

function getVideoFileObjects(output) {
  const candidates = [];

  for (const value of Object.values(output || {})) {
    if (!Array.isArray(value)) {
      continue;
    }

    for (const item of value) {
      if (!item || typeof item !== "object" || !item.filename) {
        continue;
      }

      const ext = path.extname(item.filename).toLowerCase();
      if (![".mp4", ".mov", ".webm", ".mkv"].includes(ext)) {
        continue;
      }

      candidates.push(item);
    }
  }

  return candidates;
}

function buildCandidatePaths(fileObject) {
  const subfolder = fileObject.subfolder || "";
  const normalizedSubfolder = subfolder
    .replaceAll("/", path.sep)
    .replaceAll("\\", path.sep);

  return [
    path.join(COMFYUI_OUTPUT_DIR, normalizedSubfolder, fileObject.filename),
    path.join(COMFYUI_VIDEO_DIR, fileObject.filename),
    path.join(COMFYUI_OUTPUT_DIR, fileObject.filename),
  ];
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function getBadgePathForLevel(level) {
  const normalized = String(level || "").trim().toLowerCase();
  return BADGE_BY_LEVEL[normalized] || null;
}

async function ensureBadgeExists(level) {
  const badgePath = getBadgePathForLevel(level);

  if (!badgePath) {
    return null;
  }

  if (!(await pathExists(badgePath))) {
    throw new Error(`No encontre el badge para ${level}: ${badgePath}`);
  }

  return badgePath;
}

async function resolveVideoFromHistory(manifest, job) {
  if (!job.promptId) {
    return null;
  }

  const historyUrl = `${manifest.comfyuiHistoryUrl || "http://127.0.0.1:8000/history"}/${job.promptId}`;
  const response = await axios.get(historyUrl);
  const historyEntry = response.data?.[job.promptId] || response.data;
  const outputs = historyEntry?.outputs || {};

  for (const output of Object.values(outputs)) {
    const files = getVideoFileObjects(output);

    for (const fileObject of files) {
      const candidatePaths = buildCandidatePaths(fileObject);

      for (const candidatePath of candidatePaths) {
        if (await pathExists(candidatePath)) {
          return candidatePath;
        }
      }
    }
  }

  return null;
}

async function resolveVideoByFallback(job, allVideoFiles) {
  const prefix = job.outputPrefix;

  const byPrefix = allVideoFiles.find((file) => file.name.startsWith(prefix));
  if (byPrefix) {
    return byPrefix.fullPath;
  }

  const byOrder = allVideoFiles[job.order - 1];
  return byOrder?.fullPath || null;
}

async function getAllVideoFiles() {
  const entries = await fs.readdir(COMFYUI_VIDEO_DIR, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (![".mp4", ".mov", ".webm", ".mkv"].includes(ext)) {
      continue;
    }

    const fullPath = path.join(COMFYUI_VIDEO_DIR, entry.name);
    const stat = await fs.stat(fullPath);
    files.push({
      name: entry.name,
      fullPath,
      mtimeMs: stat.mtimeMs,
    });
  }

  files.sort((a, b) => a.mtimeMs - b.mtimeMs);
  return files;
}

function quoteForConcat(filePath) {
  return filePath.replaceAll("\\", "/").replaceAll("'", "'\\''");
}

async function writeConcatList(storyId, videoPaths) {
  await fs.mkdir(MANIFEST_DIR, { recursive: true });
  const listPath = path.join(MANIFEST_DIR, `${storyId}.concat.txt`);
  const content = videoPaths
    .map((videoPath) => `file '${quoteForConcat(videoPath)}'`)
    .join("\n");

  await fs.writeFile(listPath, content, "utf8");
  return listPath;
}

async function overlayBadge(ffmpegPath, storyId, job, inputVideoPath, badgePath) {
  const outputPath = path.join(
    MANIFEST_DIR,
    `${storyId}.chapter-${job.order}-${String(job.level || "default").toLowerCase()}-badged.mp4`
  );

  runFfmpeg(ffmpegPath, [
    "-y",
    "-i",
    inputVideoPath,
    "-i",
    badgePath,
    "-filter_complex",
    `[1:v]scale=${BADGE_WIDTH}:-1[badge];[0:v][badge]overlay=W-w-${BADGE_MARGIN_X}:H-h-${BADGE_MARGIN_Y}[v]`,
    "-map",
    "[v]",
    "-map",
    "0:a?",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "copy",
    outputPath,
  ]);

  return outputPath;
}

async function processStory(story) {
  const storyId = getStoryId(story.id);
  const manifest = await loadManifest(storyId);
  const jobs = [...(manifest.jobs || [])].sort((a, b) => a.order - b.order);

  if (jobs.length === 0) {
    throw new Error("El manifest no contiene trabajos de video");
  }

  const ffmpegPath = findFfmpegPath();
  const allVideoFiles = await getAllVideoFiles();
  const fallbackVideoFiles = allVideoFiles.slice(-jobs.length);
  const resolvedVideos = [];

  for (const job of jobs) {
    let videoPath = null;

    try {
      videoPath = await resolveVideoFromHistory(manifest, job);
    } catch {
      videoPath = null;
    }

    if (!videoPath) {
      videoPath = await resolveVideoByFallback(job, fallbackVideoFiles);
    }

    if (!videoPath) {
      throw new Error(
        `No pude resolver el archivo de video para chapter ${job.chapterId}`
      );
    }

    resolvedVideos.push({
      order: job.order,
      chapterId: job.chapterId,
      level: job.level,
      promptId: job.promptId,
      videoPath,
    });
  }

  const badgedVideos = [];

  for (const video of resolvedVideos) {
    const badgePath = await ensureBadgeExists(video.level);
    const badgedVideoPath = badgePath
      ? await overlayBadge(ffmpegPath, storyId, video, video.videoPath, badgePath)
      : video.videoPath;

    badgedVideos.push({
      ...video,
      badgePath,
      badgedVideoPath,
    });
  }

  const uniqueVideos = badgedVideos.map((item) => item.badgedVideoPath);
  const listPath = await writeConcatList(storyId, uniqueVideos);
  const outputPath = path.join(COMFYUI_VIDEO_DIR, `${storyId}_chapters_concat.mp4`);

  runFfmpeg(ffmpegPath, [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-c",
    "copy",
    outputPath,
  ]);

  manifest.badges = {
    generatedAt: new Date().toISOString(),
    badgeWidth: BADGE_WIDTH,
    marginX: BADGE_MARGIN_X,
    marginY: BADGE_MARGIN_Y,
    videos: badgedVideos.map((video) => ({
      order: video.order,
      chapterId: video.chapterId,
      level: video.level,
      sourceVideoPath: video.videoPath,
      badgePath: video.badgePath,
      outputVideoPath: video.badgedVideoPath,
    })),
  };
  manifest.concat = {
    generatedAt: new Date().toISOString(),
    listPath,
    outputPath,
  };
  await fs.writeFile(getManifestPath(storyId), JSON.stringify(manifest, null, 2), "utf8");

  console.log("Videos concatenados");
  console.log(`Story ID: ${storyId}`);
  console.log(`Manifest: ${getManifestPath(storyId)}`);
  console.log(`Concat list: ${listPath}`);
  console.log(`FFmpeg: ${ffmpegPath}`);
  console.log(`Output: ${outputPath}`);

  for (const video of badgedVideos) {
    console.log(
      `Chapter ${video.order} (${video.chapterId}/${video.level}): ${video.badgedVideoPath}`
    );
  }
}

async function main() {
  const stories = getStories(storyData);

  for (const story of stories) {
    await processStory(story);
  }
}

main().catch((error) => {
  console.error(
    "Error al concatenar videos:",
    typeof error === "object"
      ? util.inspect(
          {
            message: error.message,
            stack: error.stack,
          },
          { depth: null, colors: true, compact: false }
        )
      : error
  );
  process.exit(1);
});
