const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const dotenv = require("dotenv");

const { writeGeneratedSpeech } = require("../lessons/voiceboxClient");
const { findFfmpegPath, runFfmpeg } = require("../b1c1movie/ffmpegUtils");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DEFAULT_INPUT_PATH = path.join(__dirname, "dialogue.json");
const DEFAULT_BEEP_PATH = path.join(__dirname, "beep.wav");
const DEFAULT_OUTPUT_PATH = path.join(__dirname, "shadowing-dialogue.wav");
const DEFAULT_WORK_DIR = path.join(__dirname, ".generated");

function parseArgs(argv) {
  const options = {
    inputPath: DEFAULT_INPUT_PATH,
    beepPath: DEFAULT_BEEP_PATH,
    outputPath: DEFAULT_OUTPUT_PATH,
    workDir: DEFAULT_WORK_DIR,
    force: false,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[index];
    };

    if (arg === "--input") options.inputPath = path.resolve(next());
    else if (arg === "--beep") options.beepPath = path.resolve(next());
    else if (arg === "--output") options.outputPath = path.resolve(next());
    else if (arg === "--work-dir") options.workDir = path.resolve(next());
    else if (arg === "--force") options.force = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  node shadowings/generateShadowingAudio.js [options]

Options:
  --input <path>      dialogue.json path. Default: shadowings/dialogue.json
  --beep <path>       Beep wav path. Default: shadowings/beep.wav
  --output <path>     Final audio path. Default: shadowings/shadowing-dialogue.wav
  --work-dir <path>   Cache/temp directory. Default: shadowings/.generated
  --force             Regenerate cached TTS and silence files
  --dry-run           Validate and print the planned segment sequence only

Voice mapping:
  characters[].voice is used as the Voicebox profile name by default.
  If your JSON uses aliases like male_1/female_1, set:
  VOICEBOX_SHADOWING_VOICE_MAP='{"male_1":"Real Voicebox Profile","female_1":"Other Profile"}'
`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseVoiceMap() {
  const raw = process.env.VOICEBOX_SHADOWING_VOICE_MAP;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("VOICEBOX_SHADOWING_VOICE_MAP must be a JSON object.");
    }
    return parsed;
  } catch (error) {
    throw new Error(`Invalid VOICEBOX_SHADOWING_VOICE_MAP: ${error.message}`);
  }
}

function isUuidish(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

function hashText(value) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, 16);
}

function sanitizeName(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function validateDialogue(data, inputPath, beepPath) {
  if (!Array.isArray(data?.characters)) {
    throw new Error(`${inputPath} must contain a characters array.`);
  }
  if (!Array.isArray(data?.dialogues)) {
    throw new Error(`${inputPath} must contain a dialogues array.`);
  }
  if (!fs.existsSync(beepPath)) {
    throw new Error(`Beep file not found: ${beepPath}`);
  }

  const characterByName = new Map();
  for (const character of data.characters) {
    if (!character?.name || !character?.voice) {
      throw new Error("Every character must include name and voice.");
    }
    characterByName.set(character.name, character);
  }

  data.dialogues.forEach((dialogue, index) => {
    if (!characterByName.has(dialogue?.character)) {
      throw new Error(`dialogues[${index}] references unknown character: ${dialogue?.character}`);
    }
    if (!dialogue?.text || typeof dialogue.text !== "string") {
      throw new Error(`dialogues[${index}] must include text.`);
    }
    const pauseAfter = Number(dialogue.pauseAfter || 0);
    if (!Number.isFinite(pauseAfter) || pauseAfter < 0) {
      throw new Error(`dialogues[${index}].pauseAfter must be a number >= 0.`);
    }
  });

  return characterByName;
}

function getProfileOverride(character, voiceMap) {
  const mappedVoice = voiceMap[character.voice] || character.voice;
  if (isUuidish(mappedVoice)) return { profileId: mappedVoice };
  return { profileName: mappedVoice };
}

function getSpeechPath(workDir, dialogue, dialogueIndex, character) {
  const name = sanitizeName(`${dialogueIndex + 1}-${character.name}-${character.voice}`);
  const hash = hashText(`${character.name}\n${character.voice}\n${dialogue.text}`);
  return path.join(workDir, "speech", `${name}-${hash}.wav`);
}

function getSilencePath(workDir, seconds) {
  const normalized = String(seconds).replace(/[^0-9.]+/g, "_");
  return path.join(workDir, "silence", `silence-${normalized}s.wav`);
}

function addDialogueSegments(sequence, speechPath, beepPath, silencePath, repeat) {
  const repetitions = repeat ? 2 : 1;
  for (let count = 0; count < repetitions; count += 1) {
    sequence.push({ type: "speech", path: speechPath });
    if (beepPath && silencePath) {
      sequence.push({ type: "beep", path: beepPath });
      sequence.push({ type: "silence", path: silencePath });
    }
  }
}

async function ensureSilence(ffmpegPath, silencePath, seconds, force) {
  if (!force && fs.existsSync(silencePath)) return;
  await fsp.mkdir(path.dirname(silencePath), { recursive: true });
  runFfmpeg(ffmpegPath, [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=r=44100:cl=stereo",
    "-t",
    String(seconds),
    "-c:a",
    "pcm_s16le",
    silencePath,
  ]);
}

async function ensureSpeech(outputPath, dialogue, character, voiceMap, force) {
  if (!force && fs.existsSync(outputPath)) return { outputPath, cached: true };

  const voiceOverride = getProfileOverride(character, voiceMap);
  const instruct =
    process.env.VOICEBOX_SHADOWING_INSTRUCT ||
    `Act as ${character.name} in a short English shadowing dialogue. Speak naturally, clearly, and emotionally, without adding extra words.`;

  const result = await writeGeneratedSpeech(outputPath, dialogue.text, {
    ...voiceOverride,
    instruct,
  });

  return { ...result, cached: false };
}

function buildConcatArgs(sequence, outputPath) {
  if (sequence.length === 0) throw new Error("No audio segments to concatenate.");

  const filters = [];
  const concatInputs = [];

  sequence.forEach((segment, index) => {
    filters.push(
      `[${index}:a]aresample=44100,aformat=sample_fmts=s16:channel_layouts=stereo[a${index}]`
    );
    concatInputs.push(`[a${index}]`);
  });

  filters.push(`${concatInputs.join("")}concat=n=${sequence.length}:v=0:a=1[outa]`);

  const outputExt = path.extname(outputPath).toLowerCase();
  const codecArgs =
    outputExt === ".mp3"
      ? ["-c:a", "libmp3lame", "-b:a", "192k"]
      : ["-c:a", "pcm_s16le"];

  return [
    "-y",
    ...sequence.flatMap((segment) => ["-i", segment.path]),
    "-filter_complex",
    filters.join(";"),
    "-map",
    "[outa]",
    "-ar",
    "44100",
    "-ac",
    "2",
    ...codecArgs,
    outputPath,
  ];
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const dialogueData = readJson(options.inputPath);
  const characterByName = validateDialogue(dialogueData, options.inputPath, options.beepPath);
  const voiceMap = parseVoiceMap();
  const sequence = [];
  const ffmpegPath = findFfmpegPath();

  await fsp.mkdir(path.join(options.workDir, "speech"), { recursive: true });

  for (let index = 0; index < dialogueData.dialogues.length; index += 1) {
    const dialogue = dialogueData.dialogues[index];
    const character = characterByName.get(dialogue.character);
    const pauseAfter = Number(dialogue.pauseAfter || 0);
    const speechPath = getSpeechPath(options.workDir, dialogue, index, character);
    const silencePath = pauseAfter > 0 ? getSilencePath(options.workDir, pauseAfter) : undefined;

    const mappedVoice = voiceMap[character.voice] || character.voice;
    console.log(
      `[${index + 1}/${dialogueData.dialogues.length}] ${character.name} (${mappedVoice}): ${dialogue.text}`
    );

    if (!options.dryRun) {
      await ensureSpeech(speechPath, dialogue, character, voiceMap, options.force);
      if (silencePath) {
        await ensureSilence(ffmpegPath, silencePath, pauseAfter, options.force);
      }
    }

    addDialogueSegments(
      sequence,
      speechPath,
      pauseAfter > 0 ? options.beepPath : undefined,
      silencePath,
      Boolean(dialogue.repeat)
    );
  }

  console.log(`Segments: ${sequence.length}`);
  if (options.dryRun) {
    sequence.forEach((segment, index) => {
      console.log(`${String(index + 1).padStart(3, "0")} ${segment.type}: ${segment.path}`);
    });
    return;
  }

  await fsp.mkdir(path.dirname(options.outputPath), { recursive: true });
  runFfmpeg(ffmpegPath, buildConcatArgs(sequence, options.outputPath));

  console.log(`Done: ${options.outputPath}`);
}

main().catch((error) => {
  const detail = error.response?.data ?? error.message;
  console.error("Error:", typeof detail === "object" ? JSON.stringify(detail, null, 2) : detail);
  process.exit(1);
});
