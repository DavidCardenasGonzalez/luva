/**
 * Transformador de ESCENARIOS en MISIONES con IA (GPT-5 mini + reasoning.low):
 * - Lee un archivo de escenarios (historias) tipo:
 *   [
 *     {
 *       "storyId": "...",
 *       "title": "...",
 *       "summary": "...",
 *       "level": "B2",
 *       "tags": [...],
 *       "unlockCost": 1,
 *       "missions": [] // vacío o ausente
 *     },
 *     ...
 *   ]
 *
 * - Para cada historia sin misiones, genera:
 *   missions: [
 *     {
 *       missionId: string,
 *       title: string,
 *       sceneSummary: string,
 *       aiRole: string,
 *       caracterName: string,
 *       caracterPrompt: string,
 *       requirements: [
 *         { requirementId: string, text: string },
 *         ...
 *       ]
 *     }
 *   ]
 *
 * Uso:
 *   1) export OPENAI_API_KEY="sk-..."
 *   2) node transform_scenarios.js
 *
 * Archivos:
 *   - input:  ./b2_scenarios.json
 *   - output: ./b2_scenarios_filled.json
 */

const fs = require("fs");
const path = require("path");

// Si usas Node < 18, descomenta esta línea y asegura que tengas node-fetch instalado:
// const fetch = require("node-fetch");

// ---------- Carga de environment.local.json ----------
const secretsFile = path.join(__dirname, "environment.local.json");
if (fs.existsSync(secretsFile)) {
  const rawEnv = fs.readFileSync(secretsFile, "utf8");
  const data = JSON.parse(rawEnv);
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

// ---------- Config ----------
const inputPath = "./b2_scenarios.json";
const outputPath = "./b2_scenarios_filled.json";
const MAX_STORIES = 500; // por si quieres limitar

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("Falta OPENAI_API_KEY en variables de entorno.");
  process.exit(1);
}

// ---------- Utilidades ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Limita concurrencia simple */
function createQueue(limit = 2) {
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

/** Llama a la API Responses con backoff/reintentos. */
async function chatJSON(messages, { maxTries = 5 } = {}) {
  let attempt = 0;
  let delay = 1000;
  console.log("Llamando a la API de OpenAI...");

  // Separamos system vs user porque Responses usa `instructions`
  const systemMsg = messages.find((m) => m.role === "system");
  const userMsgs = messages.filter((m) => m.role === "user");
  const mainUser = userMsgs[userMsgs.length - 1];

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
          model: "gpt-5-mini",
          reasoning: { effort: "low" },
          // Forzamos que el output sea JSON
          text: { format: { type: "json_object" } },
          // System prompt -> instructions
          instructions: systemMsg ? systemMsg.content : undefined,
          // User prompt -> input (formato de mensajes)
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

      // data.output = [ { type: "message", content: [ { type: "output_text", text: "..." } ] }, ...]
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

      let parsed;
      try {
        parsed = JSON.parse(contentText);
      } catch (e) {
        console.error("Contenido recibido (no parseable):", contentText);
        throw new Error("La respuesta del modelo no es JSON válido.");
      }

      console.log("Respuesta parseada para escenario:", parsed);
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

// ---------- Prompting para ESCENARIOS ----------
function buildMessagesForStory(story) {
  const system = {
    role: "system",
    content:
      "Eres un generador de misiones para una app de practicar inglés (pasar de B1 a B2). " +
      "Las misiones son escenas de conversación con personajes locos, divertidos y memorables. " +
      "Respondes SOLO JSON válido. Sin texto extra.",
  };

  // Ejemplo de formato de misión, tomado de Speed Dating Madness
  const exampleMission = {
    missionId: "date_arrogant_millionaire",
    title: "La cita con el millonario arrogante",
    sceneSummary:
      "Te sientas frente a un hombre con un reloj carísimo y una sonrisa demasiado confiada.",
    aiRole:
      "Eres un millonario arrogante en una cita de speed dating. Presumes de tu dinero, viajes y poder, y te gusta impresionar a la gente.",
    caracterName: "Alexander Beaumont III",
    caracterPrompt:
      "A tall, sharply dressed man in his mid-30s wearing an expensive tailored suit and a gold watch. He has slicked-back hair, a confident smirk, and exudes an air of superiority. He’s sitting in a luxurious lounge chair with a glass of champagne.",
    requirements: [
      {
        requirementId: "ask_job",
        text: "Pregúntale a qué se dedica.",
      },
      {
        requirementId: "respond_to_boast",
        text: "Reacciona a cuando presuma de su riqueza o logros.",
      },
      {
        requirementId: "personal_question",
        text: "Hazle una pregunta personal para ver si tiene un lado más humano.",
      },
    ],
  };

  const user = {
    role: "user",
    content: JSON.stringify({
      task: "Generar misiones de conversación para una historia de la app.",
      constraints: [
        "Devuelve SOLO un objeto JSON con EXACTAMENTE esta clave raíz: missions.",
        "missions debe ser un array de entre 4 y 6 misiones.",
        "Cada misión debe tener EXACTAMENTE estas claves: missionId, title, sceneSummary, aiRole, caracterName, caracterPrompt, requirements.",
        "missionId: string en inglés, en snake_case, único dentro de la historia. Prefijo con el storyId si tiene sentido.",
        "title: título corto en español, llamativo y divertido.",
        "sceneSummary: 1–2 frases en español que describan la escena de forma clara y con un toque de humor si encaja.",
        "aiRole: descripción en español del rol del personaje IA y cómo debe comportarse (tono, actitud, estilo de respuestas).",
        "caracterName: nombre del personaje en inglés (o muy internacional) coherente con el contexto.",
        "caracterPrompt: descripción física y de actitud en INGLÉS (2–4 frases) pensada para generar una imagen del personaje. Incluye ropa, expresión, ambiente, etc.",
        "requirements: array de EXACTAMENTE 3 objetos con claves requirementId y text.",
        "requirementId: string en snake_case que identifique la habilidad/comportamiento (ej: ask_job, react_to_joke).",
        "text: instrucción en español indicando lo que el alumno debe hacer/preguntar/decir en inglés durante la conversación.",
        "Mantén el NIVEL de dificultad en B2 (no C1/C2).",
        "Evita vocabulario ultra técnico, pero permite expresiones naturales, humor y un poco de caos.",
        "Las misiones deben encajar con el título y summary de la historia, pero pueden ser creativas y locas.",
        "No repitas literalmente el summary de la historia en todas las sceneSummary.",
        "Las misiones deben tener objetivos que se puedan evaluar objetivamente (se puede decir si el alumno las cumplió o no)."
      ],
      story_meta: {
        storyId: story.storyId,
        title: story.title,
        summary: story.summary,
        level: story.level,
        tags: story.tags || [],
        unlockCost: story.unlockCost,
      },
      format_example: {
        missions: [exampleMission],
      },
    }),
  };

  return [system, user];
}

// ---------- Main ----------
(async function main() {
  if (!fs.existsSync(inputPath)) {
    console.error(`No se encontró el archivo de entrada: ${inputPath}`);
    process.exit(1);
  }

  const rawText = fs.readFileSync(inputPath, "utf8");
  let raw;
  try {
    raw = JSON.parse(rawText);
  } catch (e) {
    console.error("El archivo de entrada no es JSON válido:", e.message);
    process.exit(1);
  }

  if (!Array.isArray(raw)) {
    console.error("El archivo de entrada debe ser un array JSON de historias.");
    process.exit(1);
  }

  const stories = MAX_STORIES > 0 ? raw.slice(0, MAX_STORIES) : raw;
  console.log(`Historias cargadas: ${stories.length}`);

  const enqueue = createQueue(2);
  const outputStories = [];
  let processed = 0;

  for (const story of stories) {
    await enqueue(async () => {
      const alreadyHasMissions =
        Array.isArray(story.missions) && story.missions.length > 0;

      if (alreadyHasMissions) {
        console.log(
          `Historia ${story.storyId} ya tiene misiones, se copia tal cual.`
        );
        outputStories.push(story);
        processed++;
        return;
      }

      console.log(
        `Generando misiones para historia ${story.storyId} - ${story.title}`
      );
      const messages = buildMessagesForStory(story);
      const gen = await chatJSON(messages);

      if (!gen || !Array.isArray(gen.missions) || gen.missions.length === 0) {
        throw new Error(
          `La IA no devolvió misiones válidas para storyId=${story.storyId}`
        );
      }

      // Validación rápida de estructura
      gen.missions.forEach((m, idx) => {
        const baseMsg = `Misión #${idx} de storyId=${story.storyId}`;
        if (
          !m.missionId ||
          !m.title ||
          !m.sceneSummary ||
          !m.aiRole ||
          !m.caracterName ||
          !m.caracterPrompt ||
          !Array.isArray(m.requirements)
        ) {
          throw new Error(`${baseMsg}: faltan campos obligatorios.`);
        }
        if (m.requirements.length !== 3) {
          throw new Error(
            `${baseMsg}: requirements debe tener EXACTAMENTE 3 items.`
          );
        }
      });

      const newStory = {
        ...story,
        missions: gen.missions,
      };

      outputStories.push(newStory);
      processed++;
      console.log(
        `✔ Misiones generadas para ${story.storyId}. Progreso ${processed}/${stories.length}`
      );
    });
  }

  // Mantener historias en el mismo orden que el input
  const ordered = stories.map(
    (s) => outputStories.find((o) => o.storyId === s.storyId) || s
  );

  fs.writeFileSync(outputPath, JSON.stringify(ordered, null, 2), "utf8");
  console.log(`✅ Listo. Escrito en ${outputPath} (${ordered.length} historias).`);
})().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
