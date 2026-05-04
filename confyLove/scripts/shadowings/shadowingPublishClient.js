const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { CloudFormationClient, DescribeStacksCommand } = require("@aws-sdk/client-cloudformation");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { getAudioDurationSeconds } = require("../b1c1movie/ffmpegUtils");

const WHISPER_MODEL = "whisper-1";
const DEFAULT_REGION = "us-west-2";
const DEFAULT_STACK_NAME = "LuvaStack";
const AUDIO_CACHE_CONTROL = "public, max-age=31536000, immutable";
const SUBTITLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

function getAwsConfig() {
  const config = {
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || process.env.CDK_DEFAULT_REGION || DEFAULT_REGION,
  };
  if (process.env.AWS_PROFILE) {
    config.credentials = fromIni({ profile: process.env.AWS_PROFILE });
  }
  return config;
}

async function getStackOutputs(cfClient) {
  const stackName = process.env.LUVA_STACK_NAME || DEFAULT_STACK_NAME;
  const response = await cfClient.send(new DescribeStacksCommand({ StackName: stackName }));
  const outputs = response.Stacks?.[0]?.Outputs || [];
  return new Map(outputs.map((output) => [output.OutputKey, output.OutputValue]));
}

async function resolveResources() {
  const awsConfig = getAwsConfig();
  const cfClient = new CloudFormationClient(awsConfig);
  const outputs = await getStackOutputs(cfClient);
  const assetsBaseUrl =
    process.env.ASSETS_CLOUDFRONT_URL?.trim() ||
    process.env.ASSETS_CLOUDFRONT_DOMAIN_NAME?.trim() ||
    outputs.get("AssetsUrl");

  const resources = {
    awsConfig,
    listsTableName:
      process.env.SHADOWING_LISTS_TABLE_NAME?.trim() ||
      process.env.LUVA_SHADOWING_LISTS_TABLE?.trim() ||
      outputs.get("ShadowingListsTableName"),
    chaptersTableName:
      process.env.SHADOWING_CHAPTERS_TABLE_NAME?.trim() ||
      process.env.LUVA_SHADOWING_CHAPTERS_TABLE?.trim() ||
      outputs.get("ShadowingChaptersTableName"),
    assetsBucketName:
      process.env.ASSETS_BUCKET_NAME?.trim() ||
      process.env.LUVA_ASSETS_BUCKET?.trim() ||
      outputs.get("AssetsBucketName"),
    assetsBaseUrl: assetsBaseUrl
      ? assetsBaseUrl.startsWith("http")
        ? assetsBaseUrl.replace(/\/$/, "")
        : `https://${assetsBaseUrl.replace(/\/$/, "")}`
      : undefined,
  };

  if (!resources.listsTableName) throw new Error("No se pudo resolver ShadowingListsTableName.");
  if (!resources.chaptersTableName) throw new Error("No se pudo resolver ShadowingChaptersTableName.");
  if (!resources.assetsBucketName) throw new Error("No se pudo resolver AssetsBucketName.");
  if (!resources.assetsBaseUrl) throw new Error("No se pudo resolver AssetsUrl. Define ASSETS_CLOUDFRONT_URL.");
  return resources;
}

function buildAssetUrl(baseUrl, key) {
  return `${baseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function audioContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".m4a") return "audio/mp4";
  if (ext === ".ogg") return "audio/ogg";
  return "audio/wav";
}

function audioExtension(filePath) {
  const ext = path.extname(filePath).replace(".", "").toLowerCase();
  if (ext === "m4a") return "m4a";
  if (ext === "ogg") return "ogg";
  if (ext === "wav" || ext === "wave") return "wav";
  return "mp3";
}

function getOpenAiKey() {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (!key?.trim()) throw new Error("OPENAI_API_KEY is not set in .env");
  return key.trim();
}

function formatSrtTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function buildSrtFromSegments(segments) {
  return segments
    .map((segment, index) =>
      [index + 1, `${formatSrtTime(segment.start)} --> ${formatSrtTime(segment.end)}`, String(segment.text || "").trim(), ""].join("\n")
    )
    .join("\n");
}

async function transcribeToSrt(audioPath) {
  const audioBuffer = fs.readFileSync(audioPath);
  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: audioContentType(audioPath) });
  form.append("file", blob, path.basename(audioPath));
  form.append("model", process.env.WHISPER_MODEL || WHISPER_MODEL);
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${getOpenAiKey()}` },
    body: form,
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Whisper HTTP ${response.status}: ${raw.slice(0, 400)}`);
  }

  const parsed = JSON.parse(raw);
  const srt = buildSrtFromSegments(parsed.segments || []);
  if (!srt.trim()) throw new Error("Whisper returned no segments");
  return srt;
}

function normalizeOrder(value, fallback = 1) {
  const parsed = typeof value === "number" ? value : Number(String(value || "").trim());
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
}

function compareLists(left, right) {
  if (left.order !== right.order) return left.order - right.order;
  const categoryComparison = String(left.category || "").localeCompare(String(right.category || ""));
  if (categoryComparison !== 0) return categoryComparison;
  return String(left.name || "").localeCompare(String(right.name || ""));
}

async function findListByName(docClient, tableName, listName) {
  const items = [];
  let lastKey;
  do {
    const page = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: lastKey,
      })
    );
    items.push(...(page.Items || []));
    lastKey = page.LastEvaluatedKey;
  } while (lastKey);

  return items
    .filter((item) => String(item?.name || "") === listName)
    .sort(compareLists)[0];
}

async function ensureList(docClient, resources, { listName, category, order = 1 }) {
  const existing = await findListByName(docClient, resources.listsTableName, listName);
  if (existing?.listId) {
    const now = new Date().toISOString();
    const list = {
      ...existing,
      name: listName,
      category,
      order: normalizeOrder(order, existing.order),
      status: "published",
      assetsBucketName: existing.assetsBucketName || resources.assetsBucketName,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({ TableName: resources.listsTableName, Item: list }));
    console.log(`List already exists: ${list.listId} (${list.name})`);
    return list;
  }

  const now = new Date().toISOString();
  const list = {
    listId: randomUUID(),
    name: listName,
    category,
    order: normalizeOrder(order),
    status: "published",
    assetsBucketName: resources.assetsBucketName,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: resources.listsTableName,
      Item: list,
      ConditionExpression: "attribute_not_exists(listId)",
    })
  );
  console.log(`Created list: ${list.listId} (${list.name})`);
  return list;
}

async function findChapterForJob(docClient, tableName, listId, order, title) {
  const items = [];
  let lastKey;
  do {
    const page = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "listId = :listId",
        ExpressionAttributeValues: { ":listId": listId },
        ExclusiveStartKey: lastKey,
      })
    );
    items.push(...(page.Items || []));
    lastKey = page.LastEvaluatedKey;
  } while (lastKey);

  const normalizedTitle = String(title || "").trim().toLowerCase();
  return items.find(
    (item) => normalizeOrder(item?.order) === order && String(item?.title || "").trim().toLowerCase() === normalizedTitle
  );
}

async function putObject(s3Client, resources, key, body, contentType, cacheControl) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: resources.assetsBucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  );
}

async function publishChapter({ docClient, s3Client, resources, list, job, ffmpegPath, subtitles }) {
  if (!fs.existsSync(job.outputPath)) {
    console.warn(`Skip chapter ${job.index + 1}: audio not found at ${job.outputPath}`);
    return { skipped: true };
  }

  const now = new Date().toISOString();
  const title = job.dialogueData.title || job.slug;
  const order = normalizeOrder(job.dialogueData.chapter, job.index + 1);
  const existing = await findChapterForJob(docClient, resources.chaptersTableName, list.listId, order, title);
  const chapterId = existing?.chapterId || randomUUID();
  const description = String(job.dialogueData.description || "").trim().slice(0, 1200);
  const durationSeconds = ffmpegPath ? getAudioDurationSeconds(ffmpegPath, job.outputPath) : undefined;
  const audioKey = `shadowing/${list.listId}/${chapterId}/audio.${audioExtension(job.outputPath)}`;
  const audioUrl = buildAssetUrl(resources.assetsBaseUrl, audioKey);
  const fileSizeMB = (fs.statSync(job.outputPath).size / 1024 / 1024).toFixed(1);

  console.log(`\nChapter ${order}: ${title}${durationSeconds != null ? ` (${durationSeconds}s)` : ""}`);
  console.log(`  Uploading audio ${fileSizeMB} MB...`);
  await putObject(
    s3Client,
    resources,
    audioKey,
    fs.readFileSync(job.outputPath),
    audioContentType(job.outputPath),
    AUDIO_CACHE_CONTROL
  );

  let subtitlesKey;
  let subtitlesUrl;
  if (subtitles) {
    console.log(`  Transcribing with Whisper...`);
    const srt = await transcribeToSrt(job.outputPath);
    const srtPath = job.outputPath.replace(/\.[^.]+$/, ".srt");
    fs.writeFileSync(srtPath, srt, "utf-8");
    console.log(`  SRT saved: ${path.basename(srtPath)}`);

    subtitlesKey = `shadowing/${list.listId}/${chapterId}/subtitles.srt`;
    subtitlesUrl = buildAssetUrl(resources.assetsBaseUrl, subtitlesKey);
    await putObject(
      s3Client,
      resources,
      subtitlesKey,
      Buffer.from(srt, "utf-8"),
      "application/x-subrip; charset=utf-8",
      SUBTITLE_CACHE_CONTROL
    );
  }

  const chapter = {
    ...existing,
    listId: list.listId,
    chapterId,
    title: String(title).trim().slice(0, 180),
    description,
    order,
    status: "ready",
    audioKey,
    audioUrl,
    subtitlesKey,
    subtitlesUrl,
    assetsBucketName: resources.assetsBucketName,
    durationSeconds: durationSeconds != null && durationSeconds > 0 ? durationSeconds : undefined,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({ TableName: resources.chaptersTableName, Item: chapter }));

  console.log(`  ${existing ? "Updated" : "Published"}: ${chapter.chapterId}`);
  if (subtitlesUrl) console.log(`  Subtitles: ${subtitlesUrl}`);
  return { chapter };
}

async function publishShadowingCatalog(listMeta, jobs, { ffmpegPath, subtitles = true } = {}) {
  const resources = await resolveResources();
  const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient(resources.awsConfig), {
    marshallOptions: { removeUndefinedValues: true },
  });
  const s3Client = new S3Client(resources.awsConfig);

  console.log(`\nPublishing to shadowing catalog directly via AWS...`);
  const list = await ensureList(dynamo, resources, {
    listName: listMeta.listName,
    category: listMeta.category,
    order: listMeta.order || 1,
  });

  const failures = [];
  for (const job of jobs) {
    try {
      await publishChapter({ docClient: dynamo, s3Client, resources, list, job, ffmpegPath, subtitles });
    } catch (error) {
      failures.push({ job, message: error.message });
      console.error(`  Failed: ${error.message}`);
    }
  }

  console.log(`\nList ID: ${list.listId}`);
  console.log(`Name:    ${list.name}`);
  console.log(`Chapters published: ${jobs.length - failures.length}/${jobs.length}`);

  if (failures.length > 0) {
    console.error("\nFailed chapters:");
    failures.forEach(({ job, message }) =>
      console.error(`  - ${job.dialogueData.title || job.slug}: ${message}`)
    );
  }

  return { list, failures };
}

module.exports = { publishShadowingCatalog };
