const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { randomInt } = require("crypto");
const axios = require("axios");

// ── Rutas de entrada ────────────────────────────────────────────────────────
const MISSION_PROMPTS_PATH = path.join(__dirname, "missionPrompts.json");
const PROFILES_DIR = path.join(__dirname, "profilesImages");
const WORKFLOW_TEMPLATE_PATH = path.resolve(
  __dirname, "..", "..", "apis", "image_qwen_image_edit_2511.json"
);

// ── Cache y resultados ───────────────────────────────────────────────────────
const ENRICHED_CACHE_PATH = path.join(__dirname, "enrichedPrompts_cache.json");
const SUBMITTED_PATH = path.join(__dirname, "submitted.json");

// ── Configuración ─────────────────────────────────────────────────────────────
const LMSTUDIO_BASE_URL = process.env.LMSTUDIO_BASE_URL || "http://127.0.0.1:1234";
const LMSTUDIO_MODEL = process.env.LMSTUDIO_MODEL || "local-model";
const LMSTUDIO_MAX_TOKENS = Number.parseInt(process.env.LMSTUDIO_MAX_TOKENS || "512", 10);
const COMFYUI_URL = (process.env.COMFYUI_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const COMFYUI_INPUT_DIR = process.env.COMFYUI_INPUT_DIR || "C:/ComfyUI/input";

// ── Helpers generales ─────────────────────────────────────────────────────────

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_e) {
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findProfileImage(missionId) {
  for (const ext of [".png", ".jpg", ".jpeg", ".webp"]) {
    const filePath = path.join(PROFILES_DIR, `${missionId}-profile${ext}`);
    if (fs.existsSync(filePath)) {
      return { filePath, filename: `${missionId}-profile${ext}` };
    }
  }
  return null;
}

// ── LM Studio ────────────────────────────────────────────────────────────────

function resolveLMEndpoint(baseUrl) {
  const normalized = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (normalized.endsWith("/chat/completions")) return normalized;
  return `${normalized}/v1/chat/completions`;
}

async function enrichPromptWithLM(originalPrompt, caracterName, options) {
  const endpoint = resolveLMEndpoint(options.baseUrl);

  const systemMessage = `You are an expert at refining AI image generation prompts.
Ensure the prompt explicitly describes:
1. The character's clothing (specific colors, fabric, style, fit)
2. What the character holds in their hands — or state "hands are empty / natural resting pose"
Keep all other details intact. Return ONLY the improved prompt as plain text.`;

  const userMessage = `Character: ${caracterName}

Original prompt:
${originalPrompt}

Return only the improved prompt.`;

  const { data } = await axios.post(
    endpoint,
    {
      model: options.model,
      temperature: 0.3,
      max_tokens: options.maxTokens,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    },
    { timeout: 60000 }
  );

  const content = data?.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content.trim() : "";
  if (!text) throw new Error("LM Studio devolvio respuesta vacia.");

  // quitar code fences si las hay
  const m = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return m ? m[1].trim() : text;
}

async function enrichWithRetry(originalPrompt, caracterName, options) {
  let delayMs = 1000;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await enrichPromptWithLM(originalPrompt, caracterName, options);
    } catch (error) {
      if (attempt >= 4) throw error;
      console.warn(`    [enrich intento ${attempt}] ${error.message}`);
      await sleep(delayMs);
      delayMs = Math.min(delayMs * 2, 6000);
    }
  }
}

// ── ComfyUI ───────────────────────────────────────────────────────────────────

function buildWorkflow(template, imageFilename, enrichedPrompt, filenamePrefix) {
  const workflow = JSON.parse(JSON.stringify(template));

  workflow["83"].inputs.image = imageFilename;
  workflow["170:151"].inputs.prompt = enrichedPrompt;
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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(MISSION_PROMPTS_PATH)) {
    throw new Error(`No se encontro ${MISSION_PROMPTS_PATH}. Ejecuta primero el paso 2.`);
  }

  const missionPrompts = readJsonFile(MISSION_PROMPTS_PATH, []);
  if (missionPrompts.length === 0) throw new Error("missionPrompts.json esta vacio.");

  const template = readJsonFile(WORKFLOW_TEMPLATE_PATH, null);
  if (!template) throw new Error(`No se pudo leer el workflow: ${WORKFLOW_TEMPLATE_PATH}`);

  const enrichedCache = readJsonFile(ENRICHED_CACHE_PATH, {});
  const submitted = readJsonFile(SUBMITTED_PATH, {});

  const lmOptions = { baseUrl: LMSTUDIO_BASE_URL, model: LMSTUDIO_MODEL, maxTokens: LMSTUDIO_MAX_TOKENS };

  const totalJobs = missionPrompts.reduce((acc, m) => acc + (m.prompts?.length ?? 0), 0);
  const doneJobs = Object.keys(submitted).length;

  console.log(`ComfyUI:       ${COMFYUI_URL}/prompt`);
  console.log(`Input dir:     ${COMFYUI_INPUT_DIR}`);
  console.log(`LM Studio:     ${resolveLMEndpoint(LMSTUDIO_BASE_URL)}`);
  console.log(`Jobs totales:  ${totalJobs} | Ya enviados: ${doneJobs}\n`);

  await fsp.mkdir(COMFYUI_INPUT_DIR, { recursive: true });

  for (const mission of missionPrompts) {
    const { missionId, caracterName, prompts } = mission;
    const profile = findProfileImage(missionId);

    if (!profile) {
      console.warn(`[SKIP] Sin imagen de perfil para ${missionId}`);
      continue;
    }

    console.log(`── ${missionId} (${caracterName})`);

    await fsp.copyFile(profile.filePath, path.join(COMFYUI_INPUT_DIR, profile.filename));
    console.log(`   imagen copiada: ${profile.filename}`);

    for (let dayIndex = 0; dayIndex < prompts.length; dayIndex += 1) {
      const jobKey = `${missionId}__day${dayIndex}`;

      if (submitted[jobKey]) {
        console.log(`   [day ${dayIndex + 1}] ya enviado (prefix: ${submitted[jobKey].filenamePrefix})`);
        continue;
      }

      const originalPrompt = prompts[dayIndex];
      const cacheKey = jobKey;
      let enrichedPrompt = enrichedCache[cacheKey];

      if (!enrichedPrompt) {
        process.stdout.write(`   [day ${dayIndex + 1}] enriqueciendo... `);
        try {
          enrichedPrompt = await enrichWithRetry(originalPrompt, caracterName, lmOptions);
          enrichedCache[cacheKey] = enrichedPrompt;
          writeJsonFile(ENRICHED_CACHE_PATH, enrichedCache);
          console.log(`ok (${enrichedPrompt.length} chars)`);
        } catch (error) {
          console.log(`fallback al original`);
          console.warn(`   [warn] ${error.message}`);
          enrichedPrompt = originalPrompt;
        }
      } else {
        console.log(`   [day ${dayIndex + 1}] prompt desde cache`);
      }

      // filename_prefix identifica las imagenes generadas en ComfyUI output
      const filenamePrefix = `post_${missionId}_day${String(dayIndex + 1).padStart(2, "0")}`;

      const workflow = buildWorkflow(template, profile.filename, enrichedPrompt, filenamePrefix);

      process.stdout.write(`   [day ${dayIndex + 1}] enviando a ComfyUI... `);
      try {
        const response = await submitToComfyUI(workflow);
        submitted[jobKey] = { filenamePrefix, promptId: response?.prompt_id ?? null };
        writeJsonFile(SUBMITTED_PATH, submitted);
        console.log(`ok -> ${filenamePrefix}_XXXXX.png`);
      } catch (error) {
        const detail = error.response?.data ?? error.message;
        console.log(`ERROR`);
        console.error(`   [error] ${typeof detail === "object" ? JSON.stringify(detail) : detail}`);
      }
    }

    console.log();
  }

  const sentCount = Object.keys(submitted).length;
  console.log(`Listo. Enviados: ${sentCount}/${totalJobs}`);
  console.log(`Registro en: ${SUBMITTED_PATH}`);
}

main().catch((error) => {
  const detail = error.response?.data ?? error.message;
  console.error(
    "Error:",
    typeof detail === "object" ? JSON.stringify(detail, null, 2) : detail
  );
  process.exit(1);
});
