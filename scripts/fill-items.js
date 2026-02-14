/**
 * Transformador de items (2000+) con IA:
 * - Completa labels vacíos a partir de definition
 * - Genera examples[3] y prompt (ES) específico/creativo
 * - Conserva id, options/answer si existieran, explanation a partir de definition
 *
 * Uso:
 *   1) export OPENAI_API_KEY="sk-..."
 *   2) node transform.js input.json output.json
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const secretsFile = path.join(__dirname, "environment.local.json");
if (fs.existsSync(secretsFile)) {
  const raw = fs.readFileSync(secretsFile, "utf8");
  const data = JSON.parse(raw);
  console.log(`Cargando variables de entorno desde ${secretsFile}`);
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (!process.env[key] && typeof value === "string" && value) {
        console.log(`Usando ${key} definido en environment.local.json`);
        process.env[key] = value;
      }
    }
  }
} else {
  console.log(`No se encontró ${secretsFile}, continuando sin ese archivo.`);
}
const inputPath = "./vocab_relevant_clean.json";
const outputPath = "./b2_vocabulary_filled_1.json";
const MAX_ITEMS = 10000;

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("Falta OPENAI_API_KEY en variables de entorno.");
  process.exit(1);
}

// ---------- Utilidades ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Limpia label tipo "A abandon" -> "abandon" y recorta espacios extra. */
function normalizeLabel(label) {
  if (!label) return label;
  // Elimina prefijo de 1 letra (A/B/C...) seguido de espacio, si existe
  const cleaned = label.replace(/^[A-Za-z]\s+/, "").trim();
  // Conservar tal cual, pero normaliza espacios múltiples
  return cleaned.replace(/\s+/g, " ");
}

/** Deduplica por label (mantiene el primer id encontrado para cada label). */
function dedupeByLabel(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const lbl = normalizeLabel(it.label || "").toLowerCase();
    if (!lbl || seen.has(lbl)) continue;
    seen.add(lbl);
    out.push({ ...it, label: normalizeLabel(it.label) });
  }
  return out;
}

/** Shuffle NO determinista (Fisher–Yates) */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Construye options {a,b,c} y answer a partir de correct_es + distractors. */
function buildOptions(correct_es, distractors) {
  const choices = shuffle([
    { key: "correct", text: correct_es },
    { key: "wrong1", text: distractors[0] },
    { key: "wrong2", text: distractors[1] },
  ]);

  const letters = ["a", "b", "c"];
  const options = {};
  let answerLetter = "a";

  choices.forEach((opt, idx) => {
    const letter = letters[idx];
    options[letter] = opt.text;
    if (opt.key === "correct") answerLetter = letter;
  });

  return { options, answer: answerLetter };
}

/** Llama a la API Responses con backoff/reintentos. */
async function chatJSON(messages, { maxTries = 5 } = {}) {
  let attempt = 0;
  let delay = 1000;
  console.log("Llamando a la API de OpenAI...");

  // Responses separa system vs user
  const systemMsg = messages.find((m) => m.role === "system");
  const userMsgs = messages.filter((m) => m.role === "user");
  const mainUser = userMsgs[userMsgs.length - 1];

  if (!mainUser) {
    throw new Error("No hay mensaje de usuario para enviar a la API.");
  }

  while (attempt < maxTries) {
    attempt++;
    try {
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-5-nano",
          reasoning: { effort: "low" },
          text: { format: { type: "json_object" } },
          instructions: systemMsg ? systemMsg.content : undefined,
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: mainUser.content,
                },
              ],
            },
          ],
        }),
      });

      console.log("Status:", res.status);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }
      const data = await res.json();

      const outputItems = data?.output || [];
      const messageItem = outputItems.find((it) => it.type === "message");

      if (!messageItem || !Array.isArray(messageItem.content)) {
        throw new Error("No se encontró un mensaje de salida válido en `output`.");
      }

      const textParts = messageItem.content
        .filter(
          (part) => part.type === "output_text" && typeof part.text === "string"
        )
        .map((part) => part.text);

      const contentText = textParts.join("").trim();
      if (!contentText) {
        throw new Error("La respuesta no contiene texto en output_text.");
      }

      const parsed = JSON.parse(contentText);
      console.log("Respuesta parseada:", parsed);
      if (data?.usage) {
        console.log("Usage de ChatGPT:", data.usage);
      }
      return parsed;
    } catch (err) {
      console.warn(`Error intento ${attempt}:`, err.message);
      if (attempt >= maxTries) throw err;
      await sleep(delay);
      delay = Math.min(delay * 2, 10_000);
    }
  }
}

/** Limita concurrencia simple */
function createQueue(limit = 3) {
  let active = 0;
  const queue = [];
  const runNext = () => {
    if (active >= limit || queue.length === 0) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    fn()
      .then((v) => resolve(v))
      .catch((e) => reject(e))
      .finally(() => {
        active--;
        runNext();
      });
  };
  return function enqueue(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      runNext();
    });
  };
}

// ---------- Prompting ----------
function buildMessages({ id, label, rawDefinition }) {
  const system = {
    role: "system",
    content:
      "Eres un generador de contenido educativo para pasar de nivel B1 a B2 en inglés. Respondes SOLO JSON válido. Sin texto extra.",
  };

  const user = {
    role: "user",
    content: JSON.stringify({
      task: "Generar contenido para una tarjeta de vocabulario en español",
      constraints: [
        "Devuelve JSON válido con EXACTAMENTE estas claves: examples, correct_es, distractors, explanation, prompt.",
        "examples debe ser un array de 3 oraciones naturales en inglés usando la palabra, variando tiempos/estructuras. Máx. 20 palabras cada una.",
        "correct_es es la definición concisa en español para hispanohablantes (no traducción literal, sino significado natural).",
        "distractors es un array de 2 definiciones plausibles pero incorrectas en español, sin solaparse con la correcta.",
        "explanation: mini explicación en español, 1–2 frases, matizando uso, matices o confusiones típicas.",
        "prompt: instrucción breve en español que pida al alumno escribir una mini-situación original y específica usando la palabra.",
        "No repitas la palabra en español. No inventes significados alternativos raros. Evita falsos cognados.",
      ],
      lemma: label,
      hint_from_raw_definition: rawDefinition || "",
      schema_example: {
        examples: [
          "…",
          "…",
          "…"
        ],
        correct_es: "definición correcta concisa en español",
        distractors: ["distractor 1", "distractor 2"],
        explanation: "explicación breve sobre uso y matices.",
        prompt:
          "propón una situación breve donde el alumno use la palabra de forma natural."
      },
    }),
  };

  return [system, user];
}

// ---------- Main ----------
(async function main() {
  // const [, , inFile, outFile] = process.argv;
  // if (!inFile || !outFile) {
  //   console.error("Uso: node transform_vocab.js input.json output.json");
  //   process.exit(1);
  // }

  // const inputPath = path.resolve(process.cwd(), inFile);
  // const outputPath = path.resolve(process.cwd(), outFile);

  const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (!Array.isArray(raw)) {
    console.error("El archivo de entrada debe ser un array JSON.");
    process.exit(1);
  }

  // Normalizar + deduplicar
  const cleaned = raw
    .map((x) => ({
      id: Number(x.id),
      label: normalizeLabel(x.label || ""),
      definition: (x.definition || "").trim(),
    }))
    .filter((x) => x.id && x.label);

  const deduped = dedupeByLabel(cleaned);

  const itemsToProcess =
    MAX_ITEMS > 0 ? deduped.slice(0, MAX_ITEMS) : deduped;
  if (MAX_ITEMS > 0) {
    console.log(`Procesando solo ${itemsToProcess.length} items (MAX_ITEMS=${MAX_ITEMS})`);
  }

  // Cola con concurrencia (ajusta según tu límite)
  const enqueue = createQueue(3);

  const results = [];
  let processed = 0;

  for (const item of itemsToProcess) {
    const job = async () => {
      const messages = buildMessages({
        id: item.id,
        label: item.label,
        rawDefinition: item.definition,
      });

      const gen = await chatJSON(messages);

      // Validaciones mínimas
      const examples = Array.isArray(gen.examples) ? gen.examples.slice(0, 3) : [];
      if (examples.length < 3) {
        throw new Error(`Menos de 3 ejemplos para '${item.label}'`);
      }
      if (
        !gen.correct_es ||
        !Array.isArray(gen.distractors) ||
        gen.distractors.length < 2
      ) {
        throw new Error(`Faltan opciones para '${item.label}'`);
      }

      const { options, answer } = buildOptions(gen.correct_es, gen.distractors);

      results.push({
        id: item.id,
        label: item.label,
        examples,
        options,
        answer,
        explanation: String(gen.explanation || "").trim(),
        prompt: String(gen.prompt || "").trim(),
      });

      processed++;
      if (processed % 10 === 0) {
        console.log(`Progreso: ${processed}/${itemsToProcess.length}`);
      }
    };

    // Encolar con reintentos
    await enqueue(async () => {
      let tries = 0;
      let delay = 1000;
      while (true) {
        tries++;
        try {
          return await job();
        } catch (e) {
          if (tries >= 4) throw e;
          await sleep(delay);
          delay = Math.min(delay * 2, 8000);
        }
      }
    });
  }

  // Ordena por id original
  results.sort((a, b) => a.id - b.id);

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`✅ Listo. Escrito en ${outputPath} (${results.length} items).`);
})().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
