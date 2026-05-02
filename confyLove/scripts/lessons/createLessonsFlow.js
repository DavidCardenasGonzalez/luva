const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { createHash, randomUUID } = require("crypto");
const dotenv = require("dotenv");
const axios = require("axios");
const {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} = require("@aws-sdk/client-cloudformation");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { GetObjectCommand, PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");
const topics = require("./lessonTopics");
const { generateSpeechToBuffer } = require("./voiceboxClient");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DEFAULT_STACK_NAME = "LuvaStack";
const DEFAULT_REGION = "us-west-2";
const DEFAULT_OPENAI_CHAT_MODEL = "gpt-5.5";
const GENERATED_PATH = path.join(__dirname, "generatedLessons.json");
const DEFAULT_AUDIO_PREFIX = "lessons";
const DEFAULT_WHISPER_MODEL = "whisper-1";

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

async function writeJsonFile(filePath, value) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function getAwsRegion() {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || process.env.CDK_DEFAULT_REGION || DEFAULT_REGION;
}

function getAwsClientConfig() {
  const config = { region: getAwsRegion() };
  if (process.env.AWS_PROFILE) {
    config.credentials = fromIni({ profile: process.env.AWS_PROFILE });
  }
  return config;
}

async function resolveOutputsFromStack(cfClient) {
  const stackName = process.env.LUVA_STACK_NAME || DEFAULT_STACK_NAME;
  const response = await cfClient.send(new DescribeStacksCommand({ StackName: stackName }));
  const outputs = new Map(
    (response.Stacks?.[0]?.Outputs || [])
      .filter((output) => output.OutputKey && output.OutputValue)
      .map((output) => [output.OutputKey, output.OutputValue])
  );
  return { stackName, outputs };
}

async function resolveLessonsTableName(cfClient, stackName) {
  const fromEnv = process.env.LESSONS_TABLE_NAME || process.env.LUVA_LESSONS_TABLE;
  if (fromEnv?.trim()) return fromEnv.trim();

  const response = await cfClient.send(new DescribeStackResourcesCommand({ StackName: stackName }));
  const resource = (response.StackResources || []).find(
    (item) =>
      item.ResourceType === "AWS::DynamoDB::Table" &&
      String(item.LogicalResourceId || "").startsWith("LessonsTable")
  );

  if (!resource?.PhysicalResourceId) {
    throw new Error("No se pudo resolver LessonsTable. Define LESSONS_TABLE_NAME en .env.");
  }

  return resource.PhysicalResourceId;
}

async function resolveAwsResources(cfClient) {
  const stackNameFromEnv = process.env.LUVA_STACK_NAME || DEFAULT_STACK_NAME;
  const tableNameFromEnv = process.env.LESSONS_TABLE_NAME?.trim() || process.env.LUVA_LESSONS_TABLE?.trim();
  const bucketNameFromEnv = process.env.ASSETS_BUCKET_NAME?.trim() || process.env.LUVA_ASSETS_BUCKET?.trim();
  const cloudfrontUrlFromEnv =
    process.env.ASSETS_CLOUDFRONT_URL?.trim() || process.env.ASSETS_CLOUDFRONT_DOMAIN_NAME?.trim();

  if (tableNameFromEnv && bucketNameFromEnv && cloudfrontUrlFromEnv) {
    const cdnBase = cloudfrontUrlFromEnv.startsWith("http")
      ? cloudfrontUrlFromEnv.replace(/\/+$/, "")
      : `https://${cloudfrontUrlFromEnv.replace(/\/+$/, "")}`;
    return {
      stackName: stackNameFromEnv,
      tableName: tableNameFromEnv,
      bucketName: bucketNameFromEnv,
      cloudfrontUrl: cdnBase,
    };
  }

  const { stackName, outputs } = await resolveOutputsFromStack(cfClient);

  const tableName = tableNameFromEnv || (await resolveLessonsTableName(cfClient, stackName));
  const bucketName = bucketNameFromEnv || outputs.get("AssetsBucketName");
  const cloudfrontUrl = cloudfrontUrlFromEnv || outputs.get("AssetsUrl");

  if (!bucketName) throw new Error("No se pudo resolver AssetsBucketName. Define ASSETS_BUCKET_NAME.");
  if (!cloudfrontUrl) throw new Error("No se pudo resolver AssetsUrl. Define ASSETS_CLOUDFRONT_URL.");

  const cdnBase = cloudfrontUrl.startsWith("http")
    ? cloudfrontUrl.replace(/\/+$/, "")
    : `https://${cloudfrontUrl.replace(/\/+$/, "")}`;

  return { stackName, tableName, bucketName, cloudfrontUrl: cdnBase };
}

function getOpenAiKey() {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (!key?.trim()) throw new Error("OPENAI_API_KEY not set");
  return key.trim();
}

function getGoogleTranslateKey() {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key?.trim()) throw new Error("GOOGLE_TRANSLATE_API_KEY not set");
  return key.trim();
}

function extractOpenAiText(data) {
  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (item?.type !== "message" || !Array.isArray(item.content)) continue;
      for (const part of item.content) {
        if (part?.type === "output_text" && typeof part.text === "string" && part.text.trim()) {
          return part.text.trim();
        }
      }
    }
  }

  const chatText = data?.choices?.[0]?.message?.content;
  if (typeof chatText === "string" && chatText.trim()) return chatText.trim();
  throw new Error("OPENAI_EMPTY_RESPONSE");
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function callOpenAIChatCompletion(systemPrompt, userContent, maxTokens, options = {}) {
  const apiKey = getOpenAiKey();
  const model = options.model || process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL;
  const timeoutMs = parsePositiveInt(options.timeoutMs || process.env.LESSON_GEN_TIMEOUT_MS, 60000);
  const isGpt5 = /gpt-5/i.test(model);
  const useResponses = isGpt5 || /gpt-4\.5/i.test(model) || process.env.OPENAI_USE_RESPONSES === "1";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (useResponses) {
    const body = {
      model,
      instructions: systemPrompt,
      input: [{ role: "user", content: [{ type: "input_text", text: userContent }] }],
      max_output_tokens: maxTokens,
    };
    if (isGpt5) body.reasoning = { effort: process.env.OPENAI_REASONING_EFFORT || "low" };

    const response = await axios.post("https://api.openai.com/v1/responses", body, {
      headers,
      timeout: timeoutMs,
      validateStatus: () => true,
    });

    if (response.status >= 400) {
      throw new Error(`OPENAI_HTTP_${response.status}: ${response.data?.error?.message || ""}`);
    }

    return extractOpenAiText(response.data);
  }

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    },
    { headers, timeout: timeoutMs, validateStatus: () => true }
  );

  if (response.status >= 400) {
    throw new Error(`OPENAI_HTTP_${response.status}: ${response.data?.error?.message || ""}`);
  }

  return extractOpenAiText(response.data);
}

function stripCodeFence(text) {
  const trimmed = String(text || "").trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

function parseLessonContent(raw) {
  const clean = stripCodeFence(raw);
  const match = clean.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match?.[0] || clean);

  const title = String(parsed.title || "").trim().slice(0, 200);
  const script = String(parsed.script || "").trim().slice(0, 10000);

  if (!title) throw new Error("OpenAI lesson response did not include title.");
  if (!script) throw new Error("OpenAI lesson response did not include script.");

  return { title, script };
}

async function generateLessonContent(topic) {
  const systemPrompt = `You are an expert English teacher creating engaging video lesson scripts for Spanish-speaking learners at B1-C1 level.

Create a concise lesson title and a clear, natural video script based on the given topic.

Rules:
- The script must be in English.
- Use a warm introduction, clear main content with examples, and a brief conclusion.
- Use natural spoken language suitable for text-to-speech.
- Aim for 400-1000 words.
- Do not include stage directions, speaker names, markdown, or SSML.
- Start with a hook to grab attention, then explain the topic with examples, and end with a quick recap or call to action.
- Return only valid JSON with this exact shape: {"title":"...","script":"..."}`;

  const raw = await callOpenAIChatCompletion(systemPrompt, topic, 1600);
  return parseLessonContent(raw);
}

function toQuizQuestion(item) {
  if (!item || typeof item !== "object") return undefined;
  const question = String(item.question || "").trim();
  if (!question || !Array.isArray(item.options) || item.options.length !== 4) return undefined;

  const options = item.options.map((option) => String(option || "").trim()).filter(Boolean);
  if (options.length !== 4) return undefined;

  const correctIndex =
    typeof item.correctIndex === "number"
      ? item.correctIndex
      : Number.parseInt(String(item.correctIndex), 10);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) return undefined;

  return { question, options, correctIndex };
}

async function generateLessonQuiz(script) {
  const systemPrompt = `You are an English teacher creating comprehension quizzes for Spanish-speaking learners.

Based on the provided lesson script, create exactly 5 multiple-choice questions that test understanding of the content.

Rules:
- Each question must have exactly 4 answer options.
- Only one option is correct.
- Questions should test real comprehension, not trivial details.
- Keep language at B1-C1 English level.
- Questions and options must be in English.

Return ONLY a valid JSON array with exactly 5 objects. Each object must have:
- "question": string
- "options": array of exactly 4 strings
- "correctIndex": number 0-3`;

  const raw = await callOpenAIChatCompletion(systemPrompt, script, 1200);
  const match = raw.match(/\[[\s\S]*\]/);
  const parsed = JSON.parse(match?.[0] || stripCodeFence(raw));
  const rawQuiz = Array.isArray(parsed) ? parsed : parsed.quiz || parsed.questions || [];
  const quiz = rawQuiz.map(toQuizQuestion).filter(Boolean);

  if (quiz.length < 3) {
    throw new Error(`QUIZ_TOO_SHORT: ${quiz.length}`);
  }

  return quiz;
}

function formatSrtTime(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = Math.floor(safeSeconds % 60);
  const milliseconds = Math.round((safeSeconds - Math.floor(safeSeconds)) * 1000);

  return (
    [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":") +
    `,${String(milliseconds).padStart(3, "0")}`
  );
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

async function transcribeAudioToSrt(audioBuffer, filename, contentType) {
  const apiKey = getOpenAiKey();
  const form = new FormData();
  const file = new Blob([audioBuffer], { type: contentType || "audio/wav" });
  form.append("file", file, filename);
  form.append("model", process.env.WHISPER_MODEL || DEFAULT_WHISPER_MODEL);
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`OPENAI_TRANSCRIBE_HTTP_${response.status}: ${raw.slice(0, 500)}`);
  }

  const parsed = JSON.parse(raw);
  const srt = buildSrtFromSegments(parsed.segments || []);
  if (!srt.trim()) throw new Error("OPENAI_TRANSCRIBE_EMPTY_SEGMENTS");

  return { srt, transcript: parsed };
}

function parseSrtBlocks(srt) {
  return String(srt || "")
    .replace(/\r\n/g, "\n")
    .split(/\n\n+/)
    .map((block, blockIndex) => {
      const lines = block.trim().split("\n");
      if (lines.length < 3) return undefined;
      return {
        index: blockIndex,
        number: lines[0],
        timing: lines[1],
        text: lines.slice(2).join(" ").trim(),
      };
    })
    .filter((block) => block && block.text);
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function rebuildSrtWithTranslations(srt, translations) {
  const translationsByIndex = new Map(translations.map((translation, index) => [index, translation]));

  return String(srt || "")
    .replace(/\r\n/g, "\n")
    .split(/\n\n+/)
    .filter((block) => block.trim())
    .map((block, blockIndex) => {
      const lines = block.trim().split("\n");
      const header = lines.slice(0, 2).join("\n");
      return `${header}\n${translationsByIndex.get(blockIndex) || lines.slice(2).join("\n")}`;
    })
    .join("\n\n");
}

async function translateSrtToSpanish(srt) {
  const blocks = parseSrtBlocks(srt);
  const apiKey = getGoogleTranslateKey();
  const timeoutMs = parsePositiveInt(process.env.GOOGLE_TRANSLATE_TIMEOUT_MS, 60000);

  const response = await axios.post(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      q: blocks.map((block) => block.text),
      source: "en",
      target: "es",
      format: "text",
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: timeoutMs,
      validateStatus: () => true,
    }
  );

  if (response.status >= 400) {
    throw new Error(`GOOGLE_TRANSLATE_HTTP_${response.status}: ${JSON.stringify(response.data).slice(0, 500)}`);
  }

  const translations = (response.data?.data?.translations || []).map((item) =>
    decodeHtmlEntities(item?.translatedText || "")
  );
  if (translations.length < blocks.length) throw new Error(`TRANSLATION_TOO_SHORT: ${translations.length}/${blocks.length}`);
  return rebuildSrtWithTranslations(srt, translations);
}

function topicKey(topic) {
  return createHash("sha256").update(String(topic)).digest("hex").slice(0, 16);
}

function normalizeTopics(input) {
  if (!Array.isArray(input)) {
    throw new Error("lessonTopics.js debe exportar un array de strings.");
  }

  return input
    .map((topic) => String(topic || "").trim())
    .filter(Boolean);
}

async function createLessonRecord(dynamo, tableName, topic, title, script) {
  const now = new Date().toISOString();
  const lessonId = randomUUID();
  const item = {
    lessonId,
    title,
    prompt: topic.slice(0, 4000),
    script,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: "attribute_not_exists(lessonId)",
    })
  );

  return item;
}

function buildAssetUrl(cdnBase, key) {
  return `${cdnBase.replace(/\/+$/, "")}/${key}`;
}

function normalizeAudioContentType(contentType, extension) {
  const normalized = String(contentType || "").toLowerCase();
  if (normalized.startsWith("audio/")) return contentType;
  if (extension === "mp3") return "audio/mpeg";
  if (extension === "m4a") return "audio/mp4";
  if (extension === "ogg") return "audio/ogg";
  if (extension === "flac") return "audio/flac";
  return "audio/wav";
}

async function uploadLessonAudio(s3Client, bucketName, lessonId, audioResult) {
  const prefix = (process.env.LESSON_ASSETS_PREFIX || DEFAULT_AUDIO_PREFIX).replace(/^\/+|\/+$/g, "");
  const extension = audioResult.extension || "wav";
  const audioKey = `${prefix}/${lessonId}/audio.${extension}`;
  const contentType = normalizeAudioContentType(audioResult.contentType, extension);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: audioKey,
      Body: audioResult.buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return { audioKey, contentType };
}

async function uploadTextAsset(s3Client, bucketName, key, text) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: Buffer.from(text, "utf8"),
      ContentType: "text/plain; charset=utf-8",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

async function streamToBuffer(body) {
  const chunks = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function getS3Text(s3Client, bucketName, key) {
  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
  return (await streamToBuffer(response.Body)).toString("utf8");
}

async function updateLessonAudioMetadata(dynamo, tableName, lessonId, audioKey, audioResult) {
  const now = new Date().toISOString();
  const voiceId = audioResult.profile?.name || audioResult.profile?.id || "Elearning";
  const values = {
    ":audioKey": audioKey,
    ":voiceId": voiceId,
    ":now": now,
    ":ttsProvider": "voicebox",
    ":voiceboxProfileId": audioResult.profile?.id,
    ":voiceboxGenerationId": audioResult.generation?.id,
    ":voiceboxEngine": audioResult.generation?.engine || audioResult.config.engine,
    ":voiceboxModelSize": audioResult.generation?.model_size || audioResult.config.modelSize,
  };

  const sets = [
    "audioKey = :audioKey",
    "voiceId = :voiceId",
    "updatedAt = :now",
    "ttsProvider = :ttsProvider",
  ];

  for (const [name, token] of [
    ["voiceboxProfileId", ":voiceboxProfileId"],
    ["voiceboxGenerationId", ":voiceboxGenerationId"],
    ["voiceboxEngine", ":voiceboxEngine"],
    ["voiceboxModelSize", ":voiceboxModelSize"],
  ]) {
    if (values[token] !== undefined && values[token] !== null && values[token] !== "") {
      sets.push(`${name} = ${token}`);
    } else {
      delete values[token];
    }
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { lessonId },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeValues: values,
    })
  );

  return { updatedAt: now, voiceId };
}

async function updateLessonGeneratedAssets(dynamo, tableName, lessonId, payload) {
  const now = new Date().toISOString();
  const values = { ":now": now };
  const sets = ["updatedAt = :now"];

  for (const [field, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === "") continue;
    const token = `:${field}`;
    sets.push(`${field} = ${token}`);
    values[token] = value;
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { lessonId },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeValues: values,
    })
  );

  return { updatedAt: now };
}

function isLessonFlowComplete(record) {
  return Boolean(
    record?.audioKey &&
      record?.subtitlesKey &&
      record?.translatedSubtitlesKey &&
      Array.isArray(record?.quiz) &&
      record.quiz.length >= 3
  );
}

function shouldSkipAudio() {
  return ["1", "true", "yes"].includes(String(process.env.LESSONS_SKIP_AUDIO || "").toLowerCase());
}

function isVoiceboxPendingError(error) {
  return error?.code === "VOICEBOX_GENERATION_PENDING" || error?.name === "VoiceboxGenerationPendingError";
}

function getVoiceboxStatusLogIntervalMs() {
  const parsed = Number.parseInt(process.env.VOICEBOX_STATUS_LOG_INTERVAL_MS || "15000", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15000;
}

async function main() {
  const lessonTopics = normalizeTopics(topics);
  if (lessonTopics.length === 0) {
    throw new Error(`No hay temas. Agrega strings en ${path.join(__dirname, "lessonTopics.js")}.`);
  }

  const limit = Number.parseInt(process.env.LESSONS_LIMIT || "", 10);
  const selectedTopics = Number.isFinite(limit) && limit > 0 ? lessonTopics.slice(0, limit) : lessonTopics;
  const force = ["1", "true", "yes"].includes(String(process.env.LESSONS_FORCE_REGENERATE || "").toLowerCase());
  const generated = readJsonFile(GENERATED_PATH, {});
  const awsConfig = getAwsClientConfig();
  const cfClient = new CloudFormationClient(awsConfig);
  const s3Client = new S3Client(awsConfig);
  const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient(awsConfig), {
    marshallOptions: { removeUndefinedValues: true },
  });
  const resources = await resolveAwsResources(cfClient);

  console.log(`Stack:   ${resources.stackName}`);
  console.log(`Tabla:   ${resources.tableName}`);
  console.log(`Bucket:  ${resources.bucketName}`);
  console.log(`CDN:     ${resources.cloudfrontUrl}`);
  console.log(`OpenAI:  ${process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL}`);
  console.log(`Topics:  ${selectedTopics.length}`);
  console.log(`Voicebox audio: ${shouldSkipAudio() ? "skip" : "on"}\n`);

  let ok = 0;
  let skipped = 0;
  let errors = 0;

  for (const topic of selectedTopics) {
    const key = topicKey(topic);
    const current = generated[key];

    if (!force && isLessonFlowComplete(current)) {
      skipped += 1;
      console.log(`[SKIP] ${current.title || topic} (${current.lessonId})`);
      continue;
    }

    console.log(`[LESSON] ${topic}`);

    try {
      let lesson = current?.lessonId && !force ? current.lesson : undefined;

      if (!lesson) {
        process.stdout.write("  OpenAI script... ");
        const content = await generateLessonContent(topic);
        console.log(`ok (${content.script.length} chars)`);

        process.stdout.write("  Dynamo put... ");
        lesson = await createLessonRecord(
          dynamo,
          resources.tableName,
          topic,
          content.title,
          content.script
        );
        console.log(`ok (${lesson.lessonId})`);

        generated[key] = {
          topic,
          lesson,
          lessonId: lesson.lessonId,
          title: lesson.title,
          scriptLength: lesson.script.length,
          createdAt: lesson.createdAt,
        };
        await writeJsonFile(GENERATED_PATH, generated);
      } else {
        console.log(`  Reusing lesson ${lesson.lessonId}`);
      }

      if (shouldSkipAudio()) {
        ok += 1;
        console.log();
        continue;
      }

      console.log("  Voicebox audio...");
      let lastVoiceboxStatus = "";
      let lastVoiceboxLogAt = 0;
      const statusLogIntervalMs = getVoiceboxStatusLogIntervalMs();

      const audioResult = await generateSpeechToBuffer(lesson.script, {
        generationId: generated[key]?.voiceboxGenerationId,
        onGeneration: (generation) => {
          const generationId = generation?.id;
          if (!generationId) return;
          console.log(`    generationId: ${generationId} (${generation.status || "unknown"})`);
          generated[key] = {
            ...generated[key],
            topic,
            lessonId: lesson.lessonId,
            title: lesson.title,
            voiceboxGenerationId: generationId,
            voiceboxEngine: generation.engine,
            voiceboxModelSize: generation.model_size,
            voiceboxStatus: generation.status,
            voiceboxStartedAt: generated[key]?.voiceboxStartedAt || generation.created_at || new Date().toISOString(),
          };
          writeJsonFile(GENERATED_PATH, generated).catch(() => undefined);
        },
        onStatus: (generation) => {
          const status = generation?.status || "unknown";
          const nowMs = Date.now();
          if (status === lastVoiceboxStatus && nowMs - lastVoiceboxLogAt < statusLogIntervalMs) return;

          lastVoiceboxStatus = status;
          lastVoiceboxLogAt = nowMs;
          const duration = Number.isFinite(generation?.duration) ? `, duration=${generation.duration}s` : "";
          console.log(`    status: ${status}${duration}`);

          if (generation?.id) {
            generated[key] = {
              ...generated[key],
              voiceboxGenerationId: generation.id,
              voiceboxStatus: status,
              voiceboxLastCheckedAt: new Date().toISOString(),
            };
            writeJsonFile(GENERATED_PATH, generated).catch(() => undefined);
          }
        },
      });
      console.log(`    audio ok (${audioResult.buffer.length} bytes, ${audioResult.generation?.id || "no-id"})`);

      let uploaded = generated[key]?.audioKey
        ? { audioKey: generated[key].audioKey, contentType: generated[key].contentType || audioResult.contentType }
        : undefined;

      if (uploaded?.audioKey) {
        console.log(`  S3 upload... skip (${uploaded.audioKey})`);
      } else {
        process.stdout.write("  S3 upload... ");
        uploaded = await uploadLessonAudio(s3Client, resources.bucketName, lesson.lessonId, audioResult);
        console.log(`ok (${uploaded.audioKey})`);
      }

      process.stdout.write("  Dynamo update... ");
      const metadata = await updateLessonAudioMetadata(
        dynamo,
        resources.tableName,
        lesson.lessonId,
        uploaded.audioKey,
        audioResult
      );
      console.log("ok");

      generated[key] = {
        ...generated[key],
        topic,
        lessonId: lesson.lessonId,
        title: lesson.title,
        audioKey: uploaded.audioKey,
        audioUrl: buildAssetUrl(resources.cloudfrontUrl, uploaded.audioKey),
        contentType: uploaded.contentType,
        voiceId: metadata.voiceId,
        voiceboxProfileId: audioResult.profile?.id,
        voiceboxGenerationId: audioResult.generation?.id,
        voiceboxEngine: audioResult.generation?.engine || audioResult.config.engine,
        voiceboxModelSize: audioResult.generation?.model_size || audioResult.config.modelSize,
        updatedAt: metadata.updatedAt,
      };
      await writeJsonFile(GENERATED_PATH, generated);

      const srtPrefix = (process.env.LESSON_ASSETS_PREFIX || DEFAULT_AUDIO_PREFIX).replace(/^\/+|\/+$/g, "");
      const subtitlesKey = `${srtPrefix}/${lesson.lessonId}/subtitles_en.srt`;
      const translatedSubtitlesKey = `${srtPrefix}/${lesson.lessonId}/subtitles_es.srt`;
      let englishSrtForTranslation = null;

      if (!generated[key]?.subtitlesKey) {
        process.stdout.write("  Whisper subtitles... ");
        const filename = `audio.${audioResult.extension || "wav"}`;
        const transcription = await transcribeAudioToSrt(
          audioResult.buffer,
          filename,
          uploaded.contentType || audioResult.contentType
        );
        englishSrtForTranslation = transcription.srt;
        console.log(`ok (${parseSrtBlocks(transcription.srt).length} blocks)`);

        process.stdout.write("  S3 subtitles EN... ");
        await uploadTextAsset(s3Client, resources.bucketName, subtitlesKey, transcription.srt);
        console.log(`ok (${subtitlesKey})`);

        await updateLessonGeneratedAssets(dynamo, resources.tableName, lesson.lessonId, {
          subtitlesKey,
        });

        generated[key] = {
          ...generated[key],
          subtitlesKey,
          subtitlesUrl: buildAssetUrl(resources.cloudfrontUrl, subtitlesKey),
          transcriptText: transcription.transcript?.text,
          transcriptDuration: transcription.transcript?.duration,
        };
        await writeJsonFile(GENERATED_PATH, generated);
      } else {
        console.log(`  Whisper subtitles... skip (${generated[key].subtitlesKey})`);
      }

      if (!generated[key]?.translatedSubtitlesKey) {
        process.stdout.write("  Translate subtitles ES... ");
        const srtToTranslate =
          englishSrtForTranslation ||
          (generated[key]?.subtitlesKey
            ? await getS3Text(s3Client, resources.bucketName, generated[key].subtitlesKey)
            : (
                await transcribeAudioToSrt(
                  audioResult.buffer,
                  `audio.${audioResult.extension || "wav"}`,
                  uploaded.contentType || audioResult.contentType
                )
              ).srt);
        const translatedSrt = await translateSrtToSpanish(srtToTranslate);
        console.log(`ok (${parseSrtBlocks(translatedSrt).length} blocks)`);

        process.stdout.write("  S3 subtitles ES... ");
        await uploadTextAsset(s3Client, resources.bucketName, translatedSubtitlesKey, translatedSrt);
        console.log(`ok (${translatedSubtitlesKey})`);

        await updateLessonGeneratedAssets(dynamo, resources.tableName, lesson.lessonId, {
          translatedSubtitlesKey,
        });

        generated[key] = {
          ...generated[key],
          translatedSubtitlesKey,
          translatedSubtitlesUrl: buildAssetUrl(resources.cloudfrontUrl, translatedSubtitlesKey),
        };
        delete generated[key].error;
        delete generated[key].failedAt;
        await writeJsonFile(GENERATED_PATH, generated);
      } else {
        console.log(`  Translate subtitles ES... skip (${generated[key].translatedSubtitlesKey})`);
      }

      if (!Array.isArray(generated[key]?.quiz) || generated[key].quiz.length < 3) {
        process.stdout.write("  OpenAI quiz... ");
        const quiz = await generateLessonQuiz(lesson.script);
        console.log(`ok (${quiz.length} questions)`);

        const quizUpdate = await updateLessonGeneratedAssets(dynamo, resources.tableName, lesson.lessonId, { quiz });
        generated[key] = {
          ...generated[key],
          quiz,
          updatedAt: quizUpdate.updatedAt,
        };
        await writeJsonFile(GENERATED_PATH, generated);
      } else {
        console.log(`  OpenAI quiz... skip (${generated[key].quiz.length} questions)`);
      }

      ok += 1;
      console.log();
    } catch (error) {
      if (isVoiceboxPendingError(error)) {
        generated[key] = {
          ...generated[key],
          topic,
          lessonId: generated[key]?.lessonId,
          title: generated[key]?.title,
          voiceboxGenerationId: error.generationId || generated[key]?.voiceboxGenerationId,
          voiceboxStatus: "generating",
          voiceboxPending: true,
          voiceboxLastCheckedAt: new Date().toISOString(),
        };
        delete generated[key].error;
        delete generated[key].failedAt;
        await writeJsonFile(GENERATED_PATH, generated);
        console.log(`PENDING: Voicebox sigue generando (${generated[key].voiceboxGenerationId}). Ejecuta el flow otra vez para retomar.\n`);
        skipped += 1;
        continue;
      }

      errors += 1;
      generated[key] = {
        ...generated[key],
        topic,
        error: error.message,
        failedAt: new Date().toISOString(),
      };
      await writeJsonFile(GENERATED_PATH, generated);
      console.log(`ERROR: ${error.message}\n`);
    }
  }

  console.log(`Listo. OK: ${ok} | Saltadas: ${skipped} | Errores: ${errors}`);
  console.log(`Registro: ${GENERATED_PATH}`);
}

main().catch((error) => {
  const detail = error.response?.data ?? error.message;
  console.error("Error:", typeof detail === "object" ? JSON.stringify(detail, null, 2) : detail);
  process.exit(1);
});
