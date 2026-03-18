/**
 * Generate 50 requirements per mission from scripts/stories-seed.ts:
 * - 25 conversation requirements tied to the scene
 * - 25 English requirements (B2/C1 vocab, phrasal verbs, idioms, collocations)
 *
 * The script calls OpenAI once per mission, but processes missions in batches
 * of 10 and writes a checkpoint after every batch so it can resume safely.
 *
 * Usage:
 *   export OPENAI_API_KEY="sk-..."
 *   node scripts/fill-story-requirements.js
 *   node scripts/fill-story-requirements.js --model gpt-5 --batch-size 10
 *   node scripts/fill-story-requirements.js --story-id airport_chaos
 *   node scripts/fill-story-requirements.js --mission-id airport_chaos_missing_luggage_agent
 *   node scripts/fill-story-requirements.js --max-missions 3 --dry-run
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const DEFAULT_INPUT = path.join(__dirname, "stories-seed.ts");
const DEFAULT_MODEL = process.env.OPENAI_REQUIREMENTS_MODEL || "gpt-5";
const DEFAULT_REASONING = process.env.OPENAI_REQUIREMENTS_REASONING || "low";
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_MAX_TRIES = 5;
const DEFAULT_VALIDATION_TRIES = 3;
const ENV_FILE = path.join(__dirname, "environment.local.json");

loadLocalEnv();

function loadLocalEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    console.log(`No local env file at ${ENV_FILE}, continuing.`);
    return;
  }

  const raw = fs.readFileSync(ENV_FILE, "utf8");
  const data = JSON.parse(raw);
  console.log(`Loading env vars from ${ENV_FILE}`);

  if (!data || typeof data !== "object") return;

  for (const [key, value] of Object.entries(data)) {
    if (!process.env[key] && typeof value === "string" && value) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const options = {
    input: DEFAULT_INPUT,
    output: null,
    model: DEFAULT_MODEL,
    reasoning: DEFAULT_REASONING,
    batchSize: DEFAULT_BATCH_SIZE,
    maxTries: DEFAULT_MAX_TRIES,
    validationTries: DEFAULT_VALIDATION_TRIES,
    storyId: null,
    missionId: null,
    maxMissions: null,
    force: false,
    dryRun: false,
    continueOnError: false,
    resume: true,
    help: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    switch (arg) {
      case "--input":
        options.input = resolveArgPath(argv[++index], "input");
        break;
      case "--output":
        options.output = resolveArgPath(argv[++index], "output");
        break;
      case "--model":
        options.model = requireValue(argv[++index], "model");
        break;
      case "--reasoning":
        options.reasoning = requireValue(argv[++index], "reasoning");
        break;
      case "--batch-size":
        options.batchSize = parsePositiveInt(argv[++index], "batch-size");
        break;
      case "--max-tries":
        options.maxTries = parsePositiveInt(argv[++index], "max-tries");
        break;
      case "--validation-tries":
        options.validationTries = parsePositiveInt(
          argv[++index],
          "validation-tries"
        );
        break;
      case "--story-id":
        options.storyId = requireValue(argv[++index], "story-id");
        break;
      case "--mission-id":
        options.missionId = requireValue(argv[++index], "mission-id");
        break;
      case "--max-missions":
        options.maxMissions = parsePositiveInt(argv[++index], "max-missions");
        break;
      case "--force":
        options.force = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--continue-on-error":
        options.continueOnError = true;
        break;
      case "--no-resume":
        options.resume = false;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown arg: ${arg}`);
    }
  }

  if (!options.output) {
    options.output = deriveOutputPath(options.input);
  }

  return options;
}

function resolveArgPath(value, label) {
  const provided = requireValue(value, label);
  if (path.isAbsolute(provided)) return provided;
  return path.resolve(process.cwd(), provided);
}

function requireValue(value, label) {
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for --${label}`);
  }
  return value;
}

function parsePositiveInt(value, label) {
  const parsed = Number.parseInt(requireValue(value, label), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`--${label} must be a positive integer`);
  }
  return parsed;
}

function deriveOutputPath(inputPath) {
  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, `${parsed.name}.requirements.generated${parsed.ext}`);
}

function printHelp() {
  console.log(`
Usage:
  node scripts/fill-story-requirements.js [options]

Options:
  --input <path>             Input file (.ts or .json). Default: scripts/stories-seed.ts
  --output <path>            Output file. Default: <input>.requirements.generated.<ext>
  --model <id>               OpenAI model id. Default: ${DEFAULT_MODEL}
  --reasoning <level>        Reasoning effort sent to Responses API. Default: ${DEFAULT_REASONING}
  --batch-size <n>           Missions processed in parallel per batch. Default: ${DEFAULT_BATCH_SIZE}
  --max-tries <n>            HTTP retry attempts. Default: ${DEFAULT_MAX_TRIES}
  --validation-tries <n>     Regeneration attempts when JSON/validation fails. Default: ${DEFAULT_VALIDATION_TRIES}
  --story-id <id>            Only process one story
  --mission-id <id>          Only process one mission
  --max-missions <n>         Limit the number of pending missions
  --force                    Regenerate even if mission already has 50 requirements
  --dry-run                  Parse, select missions, and write output without calling OpenAI
  --continue-on-error        Continue after a failed batch item and keep successful checkpoints
  --no-resume                Ignore an existing output file
  --help, -h                 Show this help
`);
}

function stripBom(text) {
  return text.replace(/^\uFEFF/, "");
}

function loadStories(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const raw = stripBom(fs.readFileSync(filePath, "utf8"));

  if (ext === ".json") {
    return normalizeStoriesPayload(JSON.parse(raw), filePath);
  }

  return loadStoriesFromModuleSource(raw, filePath);
}

function normalizeStoriesPayload(payload, filePath) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.STORIES_SEED)) return payload.STORIES_SEED;
  throw new Error(`Unsupported stories payload in ${filePath}`);
}

function loadStoriesFromModuleSource(source, filePath) {
  const transformed = source
    .replace(/^\s*export\s+const\s+STORIES_SEED\s*=/m, "const STORIES_SEED =")
    .concat("\nmodule.exports = { STORIES_SEED };");

  const sandbox = {
    module: { exports: {} },
    exports: {},
    require,
    console,
  };

  vm.createContext(sandbox);
  const script = new vm.Script(transformed, { filename: filePath });
  script.runInContext(sandbox);

  const stories = sandbox.module.exports && sandbox.module.exports.STORIES_SEED;
  if (!Array.isArray(stories)) {
    throw new Error(`Could not load STORIES_SEED from ${filePath}`);
  }
  return stories;
}

function serializeStories(stories, outputPath) {
  const ext = path.extname(outputPath).toLowerCase();
  if (ext === ".json") {
    return `${JSON.stringify(stories, null, 2)}\n`;
  }
  return `export const STORIES_SEED = ${JSON.stringify(stories, null, 2)};\n`;
}

function writeStories(outputPath, stories) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serializeStories(stories, outputPath), "utf8");
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildMissionIndex(stories) {
  const index = new Map();
  for (const story of stories) {
    const storyId = story && story.storyId;
    const missions = Array.isArray(story && story.missions) ? story.missions : [];
    for (const mission of missions) {
      if (mission && mission.missionId) {
        index.set(mission.missionId, mission);
      }
    }
  }
  return index;
}

function maybeResumeFromOutput(baseStories, options) {
  if (!options.resume || !fs.existsSync(options.output)) {
    return deepClone(baseStories);
  }

  console.log(`Resuming from existing output: ${options.output}`);
  const resumedStories = deepClone(baseStories);
  const existingStories = loadStories(options.output);
  const missionIndex = buildMissionIndex(existingStories);

  for (const story of resumedStories) {
    for (const mission of story.missions || []) {
      const existingMission = missionIndex.get(mission.missionId);
      if (
        existingMission &&
        Array.isArray(existingMission.requirements) &&
        existingMission.requirements.length === 50
      ) {
        mission.requirements = deepClone(existingMission.requirements);
      }
    }
  }

  return resumedStories;
}

function listMissionTasks(stories, options) {
  const tasks = [];

  for (let storyIndex = 0; storyIndex < stories.length; storyIndex++) {
    const story = stories[storyIndex];
    if (options.storyId && story.storyId !== options.storyId) continue;

    const missions = Array.isArray(story.missions) ? story.missions : [];
    for (let missionIndex = 0; missionIndex < missions.length; missionIndex++) {
      const mission = missions[missionIndex];
      if (options.missionId && mission.missionId !== options.missionId) continue;

      const alreadyDone =
        Array.isArray(mission.requirements) && mission.requirements.length === 50;
      if (alreadyDone && !options.force) continue;

      tasks.push({
        storyIndex,
        missionIndex,
        story,
        mission,
      });
    }
  }

  if (Number.isInteger(options.maxMissions)) {
    return tasks.slice(0, options.maxMissions);
  }

  return tasks;
}

function countMatchingMissions(stories, options) {
  let count = 0;
  for (const story of stories) {
    if (options.storyId && story.storyId !== options.storyId) continue;
    for (const mission of story.missions || []) {
      if (options.missionId && mission.missionId !== options.missionId) continue;
      count += 1;
    }
  }
  return count;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function slugifySnakeCase(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

function normalizeRequirementItem(item, prefix, index) {
  const fallbackId = `${prefix}_item_${String(index + 1).padStart(2, "0")}`;
  const rawId = item && typeof item.requirementId === "string" ? item.requirementId : fallbackId;
  const baseId = slugifySnakeCase(rawId) || fallbackId;
  const normalizedId = baseId.startsWith(`${prefix}_`) ? baseId : `${prefix}_${baseId}`;
  const text = item && typeof item.text === "string" ? item.text.trim().replace(/\s+/g, " ") : "";

  return {
    requirementId: normalizedId,
    text,
  };
}

function validateRequirementBucket(items, expectedCount, prefix, label) {
  if (!Array.isArray(items)) {
    return { ok: false, errors: [`${label} must be an array.`] };
  }

  if (items.length !== expectedCount) {
    return {
      ok: false,
      errors: [`${label} must contain exactly ${expectedCount} items, got ${items.length}.`],
    };
  }

  const normalized = items.map((item, index) =>
    normalizeRequirementItem(item, prefix, index)
  );

  const idSet = new Set();
  const textSet = new Set();
  const errors = [];

  for (const [index, item] of normalized.entries()) {
    if (!item.requirementId) {
      errors.push(`${label}[${index}] is missing requirementId.`);
    }
    if (!item.text) {
      errors.push(`${label}[${index}] is missing text.`);
    }
    if (item.text.length < 12) {
      errors.push(`${label}[${index}] text is too short to be useful.`);
    }

    const normalizedText = item.text.toLowerCase();
    if (idSet.has(item.requirementId)) {
      errors.push(`${label}[${index}] requirementId is duplicated: ${item.requirementId}`);
    }
    if (textSet.has(normalizedText)) {
      errors.push(`${label}[${index}] text is duplicated.`);
    }
    idSet.add(item.requirementId);
    textSet.add(normalizedText);
  }

  return {
    ok: errors.length === 0,
    errors,
    items: normalized,
  };
}

function validateGeneratedRequirements(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, errors: ["Response root must be an object."] };
  }

  const conversation = validateRequirementBucket(
    payload.conversationRequirements,
    25,
    "conversation",
    "conversationRequirements"
  );
  const english = validateRequirementBucket(
    payload.englishRequirements,
    25,
    "english",
    "englishRequirements"
  );

  const errors = [...(conversation.errors || []), ...(english.errors || [])];
  const combinedIds = new Set();
  const combinedTexts = new Set();

  if (conversation.ok && english.ok) {
    for (const item of [...conversation.items, ...english.items]) {
      const textKey = item.text.toLowerCase();
      if (combinedIds.has(item.requirementId)) {
        errors.push(`Duplicate requirementId across buckets: ${item.requirementId}`);
      }
      if (combinedTexts.has(textKey)) {
        errors.push(`Duplicate text across buckets: ${item.text}`);
      }
      combinedIds.add(item.requirementId);
      combinedTexts.add(textKey);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    requirements: [...conversation.items, ...english.items],
  };
}

function buildMessages(story, mission, previousErrors) {
  const system = {
    role: "system",
    content:
      "You generate requirement lists for an English-learning app. " +
      "Return valid JSON only, with no markdown, no prose, and no extra keys.",
  };

  const userPayload = {
    task:
      "Generate 50 requirements for one mission. The first 25 must be scene-specific conversation goals. The last 25 must be English vocabulary goals aligned with the mission theme.",
    response_format_instruction:
      "Return a single JSON object only. Do not wrap the JSON in markdown.",
    output_contract: {
      conversationRequirements: [
        {
          requirementId: "conversation_example_id",
          text: "Instruccion en espanol sobre algo que el alumno debe preguntar, decir o lograr en ingles.",
        },
      ],
      englishRequirements: [
        {
          requirementId: "english_example_id",
          text: 'Instruccion en espanol que obligue a usar una palabra, collocation, phrasal verb o idiom en ingles, por ejemplo "turn down".',
        },
      ],
    },
    rules: [
      "Return exactly 2 top-level keys: conversationRequirements and englishRequirements.",
      "conversationRequirements must contain exactly 25 items.",
      "englishRequirements must contain exactly 25 items.",
      "Each item must contain exactly 2 keys: requirementId and text.",
      "Write all text values in Spanish.",
      "Make every requirement objective and checkable during the conversation.",
      "Keep requirements natural for a B2 learner, but English vocab targets may reach solid B2/C1 when appropriate.",
      "The 25 conversation requirements must be about the scene, intentions, reactions, questions, negotiation, clarification, empathy, boundaries, opinions, or persuasion.",
      "The 25 English requirements must force specific English usage relevant to the mission. Use a mix of advanced vocabulary, collocations, discourse markers, phrasal verbs, and idioms.",
      "At least 8 of the englishRequirements should explicitly target phrasal verbs or idioms.",
      "Avoid generic filler such as 'start the conversation' unless it is very specific to the scene.",
      "Avoid duplicates, near-duplicates, and repeated wording.",
      "Keep requirementId in snake_case and unique. Prefix conversation ids with conversation_ and english ids with english_.",
      "Do not mention categories in the text. Only the ids should encode the category.",
      "Do not use numbering in requirement text.",
      "Do not copy the reference requirements verbatim. They are only style references.",
      "Each requirement must fit this exact mission and character, not a generic conversation.",
    ],
    storyContext: {
      storyId: story.storyId,
      title: story.title,
      summary: story.summary,
      level: story.level || null,
      tags: story.tags || [],
    },
    missionContext: {
      missionId: mission.missionId,
      title: mission.title,
      sceneSummary: mission.sceneSummary || "",
      aiRole: mission.aiRole || "",
      caracterName: mission.caracterName || "",
      caracterPrompt: mission.caracterPrompt || "",
      existingRequirements: Array.isArray(mission.requirements) ? mission.requirements : [],
    },
  };

  if (previousErrors && previousErrors.length > 0) {
    userPayload.validationFeedback = previousErrors;
    userPayload.retryInstruction =
      "Regenerate the full response and fix every validation problem above.";
  }

  const user = {
    role: "user",
    content: JSON.stringify(userPayload),
  };

  return [system, user];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callOpenAI(messages, options) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in environment.");
  }

  let attempt = 0;
  let delayMs = 1000;
  const systemMsg = messages.find((message) => message.role === "system");
  const userMsg = [...messages].reverse().find((message) => message.role === "user");

  if (!userMsg) {
    throw new Error("Cannot call OpenAI without a user message.");
  }

  while (attempt < options.maxTries) {
    attempt += 1;
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: options.model,
          reasoning: { effort: options.reasoning },
          text: { format: { type: "json_object" } },
          instructions: systemMsg ? systemMsg.content : undefined,
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: userMsg.content,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new Error(
          `OpenAI HTTP ${response.status}: ${bodyText || response.statusText}`
        );
      }

      const data = await response.json();
      const contentText = extractOutputText(data);
      return JSON.parse(contentText);
    } catch (error) {
      console.warn(`OpenAI attempt ${attempt}/${options.maxTries} failed: ${error.message}`);
      if (attempt >= options.maxTries) {
        throw error;
      }
      await sleep(delayMs);
      delayMs = Math.min(delayMs * 2, 10000);
    }
  }

  throw new Error("OpenAI request failed after exhausting retries.");
}

function extractOutputText(data) {
  const outputItems = Array.isArray(data && data.output) ? data.output : [];
  const textParts = [];

  for (const item of outputItems) {
    if (!item || item.type !== "message" || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part && part.type === "output_text" && typeof part.text === "string") {
        textParts.push(part.text);
      }
    }
  }

  const joined = textParts.join("").trim();
  if (!joined) {
    throw new Error("OpenAI response did not contain output_text.");
  }

  return joined;
}

async function generateMissionRequirements(task, options) {
  let validationErrors = [];

  for (let attempt = 1; attempt <= options.validationTries; attempt++) {
    const messages = buildMessages(task.story, task.mission, validationErrors);
    const payload = await callOpenAI(messages, options);
    const validation = validateGeneratedRequirements(payload);

    if (validation.ok) {
      return validation.requirements;
    }

    validationErrors = validation.errors;
    console.warn(
      `Validation failed for ${task.mission.missionId} (attempt ${attempt}/${options.validationTries}):`
    );
    for (const error of validationErrors) {
      console.warn(`  - ${error}`);
    }
  }

  throw new Error(
    `Could not generate valid requirements for ${task.mission.missionId} after ${options.validationTries} validation attempts.`
  );
}

function applyMissionRequirements(stories, task, requirements) {
  stories[task.storyIndex].missions[task.missionIndex].requirements = requirements;
}

async function processBatch(batch, workingStories, options, batchIndex, totalBatches) {
  console.log(
    `Processing batch ${batchIndex + 1}/${totalBatches} with ${batch.length} mission(s).`
  );

  const promises = batch.map(async (task) => {
    console.log(`  -> ${task.mission.missionId}`);
    if (options.dryRun) {
      return {
        status: "fulfilled",
        task,
        requirements: Array.isArray(task.mission.requirements)
          ? deepClone(task.mission.requirements)
          : [],
      };
    }

    const requirements = await generateMissionRequirements(task, options);
    return { status: "fulfilled", task, requirements };
  });

  const settled = await Promise.allSettled(promises);
  const failures = [];

  for (const result of settled) {
    if (result.status === "fulfilled") {
      applyMissionRequirements(workingStories, result.value.task, result.value.requirements);
      continue;
    }

    failures.push(result.reason);
  }

  writeStories(options.output, workingStories);
  console.log(`Checkpoint written to ${options.output}`);

  if (failures.length > 0) {
    console.error(`Batch ${batchIndex + 1} had ${failures.length} failure(s).`);
    for (const failure of failures) {
      console.error(`  - ${failure && failure.message ? failure.message : String(failure)}`);
    }
    if (!options.continueOnError) {
      throw new Error("Stopping after batch failures. Re-run with resume to continue.");
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const baseStories = loadStories(options.input);
  const workingStories = maybeResumeFromOutput(baseStories, options);
  const tasks = listMissionTasks(workingStories, options);
  const matchingMissionCount = countMatchingMissions(workingStories, options);

  if (matchingMissionCount === 0) {
    const filters = [];
    if (options.storyId) filters.push(`storyId=${options.storyId}`);
    if (options.missionId) filters.push(`missionId=${options.missionId}`);
    const suffix = filters.length > 0 ? ` for ${filters.join(", ")}` : "";
    throw new Error(`No missions matched the current selection${suffix}.`);
  }

  console.log(`Input: ${options.input}`);
  console.log(`Output: ${options.output}`);
  console.log(`Model: ${options.model}`);
  console.log(`Pending missions: ${tasks.length}`);
  console.log(`Batch size: ${options.batchSize}`);
  if (options.dryRun) {
    console.log("Dry run enabled. No OpenAI calls will be made.");
  }

  if (tasks.length === 0) {
    writeStories(options.output, workingStories);
    console.log("No pending missions. Output is already up to date.");
    return;
  }

  const batches = chunkArray(tasks, options.batchSize);
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    await processBatch(
      batches[batchIndex],
      workingStories,
      options,
      batchIndex,
      batches.length
    );
  }

  console.log("Finished.");
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
