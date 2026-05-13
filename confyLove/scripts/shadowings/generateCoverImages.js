const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { randomInt } = require("crypto");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const LIST_PATH = path.join(__dirname, "list.json");
const PROMPTS_PATH = path.join(__dirname, "coverPrompts.json");
const PROMPT_CACHE_PATH = path.join(__dirname, "coverPrompts_cache.json");
const SUBMITTED_PATH = path.join(__dirname, "coverSubmitted.json");
const WORKFLOW_TEMPLATE_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "apis",
  "image_qwen_image_edit_2511.json"
);

// Placeholder hardcodeado por ahora. Cambialo aqui cuando tengamos imagen de referencia final.
const REFERENCE_IMAGE_PATH = path.resolve(__dirname, "..", "b1c1movie", "background.png");

const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
const OPENAI_MODEL = process.env.OPENAI_MODEL || process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
const OPENAI_MAX_TOKENS = Number.parseInt(process.env.OPENAI_MAX_TOKENS || "900", 10);
const COMFYUI_URL = (process.env.COMFYUI_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const COMFYUI_INPUT_DIR = process.env.COMFYUI_INPUT_DIR || "C:/ComfyUI/input";

const PROMPT_TEMPLATE = `You are generating cinematic image prompts for an AI image generator.

The goal is to create minimalist silhouette-style movie cover art inspired by a given movie.

Rules:
- Always keep the same aesthetic:
  - black silhouettes
  - minimal details
  - cinematic composition
  - soft gradients
  - negative space
  - stylish indie poster feeling
  - premium streaming-platform aesthetic
- The silhouettes must represent the movie's main characters and vibe.
- The background color palette and atmosphere should match the movie's emotional tone.
- Do not mention copyrighted characters directly as exact replicas.
- Focus on mood, fashion, poses, recognizable outlines, and atmosphere.
- The final result should feel artistic, modern, emotional, and polished.

Return ONLY the final image-generation prompt.

Movie: "{{movieName}}"`;

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function extractMessageContent(data) {
  const message = data?.choices?.[0]?.message?.content;
  if (typeof message === "string") return message.trim();
  if (Array.isArray(message)) {
    return message
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .join("")
      .trim();
  }
  return "";
}

function stripCodeFence(text) {
  const trimmed = String(text || "").trim();
  const match = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n```$/);
  return match ? match[1].trim() : trimmed;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getOpenAiKey() {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (!key?.trim()) throw new Error("OPENAI_API_KEY is not set in confyLove/scripts/.env or the shell.");
  return key.trim();
}

async function generatePrompt(movieName) {
  const { data } = await axios.post(
    `${OPENAI_BASE_URL}/chat/completions`,
    {
      model: OPENAI_MODEL,
      temperature: 0.7,
      max_tokens: OPENAI_MAX_TOKENS,
      messages: [
        {
          role: "user",
          content: PROMPT_TEMPLATE.replace("{{movieName}}", movieName),
        },
      ],
    },
    {
      timeout: 90000,
      headers: {
        Authorization: `Bearer ${getOpenAiKey()}`,
        "Content-Type": "application/json",
      },
    }
  );

  const prompt = stripCodeFence(extractMessageContent(data));
  if (!prompt) throw new Error("ChatGPT devolvio un prompt vacio.");
  return prompt;
}

async function generatePromptWithRetry(movieName) {
  let delayMs = 1200;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await generatePrompt(movieName);
    } catch (error) {
      if (attempt >= 4) throw error;
      console.warn(`   [prompt intento ${attempt}] ${error.message}`);
      await sleep(delayMs);
      delayMs = Math.min(delayMs * 2, 7000);
    }
  }
}

function buildWorkflow(template, imageFilename, prompt, filenamePrefix) {
  const workflow = JSON.parse(JSON.stringify(template));

  workflow["83"].inputs.image = imageFilename;
  workflow["170:151"].inputs.prompt = prompt;
  workflow["9"].inputs.filename_prefix = filenamePrefix;
  workflow["170:169"].inputs.seed = randomInt(0, 2147483647);

  return workflow;
}

async function submitToComfyUI(workflow) {
  const { data } = await axios.post(
    `${COMFYUI_URL}/prompt`,
    { prompt: workflow },
    { timeout: 30000 }
  );
  return data;
}

function listNeedsCover(list, force) {
  if (force) return true;
  return !list.coverImageKey || !list.coverImageUrl;
}

async function main() {
  const force = process.argv.includes("--force");

  const catalog = readJsonFile(LIST_PATH, null);
  if (!catalog || !Array.isArray(catalog.lists)) {
    throw new Error(`No se pudo leer catalogo de shadowing en ${LIST_PATH}`);
  }

  if (!fs.existsSync(REFERENCE_IMAGE_PATH)) {
    throw new Error(`No existe la imagen de referencia placeholder: ${REFERENCE_IMAGE_PATH}`);
  }

  const template = readJsonFile(WORKFLOW_TEMPLATE_PATH, null);
  if (!template) throw new Error(`No se pudo leer el workflow: ${WORKFLOW_TEMPLATE_PATH}`);

  const promptCache = readJsonFile(PROMPT_CACHE_PATH, {});
  const submitted = readJsonFile(SUBMITTED_PATH, {});
  const promptRecords = readJsonFile(PROMPTS_PATH, []);
  const promptRecordMap = new Map(promptRecords.map((record) => [record.listId, record]));

  const pendingLists = catalog.lists.filter((list) => listNeedsCover(list, force));

  console.log(`ChatGPT:       ${OPENAI_BASE_URL}/chat/completions (${OPENAI_MODEL})`);
  console.log(`ComfyUI:       ${COMFYUI_URL}/prompt`);
  console.log(`Input dir:     ${COMFYUI_INPUT_DIR}`);
  console.log(`Referencia:    ${REFERENCE_IMAGE_PATH}`);
  console.log(`Pendientes:    ${pendingLists.length}/${catalog.lists.length}\n`);

  await fsp.mkdir(COMFYUI_INPUT_DIR, { recursive: true });
  const referenceFilename = path.basename(REFERENCE_IMAGE_PATH);
  await fsp.copyFile(REFERENCE_IMAGE_PATH, path.join(COMFYUI_INPUT_DIR, referenceFilename));

  for (const list of pendingLists) {
    const jobKey = list.listId;
    const slug = slugify(list.name);
    const filenamePrefix = `shadowing_cover_${slug}_${list.listId}`;

    if (submitted[jobKey] && !force) {
      console.log(`[SKIP] ${list.name}: ya enviado (${submitted[jobKey].filenamePrefix})`);
      continue;
    }

    console.log(`── ${list.name} (${list.listId})`);

    let prompt = promptCache[jobKey];
    if (!prompt) {
      process.stdout.write("   prompt ChatGPT... ");
      try {
        prompt = await generatePromptWithRetry(list.name);
        promptCache[jobKey] = prompt;
        writeJsonFile(PROMPT_CACHE_PATH, promptCache);
        console.log(`ok (${prompt.length} chars)`);
      } catch (error) {
        console.log("ERROR");
        console.error(`   ${error.message}`);
        continue;
      }
    } else {
      console.log("   prompt desde cache");
    }

    promptRecordMap.set(list.listId, {
      listId: list.listId,
      name: list.name,
      prompt,
      updatedAt: new Date().toISOString(),
    });
    writeJsonFile(PROMPTS_PATH, Array.from(promptRecordMap.values()));

    const workflow = buildWorkflow(template, referenceFilename, prompt, filenamePrefix);

    process.stdout.write("   enviando a ComfyUI... ");
    try {
      const response = await submitToComfyUI(workflow);
      submitted[jobKey] = {
        listId: list.listId,
        name: list.name,
        filenamePrefix,
        promptId: response?.prompt_id ?? null,
        submittedAt: new Date().toISOString(),
      };
      writeJsonFile(SUBMITTED_PATH, submitted);
      console.log(`ok -> ${filenamePrefix}_XXXXX.png`);
    } catch (error) {
      const detail = error.response?.data ?? error.message;
      console.log("ERROR");
      console.error(`   ${typeof detail === "object" ? JSON.stringify(detail) : detail}`);
    }

    console.log();
  }

  console.log(`Listo. Registro en: ${SUBMITTED_PATH}`);
}

main().catch((error) => {
  const detail = error.response?.data ?? error.message;
  console.error("Error:", typeof detail === "object" ? JSON.stringify(detail, null, 2) : detail);
  process.exit(1);
});
