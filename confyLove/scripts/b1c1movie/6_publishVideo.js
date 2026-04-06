const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const util = require("util");
const { randomUUID } = require("crypto");
const dotenv = require("dotenv");
const {
  CloudFormationClient,
  DescribeStacksCommand,
} = require("@aws-sdk/client-cloudformation");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const storyData = require("../story.json");
const { getStories, getStoryId } = require("./storyUtils");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MANIFEST_DIR = path.join(__dirname, "..", "manifests");
const DEFAULT_STACK_NAME = "LuvaStack";
const DEFAULT_REGION = "us-west-2";
const DEFAULT_S3_PREFIX = "generated-videos";
const GENERATED_VIDEOS_BUCKET_OUTPUT = "GeneratedVideosBucketName";
const GENERATED_VIDEOS_TABLE_OUTPUT = "GeneratedVideosTableName";

function getAwsRegion() {
  return (
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    process.env.CDK_DEFAULT_REGION ||
    DEFAULT_REGION
  );
}

function getAwsClientConfig() {
  const config = {
    region: getAwsRegion(),
  };

  if (process.env.AWS_PROFILE) {
    config.credentials = fromIni({ profile: process.env.AWS_PROFILE });
  }

  return config;
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
        `No encontre el manifest ${manifestPath}. Ejecuta primero 5_addSubtitles.js`
      );
    }

    throw error;
  }
}

async function ensureVideoExists(videoPath) {
  try {
    const stat = await fsp.stat(videoPath);

    if (!stat.isFile()) {
      throw new Error(`La ruta no es un archivo: ${videoPath}`);
    }

    return stat;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        `No encontre el video ${videoPath}. Ejecuta primero 5_addSubtitles.js`
      );
    }

    throw error;
  }
}

function getVideoPathFromManifest(manifest) {
  const videoPath = manifest?.subtitles?.outputPath;

  if (!videoPath || typeof videoPath !== "string") {
    throw new Error(
      'El manifest no contiene subtitles.outputPath. Ejecuta primero 5_addSubtitles.js'
    );
  }

  return videoPath;
}

function sanitizeS3Segment(value, fallback = "item") {
  const sanitized = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9._/-]+/g, "_")
    .replace(/^\/+|\/+$/g, "");

  return sanitized || fallback;
}

function sanitizeAttributeSegment(value, fallback = "field") {
  const sanitized = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return sanitized || fallback;
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".mp4") {
    return "video/mp4";
  }

  if (extension === ".mov") {
    return "video/quicktime";
  }

  if (extension === ".webm") {
    return "video/webm";
  }

  if (extension === ".mkv") {
    return "video/x-matroska";
  }

  return "application/octet-stream";
}

function buildS3Key(storyId, uploadedAt, filePath) {
  const prefix = sanitizeS3Segment(
    process.env.LUVA_VIDEO_S3_PREFIX || DEFAULT_S3_PREFIX,
    DEFAULT_S3_PREFIX
  );
  const timestamp = sanitizeS3Segment(
    uploadedAt.replaceAll(":", "-").replaceAll(".", "-"),
    "uploaded"
  );
  const fileName = sanitizeS3Segment(path.basename(filePath), `${storyId}.mp4`);

  return [prefix, sanitizeS3Segment(storyId, "story"), timestamp, fileName].join("/");
}

function cloneGenerationManifest(manifest) {
  const cloned = JSON.parse(JSON.stringify(manifest || {}));
  delete cloned.publication;
  return cloned;
}

function addFlattenedValue(target, key, value) {
  if (Object.prototype.hasOwnProperty.call(target, key)) {
    throw new Error(`Colision al aplanar metadata: ${key}`);
  }

  target[key] = value;
}

function flattenValue(value, prefix, target) {
  if (value === undefined) {
    return;
  }

  if (value === null) {
    addFlattenedValue(target, prefix, null);
    return;
  }

  if (Array.isArray(value)) {
    addFlattenedValue(target, `${prefix}_count`, value.length);

    if (value.length === 0) {
      addFlattenedValue(target, prefix, "[]");
      return;
    }

    value.forEach((item, index) => {
      flattenValue(item, `${prefix}_${index}`, target);
    });
    return;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([, nestedValue]) => {
      return nestedValue !== undefined;
    });

    if (entries.length === 0) {
      addFlattenedValue(target, prefix, "{}");
      return;
    }

    for (const [key, nestedValue] of entries) {
      flattenValue(
        nestedValue,
        `${prefix}_${sanitizeAttributeSegment(key)}`,
        target
      );
    }
    return;
  }

  if (typeof value === "number" && !Number.isFinite(value)) {
    addFlattenedValue(target, prefix, String(value));
    return;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    addFlattenedValue(target, prefix, value);
    return;
  }

  addFlattenedValue(target, prefix, JSON.stringify(value));
}

function buildFlattenedGenerationAttributes(manifest) {
  const flattened = {};
  flattenValue(manifest, "generation", flattened);
  return flattened;
}

async function resolveOutputsFromStack(cloudFormationClient) {
  const stackName = process.env.LUVA_STACK_NAME || DEFAULT_STACK_NAME;
  const response = await cloudFormationClient.send(
    new DescribeStacksCommand({
      StackName: stackName,
    })
  );
  const outputs = new Map();

  for (const output of response.Stacks?.[0]?.Outputs || []) {
    if (output.OutputKey && output.OutputValue) {
      outputs.set(output.OutputKey, output.OutputValue);
    }
  }

  return {
    stackName,
    outputs,
  };
}

async function resolveBackendResources(cloudFormationClient) {
  const bucketNameFromEnv = process.env.LUVA_GENERATED_VIDEOS_BUCKET;
  const tableNameFromEnv = process.env.LUVA_GENERATED_VIDEOS_TABLE;

  if (bucketNameFromEnv && tableNameFromEnv) {
    return {
      stackName: process.env.LUVA_STACK_NAME || DEFAULT_STACK_NAME,
      bucketName: bucketNameFromEnv,
      tableName: tableNameFromEnv,
      source: "env",
    };
  }

  const { stackName, outputs } = await resolveOutputsFromStack(cloudFormationClient);
  const bucketName = bucketNameFromEnv || outputs.get(GENERATED_VIDEOS_BUCKET_OUTPUT);
  const tableName = tableNameFromEnv || outputs.get(GENERATED_VIDEOS_TABLE_OUTPUT);

  if (!bucketName) {
    throw new Error(
      `No pude resolver el bucket de videos. Define LUVA_GENERATED_VIDEOS_BUCKET o agrega el output ${GENERATED_VIDEOS_BUCKET_OUTPUT} al stack ${stackName}`
    );
  }

  if (!tableName) {
    throw new Error(
      `No pude resolver la tabla de videos. Define LUVA_GENERATED_VIDEOS_TABLE o agrega el output ${GENERATED_VIDEOS_TABLE_OUTPUT} al stack ${stackName}`
    );
  }

  return {
    stackName,
    bucketName,
    tableName,
    source: "cloudformation",
  };
}

function buildVideoRecord({
  story,
  storyId,
  generationManifest,
  manifestPath,
  backendResources,
  videoPath,
  videoStat,
  uploadedAt,
  s3Key,
  eTag,
}) {
  const videoId = randomUUID();
  const generationJson = JSON.stringify(generationManifest);
  const bucketPath = `s3://${backendResources.bucketName}/${s3Key}`;
  const record = {
    storyId,
    videoId,
    title: story.title || null,
    awsRegion: getAwsRegion(),
    stackName: backendResources.stackName,
    bucketName: backendResources.bucketName,
    bucketKey: s3Key,
    bucketPath,
    tableName: backendResources.tableName,
    uploadedAt,
    contentType: getContentType(videoPath),
    sourceVideoPath: videoPath,
    sourceVideoFileName: path.basename(videoPath),
    sourceVideoFileSizeBytes: videoStat.size,
    sourceVideoLastModifiedAt: videoStat.mtime.toISOString(),
    manifestPath,
    generationJson,
    generationSource: "manifest",
    generationUpdatedAt:
      generationManifest?.subtitles?.generatedAt ||
      generationManifest?.background?.generatedAt ||
      generationManifest?.updatedAt ||
      null,
    eTag: eTag || null,
  };

  return {
    ...record,
    ...buildFlattenedGenerationAttributes(generationManifest),
  };
}

async function uploadVideoToS3(s3Client, bucketName, storyId, videoPath, uploadedAt) {
  const s3Key = buildS3Key(storyId, uploadedAt, videoPath);
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: fs.createReadStream(videoPath),
    ContentType: getContentType(videoPath),
    Metadata: {
      storyid: storyId,
      uploadedat: uploadedAt,
    },
  });
  const response = await s3Client.send(command);

  return {
    s3Key,
    eTag: response.ETag ? response.ETag.replaceAll('"', "") : null,
  };
}

async function saveVideoRecord(dynamo, tableName, item) {
  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression:
        "attribute_not_exists(#storyId) AND attribute_not_exists(#videoId)",
      ExpressionAttributeNames: {
        "#storyId": "storyId",
        "#videoId": "videoId",
      },
    })
  );
}

async function processStory(story, services) {
  const storyId = getStoryId(story.id);
  const manifestPath = getManifestPath(storyId);
  const manifest = await loadManifest(storyId);
  const generationManifest = cloneGenerationManifest(manifest);
  const videoPath = getVideoPathFromManifest(generationManifest);
  const videoStat = await ensureVideoExists(videoPath);
  const uploadedAt = new Date().toISOString();
  const uploadResult = await uploadVideoToS3(
    services.s3Client,
    services.backendResources.bucketName,
    storyId,
    videoPath,
    uploadedAt
  );
  const item = buildVideoRecord({
    story,
    storyId,
    generationManifest,
    manifestPath,
    backendResources: services.backendResources,
    videoPath,
    videoStat,
    uploadedAt,
    s3Key: uploadResult.s3Key,
    eTag: uploadResult.eTag,
  });

  await saveVideoRecord(
    services.dynamo,
    services.backendResources.tableName,
    item
  );

  manifest.publication = {
    publishedAt: uploadedAt,
    stackName: services.backendResources.stackName,
    resourceResolution: services.backendResources.source,
    awsRegion: getAwsRegion(),
    bucketName: services.backendResources.bucketName,
    bucketKey: uploadResult.s3Key,
    bucketPath: item.bucketPath,
    tableName: services.backendResources.tableName,
    storyId: item.storyId,
    videoId: item.videoId,
    sourceVideoPath: videoPath,
    sourceVideoFileSizeBytes: videoStat.size,
    eTag: uploadResult.eTag,
  };

  await fsp.mkdir(MANIFEST_DIR, { recursive: true });
  await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  console.log("Video publicado en AWS");
  console.log(`Story ID: ${item.storyId}`);
  console.log(`Title: ${item.title || "sin titulo"}`);
  console.log(`Bucket: ${item.bucketName}`);
  console.log(`Key: ${item.bucketKey}`);
  console.log(`S3 path: ${item.bucketPath}`);
  console.log(`Table: ${item.tableName}`);
  console.log(`Video ID: ${item.videoId}`);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Video local: ${videoPath}`);
}

async function main() {
  const awsClientConfig = getAwsClientConfig();
  const cloudFormationClient = new CloudFormationClient(awsClientConfig);
  const s3Client = new S3Client(awsClientConfig);
  const dynamo = DynamoDBDocumentClient.from(
    new DynamoDBClient(awsClientConfig),
    {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    }
  );
  const backendResources = await resolveBackendResources(cloudFormationClient);
  const stories = getStories(storyData);

  for (const story of stories) {
    await processStory(story, {
      backendResources,
      s3Client,
      dynamo,
    });
  }
}

main().catch((error) => {
  console.error(
    "Error al publicar videos:",
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
