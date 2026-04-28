const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const STORIES_SEED_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "backend",
  "src",
  "data",
  "stories-seed.ts"
);
const OUTPUT_PATH = path.join(__dirname, "missionPrompts.json");
const CACHE_PATH = path.join(__dirname, "missionPrompts_cache.json");
const DEFAULT_BASE_URL =
  process.env.LMSTUDIO_BASE_URL || "http://127.0.0.1:1234";
const DEFAULT_MODEL = process.env.LMSTUDIO_MODEL || "local-model";
const DEFAULT_MAX_TOKENS = Number.parseInt(
  process.env.LMSTUDIO_MAX_TOKENS || "2048",
  10
);

function getQuotedValue(block, key) {
  const match = block.match(new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`));
  return match ? match[1] : null;
}

function getMultilineValue(block, key) {
  const match = block.match(
    new RegExp(`${key}\\s*:\\s*["']([\\s\\S]*?)["']\\s*,`)
  );
  return match ? match[1].replace(/\\n/g, " ").trim() : null;
}

function extractMissions(seedContent) {
  const missionBlocks =
    seedContent.match(/\{\s*missionId\s*:[\s\S]*?\n\s*\},/g) || [];

  return missionBlocks
    .map((block) => {
      const missionId = getQuotedValue(block, "missionId");
      const caracterName = getQuotedValue(block, "caracterName");
      const aiRole =
        getMultilineValue(block, "aiRole") || getQuotedValue(block, "aiRole");
      const caracterPrompt =
        getMultilineValue(block, "caracterPrompt") ||
        getQuotedValue(block, "caracterPrompt");

      if (!missionId || !caracterName) {
        return null;
      }

      return { missionId, caracterName, aiRole, caracterPrompt };
    })
    .filter(Boolean);
}

function resolveEndpoint(baseUrl) {
  const normalized = String(baseUrl || "")
    .trim()
    .replace(/\/+$/, "");

  if (!normalized) {
    throw new Error("LM Studio base URL no puede estar vacia.");
  }

  if (normalized.endsWith("/chat/completions")) {
    return normalized;
  }

  return `${normalized}/v1/chat/completions`;
}

function extractMessageContent(data) {
  const message = data?.choices?.[0]?.message?.content;

  if (typeof message === "string") {
    return message.trim();
  }

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

function stripMarkdownCodeFence(text) {
  const trimmed = String(text || "").trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }
  return trimmed;
}

function extractFirstJsonValue(text) {
  const source = String(text || "");
  const arrayStart = source.indexOf("[");
  if (arrayStart < 0) return null;

  const stack = [];
  let inString = false;
  let escaped = false;

  for (let index = arrayStart; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "[") {
      stack.push("]");
      continue;
    }

    if (char === "{") {
      stack.push("}");
      continue;
    }

    if (char === "}" || char === "]") {
      if (stack.length === 0) break;

      const expected = stack.pop();
      if (char !== expected) {
        throw new Error("JSON mal balanceado en la respuesta.");
      }

      if (stack.length === 0) {
        return source.slice(arrayStart, index + 1);
      }
    }
  }

  return null;
}

function tryParseJson(rawText) {
  const cleaned = stripMarkdownCodeFence(rawText);

  if (!cleaned) {
    throw new Error("LM Studio devolvio una respuesta vacia.");
  }

  try {
    return JSON.parse(cleaned);
  } catch (_e1) {
    const snippet = extractFirstJsonValue(cleaned) || extractFirstJsonValue(rawText);
    if (snippet) {
      try {
        return JSON.parse(snippet);
      } catch (_e2) {
        // fall through
      }
    }

    throw new Error(
      `No se pudo parsear JSON desde LM Studio. Respuesta: ${JSON.stringify(
        cleaned.slice(0, 300)
      )}`
    );
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readCache() {
  if (!fs.existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  } catch (_e) {
    return {};
  }
}

function writeCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n", "utf8");
}

async function requestPromptsForMission(mission, options) {
  const endpoint = resolveEndpoint(options.baseUrl);

  const systemMessage = `Eres un experto en crear prompts fotográficos para generación de imágenes con IA (estilo Stable Diffusion / Midjourney).
Tu tarea es generar prompts visuales en inglés para publicaciones de Instagram de un personaje ficticio durante 10 días.
Cada prompt debe:
- Describir una escena fotográfica específica y visual (no texto narrativo)
- Ser coherente con la personalidad, apariencia y estilo de vida del personaje
- Variar entre situaciones cotidianas, sociales, viajes, actividades de ocio, etc.
- NO estar necesariamente relacionado con su trabajo
- Incluir detalles de iluminación, ángulo, ambiente y vestuario cuando sea relevante
- Si el personaje tiene un perfil atractivo/sensual, está permitido incluir ocasionalmente fotos en traje de baño o ropa de verano, siempre de forma elegante
- Ser realista y natural, como fotos que alguien publicaría en Instagram
Devuelve SOLO un array JSON con exactamente 10 strings, sin ningún texto adicional.`;

  const userMessage = `Personaje: ${mission.caracterName}
Descripción del personaje: ${mission.aiRole || ""}
Apariencia visual: ${mission.caracterPrompt || ""}

Genera 10 prompts fotográficos en inglés para las publicaciones de Instagram de este personaje durante 10 días.
Responde SOLO con este formato JSON, sin texto adicional:
["prompt día 1", "prompt día 2", ..., "prompt día 10"]`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: options.model,
      temperature: 0.8,
      max_tokens: options.maxTokens,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `LM Studio respondio ${response.status}: ${body || response.statusText}`
    );
  }

  const data = await response.json();
  const text = extractMessageContent(data);
  const parsed = tryParseJson(text);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(
      `Se esperaba un array de prompts pero se recibio: ${JSON.stringify(parsed).slice(0, 200)}`
    );
  }

  return parsed.slice(0, 10).map((p) => String(p).trim());
}

async function requestPromptsWithRetry(mission, options) {
  let attempt = 0;
  let delayMs = 1500;

  while (attempt < 4) {
    attempt += 1;
    try {
      return await requestPromptsForMission(mission, options);
    } catch (error) {
      if (attempt >= 4) throw error;
      console.warn(
        `  [intento ${attempt}] ${mission.missionId} fallo: ${error.message}`
      );
      await sleep(delayMs);
      delayMs = Math.min(delayMs * 2, 8000);
    }
  }

  throw new Error("No se pudo obtener respuesta de LM Studio.");
}

async function main() {
  const baseUrl = DEFAULT_BASE_URL;
  const model = DEFAULT_MODEL;
  const maxTokens = DEFAULT_MAX_TOKENS;

  const seedContent = await fsp.readFile(STORIES_SEED_PATH, "utf8");
  const missions = extractMissions(seedContent);

  if (missions.length === 0) {
    throw new Error(
      `No se encontraron misiones en ${STORIES_SEED_PATH}`
    );
  }

  const cache = readCache();
  const pending = missions.filter((m) => !cache[m.missionId]);

  console.log(`LM Studio: ${resolveEndpoint(baseUrl)}`);
  console.log(`Modelo: ${model}`);
  console.log(`Misiones totales: ${missions.length}`);
  console.log(`Ya procesadas (cache): ${missions.length - pending.length}`);
  console.log(`Pendientes: ${pending.length}`);

  const options = { baseUrl, model, maxTokens };

  for (let index = 0; index < pending.length; index += 1) {
    const mission = pending[index];
    console.log(
      `\n[${index + 1}/${pending.length}] Generando prompts para: ${mission.missionId} (${mission.caracterName})`
    );

    try {
      const prompts = await requestPromptsWithRetry(mission, options);
      cache[mission.missionId] = {
        missionId: mission.missionId,
        caracterName: mission.caracterName,
        prompts,
      };
      writeCache(cache);
      console.log(`  [OK] ${prompts.length} prompts generados`);
    } catch (error) {
      console.error(`  [ERROR] ${mission.missionId}: ${error.message}`);
    }
  }

  const result = missions
    .filter((m) => cache[m.missionId])
    .map((m) => cache[m.missionId]);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + "\n", "utf8");

  console.log(`\nListo. Resultado guardado en: ${OUTPUT_PATH}`);
  console.log(`Total con prompts: ${result.length}/${missions.length}`);
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
