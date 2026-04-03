const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const util = require("util");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const storyData = require("../story.json");
const { getStories, getStoryId } = require("./storyUtils");
const { findFfmpegPath, runFfmpeg } = require("./ffmpegUtils");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const COMFYUI_OUTPUT_DIR = "C:\\ComfyUI\\output";
const COMFYUI_VIDEO_DIR = path.join(COMFYUI_OUTPUT_DIR, "video");
const MANIFEST_DIR = path.join(__dirname, "..", "manifests");
const TRANSCRIPTION_MODEL = "whisper-1";
const TRANSLATION_MODEL = "gpt-5-mini";
const TRANSLATION_CHUNK_SIZE = 40;
const SUBTITLE_CANVAS_WIDTH = 768;
const SUBTITLE_CANVAS_HEIGHT = 1376;
const EN_SUBTITLE_FONT_SIZE = 60;
const ES_SUBTITLE_FONT_SIZE = 35;
const EN_SUBTITLE_MARGIN_BOTTOM = 360;
const ES_SUBTITLE_MARGIN_BOTTOM = 260;
const EN_SUBTITLE_MAX_CHARS = 28;
const ES_SUBTITLE_MAX_CHARS = 36;
const MIN_TRIM_START_SECONDS = 0.08;

function ensureApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'Falta OPENAI_API_KEY. Ponla en variables de entorno o en scripts/.env'
    );
  }
}

function getManifestPath(storyId) {
  return path.join(MANIFEST_DIR, `${storyId}.video-manifest.json`);
}

async function loadManifest(storyId) {
  const manifestPath = getManifestPath(storyId);

  try {
    const content = await fsp.readFile(manifestPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        `No encontre el manifest ${manifestPath}. Ejecuta primero 2_image2video.js`
      );
    }

    throw error;
  }
}

async function getInputVideoPath(storyId) {
  const backgroundVideoPath = path.join(
    COMFYUI_VIDEO_DIR,
    `${storyId}_chapters_background.mp4`
  );

  try {
    await fsp.access(backgroundVideoPath);
    return backgroundVideoPath;
  } catch {
    throw new Error(
      `No encontre ${backgroundVideoPath}. Ejecuta primero 4_addBackground.js`
    );
  }
}

function formatSrtTime(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = Math.floor(safeSeconds % 60);
  const milliseconds = Math.round((safeSeconds - Math.floor(safeSeconds)) * 1000);

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":") + `,${String(milliseconds).padStart(3, "0")}`;
}

function buildSrtFromSegments(segments) {
  return segments
    .filter((segment) => {
      return (
        segment &&
        typeof segment.text === "string" &&
        segment.text.trim() &&
        Number.isFinite(segment.start) &&
        Number.isFinite(segment.end)
      );
    })
    .map((segment, index) => {
      return [
        String(index + 1),
        `${formatSrtTime(segment.start)} --> ${formatSrtTime(segment.end)}`,
        segment.text.trim(),
        "",
      ].join("\n");
    })
    .join("\n");
}

function formatAssTime(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = Math.floor(safeSeconds % 60);
  const centiseconds = Math.round(
    (safeSeconds - Math.floor(safeSeconds)) * 100
  );

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}.${String(centiseconds).padStart(2, "0")}`;
}

async function translateSegments(client, segments) {
  const translatedSegments = [];

  for (let index = 0; index < segments.length; index += TRANSLATION_CHUNK_SIZE) {
    const chunk = segments.slice(index, index + TRANSLATION_CHUNK_SIZE);
    const payload = chunk.map((segment, chunkIndex) => ({
      index: index + chunkIndex,
      text: segment.text.trim(),
    }));

    const response = await client.responses.create({
      model: TRANSLATION_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Translate subtitle lines from English to neutral Latin American Spanish. Return only valid JSON as an array of objects with keys index and translation. Keep the same order, preserve tone, keep each line concise for subtitles, and do not omit any item.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(payload),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "subtitle_translations",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              translations: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    index: { type: "integer" },
                    translation: { type: "string" },
                  },
                  required: ["index", "translation"],
                },
              },
            },
            required: ["translations"],
          },
        },
      },
    });

    const parsed = JSON.parse(response.output_text);
    const translations = Array.isArray(parsed.translations)
      ? parsed.translations
      : [];

    if (translations.length !== chunk.length) {
      throw new Error(
        `La traduccion devolvio ${translations.length} items y esperaba ${chunk.length}`
      );
    }

    for (const item of translations) {
      translatedSegments.push(item);
    }
  }

  translatedSegments.sort((a, b) => a.index - b.index);
  return translatedSegments;
}

function buildBilingualSrtFromSegments(segments, translations) {
  const translationsByIndex = new Map(
    translations.map((item) => [item.index, item.translation.trim()])
  );

  return segments
    .filter((segment, index) => {
      return (
        segment &&
        typeof segment.text === "string" &&
        segment.text.trim() &&
        Number.isFinite(segment.start) &&
        Number.isFinite(segment.end) &&
        translationsByIndex.has(index)
      );
    })
    .map((segment, index) => {
      return [
        String(index + 1),
        `${formatSrtTime(segment.start)} --> ${formatSrtTime(segment.end)}`,
        segment.text.trim(),
        translationsByIndex.get(index),
        "",
      ].join("\n");
    })
    .join("\n");
}

function escapeAssText(text) {
  return String(text || "")
    .replaceAll("\\", "\\\\")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}")
    .replaceAll("\r\n", "\\N")
    .replaceAll("\n", "\\N");
}

function wrapSubtitleText(text, maxCharsPerLine) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= maxCharsPerLine || !currentLine) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join("\n");
}

function buildBilingualAssFromSegments(segments, translations) {
  const translationsByIndex = new Map(
    translations.map((item) => [item.index, item.translation.trim()])
  );

  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    `PlayResX: ${SUBTITLE_CANVAS_WIDTH}`,
    `PlayResY: ${SUBTITLE_CANVAS_HEIGHT}`,
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: English,Arial,${EN_SUBTITLE_FONT_SIZE},&H00FFFFFF,&H000000FF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,2,1,2,32,32,${EN_SUBTITLE_MARGIN_BOTTOM},1`,
    `Style: Spanish,Arial,${ES_SUBTITLE_FONT_SIZE},&H00D8D8D8,&H000000FF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,2,1,2,36,36,${ES_SUBTITLE_MARGIN_BOTTOM},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];

  const events = [];

  segments.forEach((segment, index) => {
    const translation = translationsByIndex.get(index);

    if (
      !segment ||
      typeof segment.text !== "string" ||
      !segment.text.trim() ||
      !Number.isFinite(segment.start) ||
      !Number.isFinite(segment.end) ||
      !translation
    ) {
      return;
    }

    const start = formatAssTime(segment.start);
    const end = formatAssTime(segment.end);
    const englishText = escapeAssText(
      wrapSubtitleText(segment.text.trim(), EN_SUBTITLE_MAX_CHARS)
    );
    const spanishText = escapeAssText(
      wrapSubtitleText(translation, ES_SUBTITLE_MAX_CHARS)
    );

    events.push(`Dialogue: 0,${start},${end},English,,0,0,0,,${englishText}`);
    events.push(`Dialogue: 1,${start},${end},Spanish,,0,0,0,,${spanishText}`);
  });

  return `${header.join("\n")}\n${events.join("\n")}\n`;
}

async function extractAudio(ffmpegPath, inputVideoPath, audioPath) {
  runFfmpeg(ffmpegPath, [
    "-y",
    "-i",
    inputVideoPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-b:a",
    "64k",
    audioPath,
  ]);
}

async function transcribeAudio(client, audioPath) {
  const response = await client.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: TRANSCRIPTION_MODEL,
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  if (!Array.isArray(response.segments) || response.segments.length === 0) {
    throw new Error("La transcripcion no devolvio segmentos");
  }

  return response;
}

function getTrimStartSeconds(segments) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return 0;
  }

  const firstSegment = segments.find((segment) => {
    return (
      segment &&
      typeof segment.text === "string" &&
      segment.text.trim() &&
      Number.isFinite(segment.start)
    );
  });

  if (!firstSegment) {
    return 0;
  }

  return firstSegment.start >= MIN_TRIM_START_SECONDS ? firstSegment.start : 0;
}

function shiftSegments(segments, offsetSeconds) {
  return segments.map((segment) => ({
    ...segment,
    start: Math.max(0, (Number(segment.start) || 0) - offsetSeconds),
    end: Math.max(0, (Number(segment.end) || 0) - offsetSeconds),
  }));
}

async function trimVideoStart(ffmpegPath, inputVideoPath, outputPath, trimStartSeconds) {
  if (trimStartSeconds <= 0) {
    return inputVideoPath;
  }

  runFfmpeg(ffmpegPath, [
    "-y",
    "-ss",
    String(trimStartSeconds),
    "-i",
    inputVideoPath,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    outputPath,
  ]);

  return outputPath;
}

function escapeSubtitlePathForFilter(subtitlePath) {
  return subtitlePath
    .replaceAll("\\", "/")
    .replaceAll(":", "\\:")
    .replaceAll(",", "\\,")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]");
}

async function burnSubtitles(ffmpegPath, inputVideoPath, subtitlePath, outputPath) {
  const filterPath = escapeSubtitlePathForFilter(subtitlePath);
  const filter = `subtitles='${filterPath}'`;

  runFfmpeg(ffmpegPath, [
    "-y",
    "-i",
    inputVideoPath,
    "-vf",
    filter,
    "-c:a",
    "copy",
    outputPath,
  ]);
}

async function processStory(client, ffmpegPath, story) {
  const storyId = getStoryId(story.id);
  const manifest = await loadManifest(storyId);
  const inputVideoPath = await getInputVideoPath(storyId);

  await fsp.mkdir(MANIFEST_DIR, { recursive: true });

  const audioPath = path.join(MANIFEST_DIR, `${storyId}.subtitles-source.mp3`);
  const transcriptJsonPath = path.join(MANIFEST_DIR, `${storyId}.transcript.json`);
  const translationsJsonPath = path.join(
    MANIFEST_DIR,
    `${storyId}.subtitle-translations.json`
  );
  const srtPath = path.join(MANIFEST_DIR, `${storyId}.subtitles.srt`);
  const assPath = path.join(MANIFEST_DIR, `${storyId}.subtitles.ass`);
  const trimmedVideoPath = path.join(
    MANIFEST_DIR,
    `${storyId}.trimmed-before-subtitles.mp4`
  );
  const outputPath = path.join(COMFYUI_VIDEO_DIR, `${storyId}_chapters_subtitled.mp4`);

  await extractAudio(ffmpegPath, inputVideoPath, audioPath);
  const transcript = await transcribeAudio(client, audioPath);
  const trimStartSeconds = getTrimStartSeconds(transcript.segments);
  const shiftedSegments = shiftSegments(transcript.segments, trimStartSeconds);
  const translations = await translateSegments(client, transcript.segments);
  const srt = buildBilingualSrtFromSegments(shiftedSegments, translations);
  const ass = buildBilingualAssFromSegments(shiftedSegments, translations);
  const subtitleInputVideoPath = await trimVideoStart(
    ffmpegPath,
    inputVideoPath,
    trimmedVideoPath,
    trimStartSeconds
  );

  if (!srt.trim() || !ass.trim()) {
    throw new Error("No pude construir el archivo SRT");
  }

  await fsp.writeFile(transcriptJsonPath, JSON.stringify(transcript, null, 2), "utf8");
  await fsp.writeFile(
    translationsJsonPath,
    JSON.stringify(translations, null, 2),
    "utf8"
  );
  await fsp.writeFile(srtPath, srt, "utf8");
  await fsp.writeFile(assPath, ass, "utf8");
  await burnSubtitles(ffmpegPath, subtitleInputVideoPath, assPath, outputPath);

  manifest.subtitles = {
    model: TRANSCRIPTION_MODEL,
    translationModel: TRANSLATION_MODEL,
    generatedAt: new Date().toISOString(),
    inputVideoPath,
    audioPath,
    transcriptJsonPath,
    translationsJsonPath,
    srtPath,
    assPath,
    trimmedVideoPath: trimStartSeconds > 0 ? trimmedVideoPath : null,
    outputPath,
    segmentCount: transcript.segments.length,
    language: transcript.language || null,
    trimStartSeconds,
    englishMarginBottom: EN_SUBTITLE_MARGIN_BOTTOM,
    spanishMarginBottom: ES_SUBTITLE_MARGIN_BOTTOM,
    englishFontSize: EN_SUBTITLE_FONT_SIZE,
    spanishFontSize: ES_SUBTITLE_FONT_SIZE,
    englishMaxChars: EN_SUBTITLE_MAX_CHARS,
    spanishMaxChars: ES_SUBTITLE_MAX_CHARS,
    bilingual: true,
  };

  await fsp.writeFile(getManifestPath(storyId), JSON.stringify(manifest, null, 2), "utf8");

  console.log("Subtitulos generados");
  console.log(`Story ID: ${storyId}`);
  console.log(`Input video: ${inputVideoPath}`);
  console.log(`Audio temp: ${audioPath}`);
  console.log(`Transcript JSON: ${transcriptJsonPath}`);
  console.log(`Translations JSON: ${translationsJsonPath}`);
  console.log(`SRT: ${srtPath}`);
  console.log(`ASS: ${assPath}`);
  console.log(`Trim start: ${trimStartSeconds}s`);
  console.log(`Output: ${outputPath}`);
  console.log(`Language: ${transcript.language || "unknown"}`);
  console.log(`Segments: ${transcript.segments.length}`);
}

async function main() {
  ensureApiKey();

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const ffmpegPath = findFfmpegPath();
  const stories = getStories(storyData);

  for (const story of stories) {
    await processStory(client, ffmpegPath, story);
  }
}

main().catch((error) => {
  console.error(
    "Error al generar subtitulos:",
    typeof error === "object"
      ? util.inspect(
          {
            message: error.message,
            stack: error.stack,
          },
          { depth: null, colors: true, compact: false }
        )
      : error
  );
  process.exit(1);
});
