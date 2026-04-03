const fsp = require("fs/promises");
const path = require("path");
const util = require("util");
const storyData = require("../story.json");
const { getStories, getStoryId } = require("./storyUtils");
const { findFfmpegPath, runFfmpeg } = require("./ffmpegUtils");

const COMFYUI_OUTPUT_DIR = "C:\\ComfyUI\\output";
const COMFYUI_VIDEO_DIR = path.join(COMFYUI_OUTPUT_DIR, "video");
const MANIFEST_DIR = path.join(__dirname, "..", "manifests");
const BACKGROUND_PATH = path.join(__dirname, "background.png");
const TITLE_FONT_PATH = "C:\\Windows\\Fonts\\segoeuib.ttf";
const TITLE_FONT_SIZE_RATIO = 0.038;
const TITLE_Y_RATIO = 0.29;
const TITLE_MAX_LINE_LENGTH = 24;

function getManifestPath(storyId) {
  return path.join(MANIFEST_DIR, `${storyId}.video-manifest.json`);
}

async function loadManifest(storyId) {
  const manifestPath = getManifestPath(storyId);

  try {
    const content = await fsp.readFile(manifestPath, "utf8");
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

async function ensureBackgroundExists() {
  try {
    await fsp.access(BACKGROUND_PATH);
  } catch {
    throw new Error(`No encontre el fondo ${BACKGROUND_PATH}`);
  }
}

async function getPngDimensions(filePath) {
  const handle = await fsp.open(filePath, "r");

  try {
    const buffer = Buffer.alloc(24);
    await handle.read(buffer, 0, 24, 0);

    const pngSignature = "89504e470d0a1a0a";
    if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
      throw new Error(`El archivo ${filePath} no es un PNG valido`);
    }

    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  } finally {
    await handle.close();
  }
}

async function getInputVideoPath(storyId) {
  const concatVideoPath = path.join(
    COMFYUI_VIDEO_DIR,
    `${storyId}_chapters_concat.mp4`
  );

  try {
    await fsp.access(concatVideoPath);
    return concatVideoPath;
  } catch {
    throw new Error(
      `No encontre ${concatVideoPath}. Ejecuta primero 3_concatVideos.js`
    );
  }
}

function wrapTitle(text, maxLineLength) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= maxLineLength || !currentLine) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join("\n");
}

async function writeTitleFile(storyId, title) {
  if (!title || !String(title).trim()) {
    return null;
  }

  const wrappedTitle = wrapTitle(title, TITLE_MAX_LINE_LENGTH);
  const titleFilePath = path.join(MANIFEST_DIR, `${storyId}.title.txt`);

  await fsp.mkdir(MANIFEST_DIR, { recursive: true });
  await fsp.writeFile(titleFilePath, wrappedTitle, "utf8");

  return titleFilePath;
}

function escapeDrawtextValue(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll("%", "\\%")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

function buildTitleFilter(titleFilePath, backgroundSize) {
  if (!titleFilePath) {
    return null;
  }

  const escapedTitleFilePath = escapeDrawtextValue(titleFilePath);
  const escapedFontPath = escapeDrawtextValue(TITLE_FONT_PATH);
  const fontSize = Math.max(
    24,
    Math.round(backgroundSize.height * TITLE_FONT_SIZE_RATIO)
  );
  const y = Math.round(backgroundSize.height * TITLE_Y_RATIO);

  return `drawtext=fontfile='${escapedFontPath}':textfile='${escapedTitleFilePath}':fontcolor=white:fontsize=${fontSize}:line_spacing=8:x=(w-text_w)/2:y=${y}:shadowcolor=black@0.25:shadowx=0:shadowy=2`;
}

async function compositeVideo(
  ffmpegPath,
  inputVideoPath,
  outputPath,
  backgroundSize,
  titleFilePath
) {
  const titleFilter = buildTitleFilter(titleFilePath, backgroundSize);
  const overlayOutputLabel = titleFilter ? "base" : "v";
  const filterSteps = [
    `[1:v]scale=${backgroundSize.width}:-1[fg]`,
    `[0:v][fg]overlay=x=0:y=(H-h)/2:shortest=1[${overlayOutputLabel}]`,
  ];

  if (titleFilter) {
    filterSteps.push(`[base]${titleFilter}[v]`);
  }

  const filter = filterSteps.join(";");

  runFfmpeg(ffmpegPath, [
    "-y",
    "-loop",
    "1",
    "-i",
    BACKGROUND_PATH,
    "-i",
    inputVideoPath,
    "-filter_complex",
    filter,
    "-map",
    "[v]",
    "-map",
    "1:a?",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "copy",
    "-shortest",
    outputPath,
  ]);
}

async function processStory(ffmpegPath, story) {
  const storyId = getStoryId(story.id);
  const manifest = await loadManifest(storyId);
  const inputVideoPath = await getInputVideoPath(storyId);
  const backgroundSize = await getPngDimensions(BACKGROUND_PATH);
  const titleFilePath = await writeTitleFile(storyId, story.title);
  const outputPath = path.join(
    COMFYUI_VIDEO_DIR,
    `${storyId}_chapters_background.mp4`
  );

  await compositeVideo(
    ffmpegPath,
    inputVideoPath,
    outputPath,
    backgroundSize,
    titleFilePath
  );

  manifest.background = {
    generatedAt: new Date().toISOString(),
    backgroundPath: BACKGROUND_PATH,
    backgroundWidth: backgroundSize.width,
    backgroundHeight: backgroundSize.height,
    inputVideoPath,
    outputPath,
    placement: {
      width: "100%",
      x: 0,
      y: "(H-h)/2",
      preserveAspectRatio: true,
    },
    title: story.title || null,
    titleStyle: story.title
      ? {
          titleFilePath,
          fontPath: TITLE_FONT_PATH,
          fontSize: Math.max(
            24,
            Math.round(backgroundSize.height * TITLE_FONT_SIZE_RATIO)
          ),
          y: Math.round(backgroundSize.height * TITLE_Y_RATIO),
          color: "white",
          align: "center",
        }
      : null,
  };

  await fsp.writeFile(getManifestPath(storyId), JSON.stringify(manifest, null, 2), "utf8");

  console.log("Video compuesto sobre fondo");
  console.log(`Story ID: ${storyId}`);
  console.log(`Background: ${BACKGROUND_PATH}`);
  console.log(`Background size: ${backgroundSize.width}x${backgroundSize.height}`);
  console.log(`Input video: ${inputVideoPath}`);
  console.log(`Output: ${outputPath}`);
}

async function main() {
  await ensureBackgroundExists();

  const ffmpegPath = findFfmpegPath();
  const stories = getStories(storyData);

  for (const story of stories) {
    await processStory(ffmpegPath, story);
  }
}

main().catch((error) => {
  console.error(
    "Error al agregar fondo:",
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
