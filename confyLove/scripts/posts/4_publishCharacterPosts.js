const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const dotenv = require("dotenv");
const axios = require("axios");
const {
  CloudFormationClient,
  DescribeStacksCommand,
} = require("@aws-sdk/client-cloudformation");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// ── Rutas ────────────────────────────────────────────────────────────────────
const SUBMITTED_PATH = path.join(__dirname, "submitted.json");
const PUBLISHED_PATH = path.join(__dirname, "published.json");
const STORIES_SEED_PATH = path.resolve(
  __dirname, "..", "..", "..", "backend", "src", "data", "stories-seed.ts"
);

// ── Config ───────────────────────────────────────────────────────────────────
const COMFYUI_OUTPUT_DIR = process.env.COMFYUI_OUTPUT_DIR || "C:/ComfyUI/output";
const LMSTUDIO_BASE_URL = process.env.LMSTUDIO_BASE_URL || "http://127.0.0.1:1234";
const LMSTUDIO_MODEL = process.env.LMSTUDIO_MODEL || "local-model";
const LMSTUDIO_MAX_TOKENS = Number.parseInt(process.env.LMSTUDIO_MAX_TOKENS || "400", 10);
const DEFAULT_STACK_NAME = process.env.LUVA_STACK_NAME || "LuvaStack";
const DEFAULT_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const S3_PREFIX = "characterPosts";

// ── AWS helpers ───────────────────────────────────────────────────────────────

function getAwsConfig() {
  const config = { region: DEFAULT_REGION };
  if (process.env.AWS_PROFILE) {
    config.credentials = fromIni({ profile: process.env.AWS_PROFILE });
  }
  return config;
}

async function resolveAwsResources(cfClient) {
  const bucketName = process.env.LUVA_ASSETS_BUCKET?.trim();
  const tableName = process.env.CHARACTER_POSTS_TABLE_NAME?.trim();
  const cloudfrontUrl = process.env.ASSETS_CLOUDFRONT_URL?.trim();

  if (bucketName && tableName && cloudfrontUrl) {
    return { bucketName, tableName, cloudfrontUrl };
  }

  console.log(`Resolviendo recursos desde CloudFormation stack: ${DEFAULT_STACK_NAME}...`);
  const { Stacks } = await cfClient.send(
    new DescribeStacksCommand({ StackName: DEFAULT_STACK_NAME })
  );
  const outputs = new Map(
    (Stacks?.[0]?.Outputs || [])
      .filter((o) => o.OutputKey && o.OutputValue)
      .map((o) => [o.OutputKey, o.OutputValue])
  );

  const resolved = {
    bucketName: bucketName || outputs.get("AssetsBucketName"),
    tableName: tableName || outputs.get("CharacterPostsTableName"),
    cloudfrontUrl: cloudfrontUrl || outputs.get("AssetsUrl"),
  };

  if (!resolved.bucketName) throw new Error("No se pudo resolver AssetsBucketName. Define LUVA_ASSETS_BUCKET.");
  if (!resolved.tableName) throw new Error("No se pudo resolver CharacterPostsTableName. Define CHARACTER_POSTS_TABLE_NAME.");
  if (!resolved.cloudfrontUrl) throw new Error("No se pudo resolver AssetsUrl. Define ASSETS_CLOUDFRONT_URL.");

  return resolved;
}

// ── Stories seed parser ────────────────────────────────────────────────────────

function getQuotedValue(block, key) {
  const match = block.match(new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`));
  return match ? match[1] : null;
}

function parseStoriesSeed(content) {
  // Collect positions of all storyId declarations
  const storyRe = /storyId\s*:\s*["']([^"']+)["']/g;
  const titleRe = /\btitle\s*:\s*["']([^"']+)["']/g;
  const missionRe = /\{\s*missionId\s*:[\s\S]*?\n\s*\},/g;

  // Build sorted list of { pos, storyId, storyTitle }
  const storyAnchors = [];
  let m;
  while ((m = storyRe.exec(content)) !== null) {
    storyAnchors.push({ pos: m.index, storyId: m[1] });
  }

  // For each storyAnchor, find the nearest title after it (before the next storyAnchor)
  for (let i = 0; i < storyAnchors.length; i += 1) {
    const start = storyAnchors[i].pos;
    const end = i + 1 < storyAnchors.length ? storyAnchors[i + 1].pos : content.length;
    const slice = content.slice(start, end);
    const tm = slice.match(/\btitle\s*:\s*["']([^"']+)["']/);
    storyAnchors[i].storyTitle = tm ? tm[1] : storyAnchors[i].storyId;
  }

  // For each mission block, find its nearest preceding storyAnchor
  const characters = [];
  const missionCountPerStory = new Map();

  while ((m = missionRe.exec(content)) !== null) {
    const mPos = m.index;
    const mBlock = m[0];

    // Find the story this mission belongs to (last storyAnchor before this position)
    let storyAnchor = null;
    for (const anchor of storyAnchors) {
      if (anchor.pos < mPos) storyAnchor = anchor;
      else break;
    }
    if (!storyAnchor) continue;

    const missionId = getQuotedValue(mBlock, "missionId");
    const missionTitle = getQuotedValue(mBlock, "title");
    const characterName = getQuotedValue(mBlock, "caracterName");
    const avatarImageUrl = getQuotedValue(mBlock, "avatarImageUrl");

    if (!missionId) continue;

    const key = storyAnchor.storyId;
    const sceneIndex = missionCountPerStory.get(key) ?? 0;
    missionCountPerStory.set(key, sceneIndex + 1);

    characters.push({
      characterId: `${storyAnchor.storyId}:${missionId}`,
      storyId: storyAnchor.storyId,
      missionId,
      sceneIndex,
      storyTitle: storyAnchor.storyTitle,
      missionTitle: missionTitle || missionId,
      characterName: characterName || missionTitle || missionId,
      avatarImageUrl: avatarImageUrl || undefined,
    });
  }

  return characters;
}

// ── LM Studio caption ─────────────────────────────────────────────────────────

function resolveLMEndpoint(baseUrl) {
  const normalized = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (normalized.endsWith("/chat/completions")) return normalized;
  return `${normalized}/v1/chat/completions`;
}

async function generateCaption(characterName, imagePrompt, options) {
  const endpoint = resolveLMEndpoint(options.baseUrl);

  const { data } = await axios.post(
    endpoint,
    {
      model: options.model,
      temperature: 0.7,
      max_tokens: options.maxTokens,
      messages: [
        {
          role: "system",
          content:
            "You write short, engaging Instagram captions in English for a fictional character. " +
            "Include 5-8 relevant hashtags at the end. Keep the caption under 150 words. " +
            "Write in first person as the character. No quotation marks around the caption.",
        },
        {
          role: "user",
          content:
            `Character: ${characterName}\n` +
            `Scene: ${imagePrompt}\n\n` +
            "Write the Instagram caption.",
        },
      ],
    },
    { timeout: 60000 }
  );

  const content = data?.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content.trim() : "";
  if (!text) throw new Error("LM Studio devolvio caption vacio.");

  // strip code fences if model wraps it
  const m = text.match(/^```[^\n]*\n([\s\S]*?)\n```$/);
  return m ? m[1].trim() : text;
}

async function generateCaptionWithRetry(characterName, imagePrompt, options) {
  let delayMs = 1000;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await generateCaption(characterName, imagePrompt, options);
    } catch (error) {
      if (attempt >= 3) throw error;
      console.warn(`    [caption intento ${attempt}] ${error.message}`);
      await new Promise((r) => setTimeout(r, delayMs));
      delayMs = Math.min(delayMs * 2, 5000);
    }
  }
}

// ── Image finder ──────────────────────────────────────────────────────────────

function findGeneratedImage(filenamePrefix) {
  if (!fs.existsSync(COMFYUI_OUTPUT_DIR)) return null;

  const files = fs.readdirSync(COMFYUI_OUTPUT_DIR);
  // ComfyUI names files like: prefix_00001_.png
  const match = files
    .filter((f) => f.startsWith(filenamePrefix) && /\.(png|jpg|jpeg|webp)$/i.test(f))
    .sort()
    .pop(); // last one = highest counter

  return match ? path.join(COMFYUI_OUTPUT_DIR, match) : null;
}

// ── S3 upload ─────────────────────────────────────────────────────────────────

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

async function uploadToS3(s3Client, bucketName, imagePath, missionId, day) {
  const ext = path.extname(imagePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const uuid = randomUUID();
  const s3Key = `${S3_PREFIX}/${timestamp}-${missionId}-day${String(day).padStart(2, "0")}-${uuid}${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fs.createReadStream(imagePath),
      ContentType: getContentType(imagePath),
      Metadata: {
        missionid: missionId,
        day: String(day),
      },
    })
  );

  return s3Key;
}

// ── DynamoDB put ──────────────────────────────────────────────────────────────

async function saveCharacterPost(dynamo, tableName, record) {
  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: record,
      ConditionExpression:
        "attribute_not_exists(characterId) AND attribute_not_exists(postId)",
    })
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const submitted = readJsonFile(SUBMITTED_PATH, {});
  const jobKeys = Object.keys(submitted);

  if (jobKeys.length === 0) {
    throw new Error(`No hay jobs en ${SUBMITTED_PATH}. Ejecuta primero el paso 3.`);
  }

  const seedContent = await fsp.readFile(STORIES_SEED_PATH, "utf8");
  const characters = parseStoriesSeed(seedContent);
  const characterMap = new Map(characters.map((c) => [c.missionId, c]));

  const published = readJsonFile(PUBLISHED_PATH, {});

  const awsConfig = getAwsConfig();
  const cfClient = new CloudFormationClient(awsConfig);
  const s3Client = new S3Client(awsConfig);
  const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient(awsConfig), {
    marshallOptions: { removeUndefinedValues: true },
  });

  const { bucketName, tableName, cloudfrontUrl } = await resolveAwsResources(cfClient);
  const cdnBase = cloudfrontUrl.replace(/\/+$/, "");

  const lmOptions = { baseUrl: LMSTUDIO_BASE_URL, model: LMSTUDIO_MODEL, maxTokens: LMSTUDIO_MAX_TOKENS };

  console.log(`Bucket:  ${bucketName}`);
  console.log(`Tabla:   ${tableName}`);
  console.log(`CDN:     ${cdnBase}`);
  console.log(`Output:  ${COMFYUI_OUTPUT_DIR}`);
  console.log(`Jobs:    ${jobKeys.length} | Ya publicados: ${Object.keys(published).length}\n`);

  let ok = 0;
  let skipped = 0;
  let errors = 0;

  for (const jobKey of jobKeys) {
    if (published[jobKey]) {
      skipped += 1;
      continue;
    }

    const { filenamePrefix } = submitted[jobKey];
    // jobKey = "{missionId}__day{N}"
    const [missionId, dayPart] = jobKey.split("__day");
    const day = Number(dayPart) + 1; // dayIndex is 0-based

    const character = characterMap.get(missionId);
    if (!character) {
      console.warn(`[SKIP] ${jobKey}: mision no encontrada en stories-seed`);
      errors += 1;
      continue;
    }

    // 1. Buscar imagen generada
    const imagePath = findGeneratedImage(filenamePrefix);
    if (!imagePath) {
      console.log(`[WAIT] ${jobKey}: imagen ${filenamePrefix}*.png aun no aparece en ${COMFYUI_OUTPUT_DIR}`);
      skipped += 1;
      continue;
    }

    console.log(`[${jobKey}]`);
    console.log(`  imagen: ${path.basename(imagePath)}`);

    // 2. Generar caption con LM Studio
    process.stdout.write(`  caption... `);
    let caption;
    try {
      caption = await generateCaptionWithRetry(
        character.characterName,
        filenamePrefix.replace(/_/g, " "),
        lmOptions
      );
      console.log(`ok (${caption.length} chars)`);
    } catch (error) {
      console.log(`ERROR: ${error.message}`);
      errors += 1;
      continue;
    }

    // 3. Subir a S3
    process.stdout.write(`  upload S3... `);
    let s3Key;
    try {
      s3Key = await uploadToS3(s3Client, bucketName, imagePath, missionId, day);
      console.log(`ok -> ${s3Key}`);
    } catch (error) {
      console.log(`ERROR: ${error.message}`);
      errors += 1;
      continue;
    }

    const imageUrl = `${cdnBase}/${s3Key}`;

    // 4. Guardar CharacterPost en DynamoDB
    const now = new Date().toISOString();
    const postId = randomUUID();
    const record = {
      characterId: character.characterId,
      postId,
      storyId: character.storyId,
      missionId: character.missionId,
      sceneIndex: character.sceneIndex,
      storyTitle: character.storyTitle,
      missionTitle: character.missionTitle,
      characterName: character.characterName,
      ...(character.avatarImageUrl ? { avatarImageUrl: character.avatarImageUrl } : {}),
      caption,
      imageUrl,
      order: day,
      createdAt: now,
      updatedAt: now,
    };

    process.stdout.write(`  dynamo put... `);
    try {
      await saveCharacterPost(dynamo, tableName, record);
      console.log(`ok (postId: ${postId})`);
    } catch (error) {
      if (error.name === "ConditionalCheckFailedException") {
        console.log(`ya existe, saltando`);
      } else {
        console.log(`ERROR: ${error.message}`);
        errors += 1;
        continue;
      }
    }

    published[jobKey] = { postId, imageUrl, s3Key, publishedAt: now };
    writeJsonFile(PUBLISHED_PATH, published);
    ok += 1;
    console.log();
  }

  console.log(`\nListo. Publicados: ${ok} | Pendientes/saltados: ${skipped} | Errores: ${errors}`);
  console.log(`Registro en: ${PUBLISHED_PATH}`);
}

main().catch((error) => {
  const detail = error.response?.data ?? error.message;
  console.error(
    "Error:",
    typeof detail === "object" ? JSON.stringify(detail, null, 2) : detail
  );
  process.exit(1);
});
