const axios = require("axios");
const { randomInt } = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const util = require("util");
const apiWorkflow = require("../../apis/image2video.json");
const storyData = require("../story.json");
const {
  getChapters,
  getStories,
  getStoryId,
  sanitizeSegment,
} = require("./storyUtils");

const COMFYUI_URL = "http://127.0.0.1:8000/prompt";
const COMFYUI_HISTORY_URL = "http://127.0.0.1:8000/history";
const COMFYUI_OUTPUT_DIR = "C:\\ComfyUI\\output";
const COMFYUI_INPUT_DIR = "C:\\ComfyUI\\input";
const MANIFEST_DIR = path.join(__dirname, "..", "manifests");

function getManifestPath(storyId) {
  return path.join(MANIFEST_DIR, `${storyId}.video-manifest.json`);
}

async function saveManifest(storyId, manifest) {
  await fs.mkdir(MANIFEST_DIR, { recursive: true });
  await fs.writeFile(
    getManifestPath(storyId),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
}

async function findLatestImage(storyId) {
  const entries = await fs.readdir(COMFYUI_OUTPUT_DIR, { withFileTypes: true });
  const matches = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    const isImage = [".png", ".jpg", ".jpeg", ".webp"].includes(ext);

    if (!isImage || !entry.name.startsWith(`${storyId}_image`)) {
      continue;
    }

    const fullPath = path.join(COMFYUI_OUTPUT_DIR, entry.name);
    const stat = await fs.stat(fullPath);
    matches.push({
      fullPath,
      fileName: entry.name,
      mtimeMs: stat.mtimeMs,
    });
  }

  if (matches.length === 0) {
    throw new Error(
      `No encontre imagenes en ${COMFYUI_OUTPUT_DIR} con el prefijo ${storyId}_image`
    );
  }

  matches.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return matches[0];
}

async function copyImageToInput(sourceImage, storyId) {
  await fs.mkdir(COMFYUI_INPUT_DIR, { recursive: true });

  const ext = path.extname(sourceImage.fileName).toLowerCase() || ".png";
  const targetFileName = `${storyId}_image_source${ext}`;
  const targetPath = path.join(COMFYUI_INPUT_DIR, targetFileName);

  await fs.copyFile(sourceImage.fullPath, targetPath);

  return {
    targetFileName,
    targetPath,
  };
}

function buildWorkflow({
  imageFileName,
  promptText,
  width,
  height,
  duration,
  outputPrefix,
}) {
  const workflow = JSON.parse(JSON.stringify(apiWorkflow));
  const frames = Math.round(duration * 24);

  if (!workflow["98"]?.inputs) {
    throw new Error('Nodo "98" no encontrado');
  }

  if (!workflow["185"]?.inputs) {
    throw new Error('Nodo "185" no encontrado');
  }

  if (!workflow["199"]?.inputs) {
    throw new Error('Nodo "199" no encontrado');
  }

  if (!workflow["200"]?.inputs) {
    throw new Error('Nodo "200" no encontrado');
  }

  if (!workflow["216"]?.inputs) {
    throw new Error('Nodo "216" no encontrado');
  }

  if (!workflow["263"]?.inputs) {
    throw new Error('Nodo "263" no encontrado');
  }

  workflow["98"].inputs.image = imageFileName;
  workflow["185"].inputs.value = frames;
  workflow["199"].inputs.noise_seed = randomInt(0, 2147483647);
  workflow["200"].inputs["resize_type.width"] = width;
  workflow["200"].inputs["resize_type.height"] = height;
  workflow["216"].inputs.filename_prefix = outputPrefix;
  workflow["263"].inputs.value = promptText;

  return { workflow, frames };
}

async function processStory(story) {
  if (!Number.isInteger(story.width) || !Number.isInteger(story.height)) {
    throw new Error('Los campos "width" y "height" deben ser enteros en story.json');
  }

  if (!Number.isFinite(story.duration) || story.duration <= 0) {
    throw new Error('El campo "duration" debe ser un numero mayor a 0 en story.json');
  }

  const storyId = getStoryId(story.id);
  const chapters = getChapters(story);
  const sourceImage = await findLatestImage(storyId);
  const copiedImage = await copyImageToInput(sourceImage, storyId);
  const manifest = {
    storyId,
    comfyuiHistoryUrl: COMFYUI_HISTORY_URL,
    outputDir: path.join(COMFYUI_OUTPUT_DIR, "video"),
    sourceImage: {
      original: sourceImage.fullPath,
      copied: copiedImage.targetPath,
      inputFileName: copiedImage.targetFileName,
    },
    width: story.width,
    height: story.height,
    duration: story.duration,
    jobs: [],
    updatedAt: new Date().toISOString(),
  };
  let sentCount = 0;

  for (let index = 0; index < chapters.length; index++) {
    const chapter = chapters[index];
    const chapterId = sanitizeSegment(chapter.id, `chapter_${index + 1}`);
    const chapterLevel = sanitizeSegment(chapter.level, "default");
    const outputPrefix = `${storyId}_video_${chapterId}_${chapterLevel}`;
    const { workflow, frames } = buildWorkflow({
      imageFileName: copiedImage.targetFileName,
      promptText: chapter.prompt,
      width: story.width,
      height: story.height,
      duration: story.duration,
      outputPrefix,
    });

    try {
      const response = await axios.post(COMFYUI_URL, { prompt: workflow });
      manifest.jobs.push({
        order: index + 1,
        chapterId,
        level: chapterLevel,
        prompt: chapter.prompt,
        promptId: response.data?.prompt_id || null,
        number: response.data?.number ?? null,
        outputPrefix,
        submittedAt: new Date().toISOString(),
      });
      manifest.updatedAt = new Date().toISOString();
      await saveManifest(storyId, manifest);
    } catch (error) {
      error.message = `Chapter ${chapterId} fallo: ${error.message}`;
      throw error;
    }

    sentCount += 1;
    console.log("Prompt de video enviado a ComfyUI");
    console.log(`Story ID: ${storyId}`);
    console.log(`Chapter ID: ${chapterId}`);
    console.log(`Level: ${chapterLevel}`);
    console.log(`Imagen origen: ${sourceImage.fullPath}`);
    console.log(`Imagen copiada: ${copiedImage.targetPath}`);
    console.log(`Width: ${story.width}`);
    console.log(`Height: ${story.height}`);
    console.log(`Duration: ${story.duration}s`);
    console.log(`Frames: ${frames}`);
    console.log(`Output prefix: ${workflow["216"].inputs.filename_prefix}`);
    console.log(`Seed: ${workflow["199"].inputs.noise_seed}`);
    console.log(`Prompt ID: ${manifest.jobs[manifest.jobs.length - 1].promptId}`);
  }

  console.log(`Videos enviados: ${sentCount}`);
  console.log(`Manifest: ${getManifestPath(storyId)}`);
}

async function main() {
  const stories = getStories(storyData);

  for (const story of stories) {
    await processStory(story);
  }
}

main().catch((error) => {
  const errorData = error.response?.data || error.message;

  console.error(
    "Error al enviar video a ComfyUI:",
    typeof errorData === "object"
      ? util.inspect(errorData, { depth: null, colors: true, compact: false })
      : errorData
  );
  process.exit(1);
});
