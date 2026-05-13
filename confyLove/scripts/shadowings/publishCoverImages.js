const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const { spawnSync } = require("child_process");
const dotenv = require("dotenv");
const ffmpegPath = require("ffmpeg-static");
const { CloudFormationClient, DescribeStacksCommand } = require("@aws-sdk/client-cloudformation");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { GetCommand, PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const LIST_PATH = path.join(__dirname, "list.json");
const SUBMITTED_PATH = path.join(__dirname, "coverSubmitted.json");
const PUBLISHED_PATH = path.join(__dirname, "coverPublished.json");
const MD_OUTPUT_DIR = path.join(__dirname, "coverMd");

const COMFYUI_OUTPUT_DIR = process.env.COMFYUI_OUTPUT_DIR || "C:/ComfyUI/output";
const DEFAULT_STACK_NAME = process.env.LUVA_STACK_NAME || "LuvaStack";
const DEFAULT_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const CACHE_CONTROL = "public, max-age=31536000, immutable";
const MD_SIZE = 500;

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 4) + "\n", "utf8");
}

function writeCompactJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function getAwsConfig() {
  const config = { region: DEFAULT_REGION };
  if (process.env.AWS_PROFILE) {
    config.credentials = fromIni({ profile: process.env.AWS_PROFILE });
  }
  return config;
}

async function getStackOutputs(cfClient) {
  const response = await cfClient.send(new DescribeStacksCommand({ StackName: DEFAULT_STACK_NAME }));
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
  if (!resources.assetsBucketName) throw new Error("No se pudo resolver AssetsBucketName.");
  if (!resources.assetsBaseUrl) throw new Error("No se pudo resolver AssetsUrl. Define ASSETS_CLOUDFRONT_URL.");

  return resources;
}

function buildAssetUrl(baseUrl, key) {
  return `${baseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

function findGeneratedImage(filenamePrefix) {
  if (!fs.existsSync(COMFYUI_OUTPUT_DIR)) return null;

  const files = fs.readdirSync(COMFYUI_OUTPUT_DIR);
  const match = files
    .filter((file) => file.startsWith(filenamePrefix) && /\.(png|jpg|jpeg|webp)$/i.test(file))
    .sort()
    .pop();

  return match ? path.join(COMFYUI_OUTPUT_DIR, match) : null;
}

async function createMdWebp(sourcePath, listId) {
  await fsp.mkdir(MD_OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(MD_OUTPUT_DIR, `${listId}-cover-md.webp`);
  const filter = `scale=${MD_SIZE}:${MD_SIZE}:force_original_aspect_ratio=increase,crop=${MD_SIZE}:${MD_SIZE}`;
  const result = spawnSync(
    ffmpegPath,
    ["-y", "-i", sourcePath, "-vf", filter, "-c:v", "libwebp", "-quality", "84", "-compression_level", "5", outputPath],
    { encoding: "utf8" }
  );

  if (result.status !== 0) {
    throw new Error(`ffmpeg fallo al crear md webp: ${result.stderr || result.stdout}`);
  }

  return outputPath;
}

async function putObject(s3Client, resources, key, filePath, metadata = {}) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: resources.assetsBucketName,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentType: getContentType(filePath),
      CacheControl: CACHE_CONTROL,
      Metadata: metadata,
    })
  );
}

async function getExistingList(docClient, tableName, listId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { listId },
    })
  );
  return result.Item;
}

function buildListRecord(existing, localList, fields) {
  const now = new Date().toISOString();
  return {
    ...existing,
    listId: localList.listId,
    name: localList.name,
    category: localList.category,
    order: localList.order || 1,
    status: localList.status || "published",
    assetsBucketName: fields.assetsBucketName,
    createdAt: existing?.createdAt || localList.createdAt || now,
    updatedAt: now,
    coverImageKey: fields.coverImageKey,
    coverImageUrl: fields.coverImageUrl,
    coverImageMdKey: fields.coverImageMdKey,
    coverImageMdUrl: fields.coverImageMdUrl,
  };
}

async function main() {
  const force = process.argv.includes("--force");
  const catalog = readJsonFile(LIST_PATH, null);
  if (!catalog || !Array.isArray(catalog.lists)) {
    throw new Error(`No se pudo leer catalogo de shadowing en ${LIST_PATH}`);
  }

  const submitted = readJsonFile(SUBMITTED_PATH, {});
  const published = readJsonFile(PUBLISHED_PATH, {});
  const jobKeys = Object.keys(submitted);
  if (jobKeys.length === 0) {
    throw new Error(`No hay jobs en ${SUBMITTED_PATH}. Ejecuta primero generateCoverImages.js.`);
  }

  const listById = new Map(catalog.lists.map((list) => [list.listId, list]));
  const resources = await resolveResources();
  const s3Client = new S3Client(resources.awsConfig);
  const docClient = DynamoDBDocumentClient.from(new DynamoDBClient(resources.awsConfig), {
    marshallOptions: { removeUndefinedValues: true },
  });

  console.log(`Bucket:  ${resources.assetsBucketName}`);
  console.log(`Tabla:   ${resources.listsTableName}`);
  console.log(`CDN:     ${resources.assetsBaseUrl}`);
  console.log(`Output:  ${COMFYUI_OUTPUT_DIR}`);
  console.log(`Jobs:    ${jobKeys.length} | Ya publicados: ${Object.keys(published).length}\n`);

  let ok = 0;
  let skipped = 0;
  let errors = 0;

  for (const jobKey of jobKeys) {
    const submittedJob = submitted[jobKey];
    const listId = submittedJob.listId || jobKey;
    const list = listById.get(listId);

    if (!list) {
      console.warn(`[SKIP] ${jobKey}: lista no encontrada en list.json`);
      errors += 1;
      continue;
    }

    if (published[jobKey] && !force) {
      skipped += 1;
      continue;
    }

    if (list.coverImageKey && list.coverImageUrl && list.coverImageMdKey && list.coverImageMdUrl && !force) {
      console.log(`[SKIP] ${list.name}: ya tiene cover y md en list.json`);
      skipped += 1;
      continue;
    }

    const imagePath = findGeneratedImage(submittedJob.filenamePrefix);
    if (!imagePath) {
      console.log(`[WAIT] ${list.name}: no aparece ${submittedJob.filenamePrefix}*.png en ${COMFYUI_OUTPUT_DIR}`);
      skipped += 1;
      continue;
    }

    console.log(`[${list.name}]`);
    console.log(`  imagen: ${path.basename(imagePath)}`);

    let mdPath;
    try {
      process.stdout.write("  md 500x500 webp... ");
      mdPath = await createMdWebp(imagePath, list.listId);
      console.log(`ok -> ${path.basename(mdPath)}`);
    } catch (error) {
      console.log(`ERROR: ${error.message}`);
      errors += 1;
      continue;
    }

    const uuid = randomUUID();
    const originalExt = path.extname(imagePath).toLowerCase() || ".png";
    const coverImageKey = `shadowing/${list.listId}/cover/${uuid}${originalExt}`;
    const coverImageMdKey = `shadowing/${list.listId}/cover/${uuid}-md.webp`;
    const coverImageUrl = buildAssetUrl(resources.assetsBaseUrl, coverImageKey);
    const coverImageMdUrl = buildAssetUrl(resources.assetsBaseUrl, coverImageMdKey);

    try {
      process.stdout.write("  upload original... ");
      await putObject(s3Client, resources, coverImageKey, imagePath, { listid: list.listId, variant: "original" });
      console.log(`ok -> ${coverImageKey}`);

      process.stdout.write("  upload md... ");
      await putObject(s3Client, resources, coverImageMdKey, mdPath, { listid: list.listId, variant: "md" });
      console.log(`ok -> ${coverImageMdKey}`);
    } catch (error) {
      console.log(`ERROR: ${error.message}`);
      errors += 1;
      continue;
    }

    try {
      process.stdout.write("  dynamo put... ");
      const existing = await getExistingList(docClient, resources.listsTableName, list.listId);
      if (!existing) throw new Error(`Lista ${list.listId} no existe en DynamoDB`);

      const record = buildListRecord(existing, list, {
        assetsBucketName: resources.assetsBucketName,
        coverImageKey,
        coverImageUrl,
        coverImageMdKey,
        coverImageMdUrl,
      });

      await docClient.send(
        new PutCommand({
          TableName: resources.listsTableName,
          Item: record,
          ConditionExpression: "attribute_exists(listId)",
        })
      );
      console.log("ok");
    } catch (error) {
      console.log(`ERROR: ${error.message}`);
      errors += 1;
      continue;
    }

    const now = new Date().toISOString();
    list.coverImageKey = coverImageKey;
    list.coverImageUrl = coverImageUrl;
    list.coverImageMdKey = coverImageMdKey;
    list.coverImageMdUrl = coverImageMdUrl;
    list.assetsBucketName = resources.assetsBucketName;
    list.updatedAt = now;
    writeJsonFile(LIST_PATH, catalog);

    published[jobKey] = {
      listId: list.listId,
      name: list.name,
      imagePath,
      mdPath,
      coverImageKey,
      coverImageUrl,
      coverImageMdKey,
      coverImageMdUrl,
      publishedAt: now,
    };
    writeCompactJsonFile(PUBLISHED_PATH, published);
    ok += 1;
    console.log();
  }

  console.log(`\nListo. Publicados: ${ok} | Pendientes/saltados: ${skipped} | Errores: ${errors}`);
  console.log(`Catalogo actualizado: ${LIST_PATH}`);
  console.log(`Registro en: ${PUBLISHED_PATH}`);
}

main().catch((error) => {
  const detail = error.response?.data ?? error.message;
  console.error("Error:", typeof detail === "object" ? JSON.stringify(detail, null, 2) : detail);
  process.exit(1);
});
