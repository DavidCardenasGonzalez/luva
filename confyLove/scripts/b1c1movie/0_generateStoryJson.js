const fs = require("fs/promises");
const path = require("path");
const util = require("util");
const axios = require("axios");

const LM_STUDIO_BASE_URL = "http://127.0.0.1:1234/v1";
const PROMPT_PATH = path.join(__dirname, "prompt.txt");
const STORY_JSON_PATH = path.join(__dirname, "..", "story.json");
const DEBUG_DIR_PATH = path.join(__dirname, "..", "debug");
const REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
const INPUT_VARIABLES = [
  // 3. Terror/Slasher (Tono: Inquietante)
  {
    genre: "Terror",
    theme: "El Espejo Maldito",
    scenario: "Un ático polvoriento iluminado por una sola vela, donde el reflejo en un espejo antiguo se mueve con retraso.",
  },
  // 4. Comedia/Sitcom (Tono: Divertido)
  {
    genre: "Comedia",
    theme: "Confusión de Identidad",
    scenario: "Una cafetería moderna donde dos espías creen que están hablando con el repartidor de pizza.",
  },
  // 5. Fantasía Épica (Tono: Aventurero)
  {
    genre: "Fantasía",
    theme: "El Huevo de Dragón",
    scenario: "Un bosque de hongos gigantes y brillantes donde dos exploradores encuentran un objeto pulsante bajo una hoja.",
  },
  // 6. Animación/Cartoon (Tono: Infantil/Slapstick)
  {
    genre: "Animación",
    theme: "El Robo de la Galleta",
    scenario: "Una cocina colorida y vibrante donde dos monstruos redondos buscan desesperadamente una galleta desaparecida.",
  },
  // 7. Misterio/Noir (Tono: Suspenso)
  {
    genre: "Misterio Noir",
    theme: "El Caso del Reloj Perdido",
    scenario: "Una oficina oscura con persianas venetianas y humo de lluvia, donde un detective interroga a un sospechoso.",
  },
  // 8. Cyberpunk/Dystopian (Tono: Tecnológico/Tenso)
  {
    genre: "Cyberpunk",
    theme: "Error en el Sistema",
    scenario: "Un callejón lleno de neones azules y lluvia, donde un hacker descubre que su compañero es un androide.",
  },
  // 9. Drama Histórico (Tono: Elegante/Tenso)
  {
    genre: "Drama Histórico",
    theme: "El Mensaje Secreto",
    scenario: "Un salón de baile lujoso de la época victoriana, donde dos nobles intercambian palabras cifradas tras un abanico.",
  },
  // 10. Western (Tono: Confrontativo)
  {
    genre: "Western",
    theme: "Duelo al Mediodía",
    scenario: "Una calle polvorienta de un pueblo del desierto bajo un sol abrasador, con dos forajidos frente a frente.",
  },
  // 11. Superhéroes (Tono: Épico/Acción)
  {
    genre: "Superhéroes",
    theme: "Identidad Revelada",
    scenario: "La azotea de un rascacielos con vistas a una ciudad futurista, donde un héroe descubre el secreto de su aliado.",
  },
    
  // 12. Slice of Life/Modern Drama (Tono: Relatable/Realista)
  {
    genre: "Drama Cotidiano",
    theme: "La Entrevista Crucial",
    scenario: "Una cafetería concurrida y ruidosa, donde dos amigos discuten sobre una oferta de trabajo que cambiará sus vidas.",
  },
    // 13. Anime/Shonen (Tono: Épico/Dramático)
  {
    genre: "Anime",
    theme: "El Despertar del Poder Prohibido",
    scenario: "Un campo de flores de cerezo bajo un cielo nocturno estrellado, donde una joven guerrera siente una energía oscura creciendo dentro de ella mientras su compañero intenta detenerla.",
  },

];


function normalizeInputValue(value) {
  if (typeof value !== "string") {
    return "Aleatorio";
  }

  const trimmedValue = value.trim();
  return trimmedValue || "Aleatorio";
}

function buildPrompt(template, inputVariables) {
  return template
    .replace(/\[INSERT GENRE\]/g, normalizeInputValue(inputVariables.genre))
    .replace(/\[INSERT THEME\]/g, normalizeInputValue(inputVariables.theme))
    .replace(/\[INSERT SCENARIO\]/g, normalizeInputValue(inputVariables.scenario));
}

async function readPromptTemplate() {
  const promptTemplate = await fs.readFile(PROMPT_PATH, "utf8");

  if (!promptTemplate.trim()) {
    throw new Error(`El prompt esta vacio: ${PROMPT_PATH}`);
  }

  return promptTemplate;
}

async function resolveModelId() {
  if (process.env.LM_STUDIO_MODEL?.trim()) {
    return process.env.LM_STUDIO_MODEL.trim();
  }

  const response = await axios.get(`${LM_STUDIO_BASE_URL}/models`, {
    timeout: 30000,
  });

  const modelId = response.data?.data?.[0]?.id;

  if (!modelId) {
    throw new Error(
      "LM Studio no devolvio modelos en /v1/models. Carga un modelo o define LM_STUDIO_MODEL."
    );
  }

  return modelId;
}

function extractAssistantContent(responseData) {
  const content = responseData?.choices?.[0]?.message?.content || responseData?.choices?.[0]?.message?.reasoning_content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("LM Studio no devolvio contenido en choices[0].message.content ni reasoning_content");
  }

  return content.trim();
}

function extractJsonText(rawContent) {
  const fencedMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : rawContent.trim();
  const firstBraceIndex = candidate.search(/[\[{]/);

  if (firstBraceIndex === -1) {
    throw new Error("No encontre JSON valido en la respuesta del modelo");
  }

  const jsonText = candidate.slice(firstBraceIndex).trim();

  try {
    JSON.parse(jsonText);
    return jsonText;
  } catch (error) {
    return jsonText;
  }
}

async function ensureDebugDir() {
  await fs.mkdir(DEBUG_DIR_PATH, { recursive: true });
}

async function writeDebugFile(fileName, content) {
  await ensureDebugDir();
  await fs.writeFile(path.join(DEBUG_DIR_PATH, fileName), content, "utf8");
}

async function repairJsonText({ rawJsonText, modelId, inputIndex }) {
  const response = await axios.post(
    `${LM_STUDIO_BASE_URL}/chat/completions`,
    {
      model: modelId,
      messages: [
        {
          role: "system",
          content:
            "You repair malformed JSON. Return only valid JSON. Do not add explanations or markdown fences.",
        },
        {
          role: "user",
          content: [
            "Fix this malformed JSON so it becomes valid JSON.",
            "Preserve the same schema and content as much as possible.",
            "Return only the repaired JSON object.",
            "",
            rawJsonText,
          ].join("\n"),
        },
      ],
      temperature: 0.1,
      response_format: {
        type: "text",
      },
    },
    {
      timeout: REQUEST_TIMEOUT_MS,
    }
  );

  const repairedContent = extractAssistantContent(response.data);
  const repairedJsonText = extractJsonText(repairedContent);

  try {
    JSON.parse(repairedJsonText);
    return repairedJsonText;
  } catch (error) {
    await writeDebugFile(
      `story_${String(inputIndex).padStart(2, "0")}_repair_failed.json`,
      repairedJsonText
    );
    throw new Error(
      `No se pudo reparar el JSON de la historia ${inputIndex}: ${error.message}`
    );
  }
}

async function parseStoryJson({ assistantContent, modelId, inputIndex }) {
  const jsonText = extractJsonText(assistantContent);

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    await writeDebugFile(
      `story_${String(inputIndex).padStart(2, "0")}_invalid_raw.txt`,
      assistantContent
    );
    await writeDebugFile(
      `story_${String(inputIndex).padStart(2, "0")}_invalid_json.txt`,
      jsonText
    );

    const repairedJsonText = await repairJsonText({
      rawJsonText: jsonText,
      modelId,
      inputIndex,
    });

    await writeDebugFile(
      `story_${String(inputIndex).padStart(2, "0")}_repaired.json`,
      repairedJsonText
    );

    return JSON.parse(repairedJsonText);
  }
}

function validateStory(story, inputIndex) {
  if (!story || typeof story !== "object" || Array.isArray(story)) {
    throw new Error(`La historia ${inputIndex} no es un objeto JSON valido`);
  }

  if (typeof story.id !== "string" || !story.id.trim()) {
    throw new Error(`La historia ${inputIndex} no contiene un "id" valido`);
  }

  if (!Array.isArray(story.chapters) || story.chapters.length === 0) {
    throw new Error(`La historia ${inputIndex} no contiene chapters validos`);
  }
}

async function generateStory({ promptTemplate, inputVariables, modelId, inputIndex }) {
  const prompt = buildPrompt(promptTemplate, inputVariables);
  const response = await axios.post(
    `${LM_STUDIO_BASE_URL}/chat/completions`,
    {
      model: modelId,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 1,
      response_format: {
        type: "text",
      },
    },
    {
      timeout: REQUEST_TIMEOUT_MS,
    }
  );

  const assistantContent = extractAssistantContent(response.data);
  const story = await parseStoryJson({
    assistantContent,
    modelId,
    inputIndex,
  });

  validateStory(story, inputIndex);

  return {
    story,
    prompt,
  };
}

async function writeStoryJson(stories) {
  await fs.writeFile(STORY_JSON_PATH, JSON.stringify(stories, null, 2), "utf8");
}

async function loadExistingStories() {
  try {
    const content = await fs.readFile(STORY_JSON_PATH, "utf8");
    const stories = JSON.parse(content);
    if (!Array.isArray(stories)) {
      throw new Error("El archivo story.json no contiene un array");
    }
    return stories;
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function main() {
  if (!Array.isArray(INPUT_VARIABLES) || INPUT_VARIABLES.length === 0) {
    throw new Error("INPUT_VARIABLES debe ser un array con al menos un elemento");
  }

  const promptTemplate = await readPromptTemplate();
  const modelId = await resolveModelId();
  let stories = await loadExistingStories();

  if (process.env.FORCE_REGENERATE) {
    console.log("Forzando regeneración completa");
    stories = [];
  }

  console.log(`Cargadas ${stories.length} historias existentes`);
  if (stories.length > 0) {
    console.log(`IDs existentes: ${stories.map(s => s.id).join(', ')}`);
  }

  for (const [index, inputVariables] of INPUT_VARIABLES.entries()) {
    const inputIndex = index + 1;

    if (index < stories.length) {
      console.log(`Historia ${inputIndex} ya existe, saltando`);
      continue;
    }

    const { story } = await generateStory({
      promptTemplate,
      inputVariables,
      modelId,
      inputIndex,
    });

    stories.push(story);

    // Guardar progreso después de cada historia generada
    await writeStoryJson(stories);

    console.log(`Historia ${inputIndex} generada y guardada`);
    console.log(`Model: ${modelId}`);
    console.log(`Genre: ${normalizeInputValue(inputVariables.genre)}`);
    console.log(`Theme: ${normalizeInputValue(inputVariables.theme)}`);
    console.log(`Scenario: ${normalizeInputValue(inputVariables.scenario)}`);
    console.log(`Story ID: ${story.id}`);
  }

  console.log(`story.json actualizado en: ${STORY_JSON_PATH}`);
  console.log(`Total de historias: ${stories.length}`);
}

main().catch((error) => {
  const errorData = error.response?.data || {
    message: error.message,
    stack: error.stack,
  };

  console.error(
    "Error al generar story.json:",
    typeof errorData === "object"
      ? util.inspect(errorData, { depth: null, colors: true, compact: false })
      : errorData
  );
  process.exit(1);
});
