const fs = require("fs");
const path = require("path");

const DEFAULT_INPUT = path.join(__dirname, "learning_items.json");
const DEFAULT_OUTPUT = path.join(__dirname, "learning_items_ranked.json");
const DEFAULT_CACHE = path.join(
  __dirname,
  "learning_items_probability_cache.json"
);
const DEFAULT_BASE_URL = process.env.LMSTUDIO_BASE_URL || "http://127.0.0.1:1234";
const DEFAULT_MODEL = process.env.LMSTUDIO_MODEL || "local-model";
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_MAX_TOKENS = Number.parseInt(
  process.env.LMSTUDIO_MAX_TOKENS || "768",
  10
);

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case "--input":
      case "-i":
        options.input = next;
        index += 1;
        break;
      case "--output":
      case "-o":
        options.output = next;
        index += 1;
        break;
      case "--cache":
        options.cache = next;
        index += 1;
        break;
      case "--model":
      case "-m":
        options.model = next;
        index += 1;
        break;
      case "--base-url":
        options.baseUrl = next;
        index += 1;
        break;
      case "--batch-size":
      case "-b":
        options.batchSize = Number.parseInt(next, 10);
        index += 1;
        break;
      case "--max-tokens":
        options.maxTokens = Number.parseInt(next, 10);
        index += 1;
        break;
      case "--in-place":
        options.inPlace = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        if (arg.startsWith("-")) {
          throw new Error(`Argumento no soportado: ${arg}`);
        }
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Uso:
  node scripts/rank-learning-items-lmstudio.js [opciones]

Opciones:
  -i, --input <ruta>       Archivo de entrada JSON (default: scripts/learning_items.json)
  -o, --output <ruta>      Archivo de salida JSON (default: scripts/learning_items_ranked.json)
  --cache <ruta>           Cache para reanudar progreso
  -m, --model <modelo>     Modelo cargado en LM Studio (default: local-model)
  --base-url <url>         Base URL de LM Studio (default: http://127.0.0.1:1234)
  -b, --batch-size <n>     Tamano del lote (default: 20)
  --max-tokens <n>         Maximo de tokens de salida por solicitud (default: 768)
  --in-place               Sobrescribe el archivo de entrada
  -h, --help               Muestra esta ayuda
`);
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} debe ser un arreglo JSON.`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunk(array, size) {
  const output = [];
  for (let index = 0; index < array.length; index += size) {
    output.push(array.slice(index, index + size));
  }
  return output;
}

function clampProbability(value) {
  const rounded = Math.round(Number(value));
  if (!Number.isFinite(rounded)) {
    throw new Error(`Probabilidad invalida: ${value}`);
  }

  return Math.max(0, Math.min(100, rounded));
}

function resolveEndpoint(baseUrl) {
  const normalized = String(baseUrl || "").trim().replace(/\/+$/, "");

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
        if (typeof part === "string") {
          return part;
        }

        if (part && typeof part.text === "string") {
          return part.text;
        }

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

function sanitizeJsonishText(text) {
  return String(text || "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
}

function extractFirstJsonValue(text) {
  const source = String(text || "");
  const objectStart = source.indexOf("{");
  const arrayStart = source.indexOf("[");
  const starts = [objectStart, arrayStart].filter((index) => index >= 0);

  if (starts.length === 0) {
    return null;
  }

  const startIndex = Math.min(...starts);
  const stack = [];
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
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

      if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      stack.push("}");
      continue;
    }

    if (char === "[") {
      stack.push("]");
      continue;
    }

    if (char === "}" || char === "]") {
      if (stack.length === 0) {
        break;
      }

      const expected = stack.pop();
      if (char !== expected) {
        throw new Error("La respuesta contiene JSON mal balanceado.");
      }

      if (stack.length === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function tryParseJson(rawText) {
  const directText = stripMarkdownCodeFence(rawText);
  const sanitizedText = sanitizeJsonishText(directText);

  if (!directText) {
    throw new Error("LM Studio devolvio una respuesta vacia.");
  }

  try {
    return JSON.parse(directText);
  } catch (_firstError) {
    try {
      return JSON.parse(sanitizedText);
    } catch (_secondError) {
      const snippet =
        extractFirstJsonValue(sanitizedText) ||
        extractFirstJsonValue(directText) ||
        extractFirstJsonValue(rawText);

      if (snippet) {
        return JSON.parse(sanitizeJsonishText(snippet));
      }
    }

    throw new Error(
      `No se pudo parsear JSON desde LM Studio. Inicio de respuesta: ${JSON.stringify(
        sanitizedText.slice(0, 200)
      )}`
    );
  }
}

function getCandidateScoreValue(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return undefined;
  }

  const directKeys = [
    "conversationProbability",
    "conversationability",
    "conversation_probability",
    "conversation_prob",
    "probability",
    "score",
  ];

  for (const key of directKeys) {
    if (candidate[key] !== undefined) {
      return candidate[key];
    }
  }

  for (const [key, value] of Object.entries(candidate)) {
    const normalizedKey = key.toLowerCase();
    const looksLikeConversationScore =
      normalizedKey.includes("conversation") ||
      normalizedKey.includes("probab") ||
      normalizedKey.includes("score");

    if (looksLikeConversationScore && value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function normalizeScoresResponse(parsed, batch) {
  const candidates = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.items)
      ? parsed.items
      : Array.isArray(parsed?.scores)
        ? parsed.scores
        : null;

  if (!candidates) {
    throw new Error("La respuesta no contiene un arreglo de scores.");
  }

  const batchIds = new Set(batch.map((item) => item.id));
  const scoreMap = new Map();

  for (const candidate of candidates) {
    const id = Number(candidate?.id);
    if (!batchIds.has(id)) {
      continue;
    }

    const rawScore = getCandidateScoreValue(candidate);
    if (rawScore === undefined) {
      throw new Error(
        `No se encontro score para id ${id}. Respuesta: ${JSON.stringify(candidate)}`
      );
    }

    scoreMap.set(id, clampProbability(rawScore));
  }

  const missingIds = batch
    .map((item) => item.id)
    .filter((id) => !scoreMap.has(id));

  if (missingIds.length > 0) {
    throw new Error(
      `Faltan scores para ids: ${missingIds.join(", ")}`
    );
  }

  return scoreMap;
}

function buildPromptPayload(batch) {
  return batch.map((item) => ({
    id: item.id,
    label: item.label,
    examples: Array.isArray(item.examples) ? item.examples.slice(0, 3) : [],
    explanation: typeof item.explanation === "string" ? item.explanation : "",
  }));
}

async function requestBatchScores(batch, options) {
  const endpoint = resolveEndpoint(options.baseUrl);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      temperature: 0.1,
      max_tokens: options.maxTokens,
      messages: [
        {
          role: "system",
          content:
            "You rank English vocabulary for a language-learning app. " +
            "Score each item by how likely the target sense is to appear in general spoken English conversation. " +
            "Return only valid JSON. Use an integer from 0 to 100, where 100 is extremely common and broadly useful in everyday conversation, " +
            "70-89 is common, 40-69 is somewhat useful but more formal/topic-specific, 10-39 is uncommon in casual conversation, " +
            "and 0-9 is rare, technical, literary, or not useful for early conversational practice.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Score vocabulary items for conversational usefulness and probability of appearing in English conversation.",
            context:
              "The learners are Spanish speakers studying English. We want to study the most useful vocabulary first.",
            rules: [
              "Keep the original ids.",
              "Return ONLY this JSON shape: {\"items\":[{\"id\":number,\"conversationProbability\":number}]}",
              "Each item object must contain only id and conversationProbability.",
              "Do not include explanations, comments, markdown, or extra keys.",
              "Score the specific sense implied by the examples and explanation, not rare alternate meanings.",
              "Use the full 0-100 range when appropriate.",
            ],
            items: buildPromptPayload(batch),
          }),
        },
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
  return normalizeScoresResponse(parsed, batch);
}

async function requestBatchScoresWithRetry(batch, options) {
  let attempt = 0;
  let delayMs = 1500;

  while (attempt < 5) {
    attempt += 1;

    try {
      return await requestBatchScores(batch, options);
    } catch (error) {
      if (attempt >= 5) {
        throw error;
      }

      console.warn(
        `Lote ${batch[0]?.id}-${batch[batch.length - 1]?.id} fallo en intento ${attempt}: ${error.message}`
      );
      await sleep(delayMs);
      delayMs = Math.min(delayMs * 2, 10000);
    }
  }

  throw new Error("No se pudo obtener respuesta de LM Studio.");
}

function mergeScoreMaps(target, source) {
  for (const [id, score] of source.entries()) {
    target.set(id, score);
  }

  return target;
}

async function scoreBatchAdaptive(batch, options) {
  try {
    return await requestBatchScoresWithRetry(batch, options);
  } catch (error) {
    if (batch.length <= 1) {
      throw error;
    }

    const midpoint = Math.ceil(batch.length / 2);
    const leftBatch = batch.slice(0, midpoint);
    const rightBatch = batch.slice(midpoint);

    console.warn(
      `Dividiendo lote ${batch[0]?.id}-${batch[batch.length - 1]?.id} en ${leftBatch.length}+${rightBatch.length} por fallo persistente: ${error.message}`
    );

    const combined = new Map();
    mergeScoreMaps(combined, await scoreBatchAdaptive(leftBatch, options));
    mergeScoreMaps(combined, await scoreBatchAdaptive(rightBatch, options));
    return combined;
  }
}

function loadExistingScores(items, cachePath, outputPath) {
  const scoreMap = new Map();

  for (const item of items) {
    if (Number.isFinite(item?.conversationProbability)) {
      scoreMap.set(Number(item.id), clampProbability(item.conversationProbability));
    }
  }

  for (const candidatePath of [cachePath, outputPath]) {
    if (!candidatePath || !fs.existsSync(candidatePath)) {
      continue;
    }

    try {
      const parsed = readJsonFile(candidatePath);

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (
            Number.isFinite(item?.id) &&
            Number.isFinite(item?.conversationProbability)
          ) {
            scoreMap.set(Number(item.id), clampProbability(item.conversationProbability));
          }
        }
        continue;
      }

      if (parsed && typeof parsed === "object") {
        for (const [id, score] of Object.entries(parsed)) {
          if (Number.isFinite(Number(id))) {
            scoreMap.set(Number(id), clampProbability(score));
          }
        }
      }
    } catch (error) {
      console.warn(`No se pudo leer cache previa ${candidatePath}: ${error.message}`);
    }
  }

  return scoreMap;
}

function writeCache(cachePath, scoreMap) {
  const serialized = {};

  for (const [id, score] of scoreMap.entries()) {
    serialized[id] = score;
  }

  writeJsonFile(cachePath, serialized);
}

function enrichAndSortItems(items, scoreMap) {
  const enriched = items.map((item) => {
    const score = scoreMap.get(Number(item.id));
    if (!Number.isFinite(score)) {
      throw new Error(`No hay score final para el item ${item.id} (${item.label}).`);
    }

    return {
      ...item,
      conversationProbability: score,
    };
  });

  enriched.sort((left, right) => {
    if (right.conversationProbability !== left.conversationProbability) {
      return right.conversationProbability - left.conversationProbability;
    }

    return String(left.label).localeCompare(String(right.label), "en");
  });

  return enriched;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    showHelp();
    return;
  }

  const inputPath = path.resolve(args.input || DEFAULT_INPUT);
  const outputPath = path.resolve(
    args.inPlace ? inputPath : args.output || DEFAULT_OUTPUT
  );
  const cachePath = path.resolve(args.cache || DEFAULT_CACHE);
  const batchSize = Number.isFinite(args.batchSize) && args.batchSize > 0
    ? args.batchSize
    : DEFAULT_BATCH_SIZE;
  const maxTokens = Number.isFinite(args.maxTokens) && args.maxTokens > 0
    ? args.maxTokens
    : DEFAULT_MAX_TOKENS;

  if (!fs.existsSync(inputPath)) {
    throw new Error(`No existe el archivo de entrada: ${inputPath}`);
  }

  const items = readJsonFile(inputPath);
  ensureArray(items, "El archivo de entrada");

  const scoreMap = loadExistingScores(items, cachePath, outputPath);
  const pendingItems = items.filter((item) => !scoreMap.has(Number(item.id)));
  const batches = chunk(pendingItems, batchSize);
  const cachedItemsCount = items.length - pendingItems.length;

  console.log(`Entrada: ${inputPath}`);
  console.log(`Salida: ${outputPath}`);
  console.log(`Cache: ${cachePath}`);
  console.log(`Modelo: ${args.model || DEFAULT_MODEL}`);
  console.log(`LM Studio: ${resolveEndpoint(args.baseUrl || DEFAULT_BASE_URL)}`);
  console.log(`Max tokens: ${maxTokens}`);
  console.log(`Items totales: ${items.length}`);
  console.log(`Items reutilizados desde cache: ${cachedItemsCount}`);
  console.log(`Items pendientes: ${pendingItems.length}`);
  console.log(`Lotes: ${batches.length}`);

  const requestOptions = {
    baseUrl: args.baseUrl || DEFAULT_BASE_URL,
    model: args.model || DEFAULT_MODEL,
    maxTokens,
  };

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(
      `Procesando lote ${index + 1}/${batches.length} (${batch.length} items)...`
    );

    const batchScores = await scoreBatchAdaptive(batch, requestOptions);
    for (const [id, score] of batchScores.entries()) {
      scoreMap.set(id, score);
    }

    writeCache(cachePath, scoreMap);
    console.log(`Completados: ${scoreMap.size}/${items.length}`);
  }

  const rankedItems = enrichAndSortItems(items, scoreMap);
  writeJsonFile(outputPath, rankedItems);

  console.log("Archivo generado correctamente.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
