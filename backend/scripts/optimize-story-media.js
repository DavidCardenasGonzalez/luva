const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const pathPosix = require("path/posix");
const { createHash } = require("crypto");
const { spawn } = require("child_process");
const { pipeline } = require("stream/promises");
const { Readable } = require("stream");
const vm = require("vm");
const ts = require("typescript");
const ffmpegPath = require("ffmpeg-static");
const { CloudFormationClient, DescribeStacksCommand } = require("@aws-sdk/client-cloudformation");
const { HeadObjectCommand, PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 18) {
  console.error(`Node 18+ is required for story media optimization. Current: ${process.version}`);
  process.exit(1);
}

const sharp = require("sharp");

const ROOT_DIR = path.resolve(__dirname, "../..");
const BACKEND_DIR = path.resolve(__dirname, "..");
const DEFAULT_SEED_PATH = path.join(BACKEND_DIR, "src/data/stories-seed.ts");
const CACHE_DIR = path.join(BACKEND_DIR, ".media-cache/story-media");
const CACHE_CONTROL = "public, max-age=31536000, immutable";
const DEFAULT_REGION = "us-west-2";
const DEFAULT_STACK_NAME = "LuvaStack";

const AVATAR_VARIANTS = [
  {
    field: "avatarImageXsUrl",
    suffix: "avatar-xs-96",
    size: 96,
    quality: 75,
    contentType: "image/webp",
    extension: "webp",
  },
  {
    field: "avatarImageMdUrl",
    suffix: "avatar-md-512",
    size: 512,
    quality: 82,
    contentType: "image/webp",
    extension: "webp",
  },
];

const VIDEO_VARIANTS = [
  {
    field: "videoPreviewUrl",
    suffix: "preview-720x1280",
    contentType: "video/mp4",
    extension: "mp4",
  },
  {
    field: "videoThumbnailUrl",
    suffix: "thumbnail-720x1280",
    contentType: "image/webp",
    extension: "webp",
  },
];

function parseArgs(argv) {
  const options = {
    dryRun: false,
    seedPath: DEFAULT_SEED_PATH,
    imageConcurrency: Number(process.env.STORY_MEDIA_IMAGE_CONCURRENCY || 4),
    videoConcurrency: Number(process.env.STORY_MEDIA_VIDEO_CONCURRENCY || 2),
    limit: undefined,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg.startsWith("--seed=")) {
      options.seedPath = path.resolve(arg.slice("--seed=".length));
      continue;
    }
    if (arg.startsWith("--image-concurrency=")) {
      options.imageConcurrency = Number(arg.slice("--image-concurrency=".length));
      continue;
    }
    if (arg.startsWith("--video-concurrency=")) {
      options.videoConcurrency = Number(arg.slice("--video-concurrency=".length));
      continue;
    }
    if (arg.startsWith("--limit=")) {
      options.limit = Number(arg.slice("--limit=".length));
    }
  }

  options.imageConcurrency = Math.max(1, Math.floor(options.imageConcurrency) || 1);
  options.videoConcurrency = Math.max(1, Math.floor(options.videoConcurrency) || 1);
  if (options.limit !== undefined) {
    options.limit = Math.max(0, Math.floor(options.limit) || 0);
  }

  return options;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getAwsConfig() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || DEFAULT_REGION;
  if (process.env.AWS_PROFILE && !process.env.AWS_SDK_LOAD_CONFIG) {
    process.env.AWS_SDK_LOAD_CONFIG = "1";
  }
  return { region };
}

async function resolveStackOutputs(awsConfig) {
  const stackName = process.env.LUVA_STACK_NAME || DEFAULT_STACK_NAME;
  const cf = new CloudFormationClient(awsConfig);
  const response = await cf.send(new DescribeStacksCommand({ StackName: stackName }));
  const outputs = response.Stacks?.[0]?.Outputs || [];
  return new Map(outputs.map((output) => [output.OutputKey, output.OutputValue]));
}

async function resolveResources() {
  const awsConfig = getAwsConfig();
  let outputs = new Map();

  const bucketFromEnv = process.env.ASSETS_BUCKET_NAME?.trim() || process.env.LUVA_ASSETS_BUCKET?.trim();
  const baseUrlFromEnv =
    process.env.ASSETS_CLOUDFRONT_URL?.trim() ||
    process.env.ASSETS_CLOUDFRONT_DOMAIN_NAME?.trim();

  if (!bucketFromEnv || !baseUrlFromEnv) {
    outputs = await resolveStackOutputs(awsConfig);
  }

  const assetsBucketName =
    bucketFromEnv ||
    outputs.get("AssetsBucketName");
  const assetsBaseUrl = normalizeBaseUrl(baseUrlFromEnv || outputs.get("AssetsUrl"));

  if (!assetsBucketName) {
    throw new Error("ASSETS_BUCKET_NAME or CloudFormation output AssetsBucketName is required.");
  }
  if (!assetsBaseUrl) {
    throw new Error("ASSETS_CLOUDFRONT_URL, ASSETS_CLOUDFRONT_DOMAIN_NAME, or output AssetsUrl is required.");
  }

  return {
    awsConfig,
    assetsBucketName,
    assetsBaseUrl,
  };
}

function normalizeBaseUrl(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");
  if (!trimmed) return undefined;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function loadStories(seedPath) {
  const sourceText = fs.readFileSync(seedPath, "utf8");
  const transpiled = ts.transpileModule(sourceText, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: seedPath,
  });

  const sandbox = {
    exports: {},
    module: { exports: {} },
    require: (id) => {
      if (id === "../types" || id.endsWith("/types")) return {};
      return require(id);
    },
  };
  sandbox.module.exports = sandbox.exports;

  vm.runInNewContext(transpiled.outputText, sandbox, { filename: seedPath });
  const stories = sandbox.exports.STORIES_SEED || sandbox.module.exports.STORIES_SEED;
  if (!Array.isArray(stories)) {
    throw new Error(`Could not load STORIES_SEED from ${seedPath}`);
  }
  return stories;
}

function flattenMissions(stories) {
  const items = [];
  for (const story of stories) {
    for (const mission of story.missions || []) {
      if (!mission?.missionId) continue;
      items.push({
        storyId: story.storyId,
        storyTitle: story.title,
        missionId: mission.missionId,
        missionTitle: mission.title,
        characterName: mission.caracterName || mission.title || mission.missionId,
        avatarImageUrl: trimString(mission.avatarImageUrl),
        avatarImageXsUrl: trimString(mission.avatarImageXsUrl),
        avatarImageMdUrl: trimString(mission.avatarImageMdUrl),
        videoIntro: trimString(mission.videoIntro || mission.videoUrl),
        videoPreviewUrl: trimString(mission.videoPreviewUrl),
        videoThumbnailUrl: trimString(mission.videoThumbnailUrl),
      });
    }
  }
  return items;
}

function trimString(value) {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function hashValue(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function extensionFromUrl(url, fallback) {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathPosix.extname(pathname).replace(/^\./, "").toLowerCase();
    return ext || fallback;
  } catch {
    return fallback;
  }
}

function buildSourcePath(sourceUrl, fallbackExt) {
  const ext = extensionFromUrl(sourceUrl, fallbackExt);
  return path.join(CACHE_DIR, "downloads", `${hashValue(sourceUrl)}.${ext}`);
}

function buildOutputPath(missionId, suffix, extension) {
  const safeMissionId = sanitizeKeyPart(missionId);
  return path.join(CACHE_DIR, "optimized", `${safeMissionId}-${suffix}.${extension}`);
}

function getSourceKey(sourceUrl) {
  const url = new URL(sourceUrl);
  return url.pathname
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => decodeURIComponent(segment))
    .join("/");
}

function buildOptimizedKey(sourceUrl, suffix, extension) {
  const sourceKey = getSourceKey(sourceUrl);
  const sourceDir = pathPosix.dirname(sourceKey);
  const sourceBase = sanitizeKeyPart(pathPosix.basename(sourceKey, pathPosix.extname(sourceKey)));
  return `${sourceDir}/optimized/${sourceBase}-${suffix}.${extension}`;
}

function sanitizeKeyPart(value) {
  return String(value || "asset")
    .trim()
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "asset";
}

function buildAssetUrl(baseUrl, key) {
  return `${baseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function fileExists(filePath) {
  try {
    const stat = await fsp.stat(filePath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function downloadFile(url, outputPath) {
  if (await fileExists(outputPath)) {
    return { status: "cached", path: outputPath };
  }
  if (typeof fetch !== "function") {
    throw new Error("Node 18+ fetch is required to download media.");
  }

  await ensureDir(path.dirname(outputPath));
  const tempPath = `${outputPath}.part`;
  await fsp.rm(tempPath, { force: true });

  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed ${response.status} ${response.statusText}: ${url}`);
  }

  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(tempPath));
  await fsp.rename(tempPath, outputPath);
  return { status: "downloaded", path: outputPath };
}

async function s3ObjectExists(s3, bucketName, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    return true;
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    if (status === 404 || error?.name === "NotFound" || error?.name === "NoSuchKey") {
      return false;
    }
    throw error;
  }
}

async function putObjectIfMissing(s3, resources, key, filePath, contentType, metadata) {
  const exists = await s3ObjectExists(s3, resources.assetsBucketName, key);
  if (exists) {
    return "exists";
  }

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: resources.assetsBucketName,
        Key: key,
        Body: fs.createReadStream(filePath),
        ContentType: contentType,
        CacheControl: CACHE_CONTROL,
        Metadata: metadata,
        IfNoneMatch: "*",
      })
    );
    return "uploaded";
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    if (status === 412 || error?.name === "PreconditionFailed") {
      return "exists";
    }
    throw error;
  }
}

async function createAvatarVariant(sourcePath, outputPath, variant) {
  await ensureDir(path.dirname(outputPath));
  const info = await sharp(sourcePath)
    .rotate()
    .resize({
      width: variant.size,
      height: variant.size,
      fit: "inside",
      withoutEnlargement: false,
    })
    .webp({ quality: variant.quality, effort: 4 })
    .toFile(outputPath);
  return `${info.width}x${info.height}`;
}

async function createVideoPreview(sourcePath, outputPath) {
  await ensureDir(path.dirname(outputPath));
  await runFfmpeg(
    [
      "-y",
      "-i",
      sourcePath,
      "-map",
      "0:v:0",
      "-map",
      "0:a?",
      "-vf",
      "scale=720:1280:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1",
      "-c:v",
      "libx264",
      "-profile:v",
      "main",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      "-b:v",
      "1500k",
      "-maxrate",
      "1800k",
      "-bufsize",
      "3000k",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      "-shortest",
      outputPath,
    ],
    "video preview"
  );
}

async function createVideoThumbnail(sourcePath, outputPath) {
  await ensureDir(path.dirname(outputPath));
  await runFfmpeg(
    [
      "-y",
      "-ss",
      "0.1",
      "-i",
      sourcePath,
      "-frames:v",
      "1",
      "-vf",
      "scale=720:1280:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1",
      "-c:v",
      "libwebp",
      "-quality",
      "80",
      "-compression_level",
      "5",
      outputPath,
    ],
    "video thumbnail"
  );
}

function runFfmpeg(args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk.toString()}`.slice(-8000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${label} ffmpeg failed with exit code ${code}: ${stderr}`));
      }
    });
  });
}

async function processAvatarMission({ mission, s3, resources, dryRun, updates }) {
  if (!mission.avatarImageUrl) {
    console.log(`[avatar] ${mission.missionId}: no avatarImageUrl`);
    return;
  }

  const sourcePath = buildSourcePath(mission.avatarImageUrl, "img");
  let sourceReady = false;

  for (const variant of AVATAR_VARIANTS) {
    const existingUrl = mission[variant.field];
    if (existingUrl) {
      setMissionUpdate(updates, mission, variant.field, existingUrl);
      console.log(`[avatar:${variant.field}] ${mission.missionId}: already in seed`);
      continue;
    }

    const key = buildOptimizedKey(mission.avatarImageUrl, variant.suffix, variant.extension);
    const publicUrl = buildAssetUrl(resources.assetsBaseUrl, key);
    if (!dryRun && await s3ObjectExists(s3, resources.assetsBucketName, key)) {
      setMissionUpdate(updates, mission, variant.field, publicUrl);
      console.log(`[avatar:${variant.field}] ${mission.missionId}: exists on S3`);
      continue;
    }

    if (!sourceReady) {
      const download = await downloadFile(mission.avatarImageUrl, sourcePath);
      sourceReady = true;
      if (download.status === "downloaded") {
        console.log(`[avatar] ${mission.missionId}: downloaded source`);
      }
    }

    const outputPath = buildOutputPath(mission.missionId, variant.suffix, variant.extension);
    const dimensions = await createAvatarVariant(sourcePath, outputPath, variant);
    if (dryRun) {
      setMissionUpdate(updates, mission, variant.field, publicUrl);
      console.log(`[avatar:${variant.field}] ${mission.missionId}: dry-run ${dimensions}`);
      continue;
    }

    const uploadStatus = await putObjectIfMissing(
      s3,
      resources,
      key,
      outputPath,
      variant.contentType,
      {
        storyid: mission.storyId || "",
        missionid: mission.missionId,
        variant: variant.field.toLowerCase(),
      }
    );
    setMissionUpdate(updates, mission, variant.field, publicUrl);
    console.log(`[avatar:${variant.field}] ${mission.missionId}: ${uploadStatus} ${dimensions}`);
  }
}

async function processVideoMission({ mission, s3, resources, dryRun, updates }) {
  if (!mission.videoIntro) {
    console.log(`[video] ${mission.missionId}: no videoIntro`);
    return;
  }

  const sourcePath = buildSourcePath(mission.videoIntro, "mp4");
  let sourceReady = false;

  for (const variant of VIDEO_VARIANTS) {
    const existingUrl = mission[variant.field];
    if (existingUrl) {
      setMissionUpdate(updates, mission, variant.field, existingUrl);
      console.log(`[video:${variant.field}] ${mission.missionId}: already in seed`);
      continue;
    }

    const key = buildOptimizedKey(mission.videoIntro, variant.suffix, variant.extension);
    const publicUrl = buildAssetUrl(resources.assetsBaseUrl, key);
    if (!dryRun && await s3ObjectExists(s3, resources.assetsBucketName, key)) {
      setMissionUpdate(updates, mission, variant.field, publicUrl);
      console.log(`[video:${variant.field}] ${mission.missionId}: exists on S3`);
      continue;
    }

    if (!sourceReady) {
      const download = await downloadFile(mission.videoIntro, sourcePath);
      sourceReady = true;
      if (download.status === "downloaded") {
        console.log(`[video] ${mission.missionId}: downloaded source`);
      }
    }

    const outputPath = buildOutputPath(mission.missionId, variant.suffix, variant.extension);
    if (variant.field === "videoPreviewUrl") {
      await createVideoPreview(sourcePath, outputPath);
    } else {
      await createVideoThumbnail(sourcePath, outputPath);
    }

    if (dryRun) {
      setMissionUpdate(updates, mission, variant.field, publicUrl);
      console.log(`[video:${variant.field}] ${mission.missionId}: dry-run`);
      continue;
    }

    const uploadStatus = await putObjectIfMissing(
      s3,
      resources,
      key,
      outputPath,
      variant.contentType,
      {
        storyid: mission.storyId || "",
        missionid: mission.missionId,
        variant: variant.field.toLowerCase(),
      }
    );
    setMissionUpdate(updates, mission, variant.field, publicUrl);
    console.log(`[video:${variant.field}] ${mission.missionId}: ${uploadStatus}`);
  }
}

function setMissionUpdate(updates, mission, field, url) {
  const key = mission.missionId;
  const current = updates.get(key) || {};
  current[field] = url;
  updates.set(key, current);
}

async function runPool(label, jobs, concurrency) {
  let next = 0;
  let ok = 0;
  let failed = 0;

  async function worker() {
    while (true) {
      const index = next;
      next += 1;
      if (index >= jobs.length) return;
      const job = jobs[index];
      try {
        await job.run();
        ok += 1;
      } catch (error) {
        failed += 1;
        console.error(`[FAIL:${label}] ${job.label}: ${error.message || error}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
  return { ok, failed };
}

function writeSeedUpdates(seedPath, updates) {
  const sourceText = fs.readFileSync(seedPath, "utf8");
  const sourceFile = ts.createSourceFile(seedPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const insertions = [];

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const props = new Map();
      for (const prop of node.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const name = getPropertyName(prop.name);
        if (name) props.set(name, prop);
      }

      const missionIdProp = props.get("missionId");
      const missionId =
        missionIdProp && ts.isStringLiteralLike(missionIdProp.initializer)
          ? missionIdProp.initializer.text
          : undefined;
      const missionUpdate = missionId ? updates.get(missionId) : undefined;

      if (missionUpdate) {
        addInsertionsForGroup(sourceText, sourceFile, props, "avatarImageUrl", [
          ["avatarImageXsUrl", missionUpdate.avatarImageXsUrl],
          ["avatarImageMdUrl", missionUpdate.avatarImageMdUrl],
        ], insertions);
        addInsertionsForGroup(sourceText, sourceFile, props, "videoIntro", [
          ["videoPreviewUrl", missionUpdate.videoPreviewUrl],
          ["videoThumbnailUrl", missionUpdate.videoThumbnailUrl],
        ], insertions);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  const uniqueInsertions = dedupeInsertions(insertions)
    .sort((left, right) => right.pos - left.pos);
  if (!uniqueInsertions.length) {
    return 0;
  }

  let nextText = sourceText;
  for (const insertion of uniqueInsertions) {
    nextText = `${nextText.slice(0, insertion.pos)}${insertion.text}${nextText.slice(insertion.pos)}`;
  }
  fs.writeFileSync(seedPath, nextText, "utf8");
  return uniqueInsertions.length;
}

function getPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text;
  return undefined;
}

function addInsertionsForGroup(sourceText, sourceFile, props, anchorName, fields, insertions) {
  const anchor = props.get(anchorName);
  if (!anchor) return;

  const missingFields = fields.filter(([field, url]) => url && !props.has(field));
  if (!missingFields.length) return;

  const insertionPoint = findAfterPropertyComma(sourceText, anchor.end);
  const indent = getLineIndent(sourceText, anchor.getStart(sourceFile));
  const text = missingFields
    .map(([field, url]) => `\n${indent}${field}: ${JSON.stringify(url)},`)
    .join("");
  insertions.push({ pos: insertionPoint, text });
}

function findAfterPropertyComma(sourceText, start) {
  let pos = start;
  while (pos < sourceText.length && /\s/.test(sourceText[pos])) pos += 1;
  if (sourceText[pos] === ",") return pos + 1;
  return start;
}

function getLineIndent(sourceText, pos) {
  const lineStart = sourceText.lastIndexOf("\n", pos) + 1;
  const match = sourceText.slice(lineStart, pos).match(/^\s*/);
  return match ? match[0] : "";
}

function dedupeInsertions(insertions) {
  const seen = new Set();
  const result = [];
  for (const insertion of insertions) {
    const key = `${insertion.pos}:${insertion.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(insertion);
  }
  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  loadEnvFile(path.join(BACKEND_DIR, ".env"));
  loadEnvFile(path.join(ROOT_DIR, "confyLove/scripts/.env"));

  const stories = loadStories(options.seedPath);
  let missions = flattenMissions(stories).filter((mission) => mission.avatarImageUrl || mission.videoIntro);
  if (options.limit !== undefined && options.limit > 0) {
    missions = missions.slice(0, options.limit);
  }

  const resources = await resolveResources();
  const s3 = new S3Client(resources.awsConfig);
  const updates = new Map();

  console.log(`Seed:    ${options.seedPath}`);
  console.log(`Bucket:  ${resources.assetsBucketName}`);
  console.log(`CDN:     ${resources.assetsBaseUrl}`);
  console.log(`Missions:${missions.length}`);
  console.log(`Mode:    ${options.dryRun ? "dry-run" : "upload"}\n`);

  const avatarJobs = missions
    .filter((mission) => mission.avatarImageUrl)
    .map((mission) => ({
      label: mission.missionId,
      run: () => processAvatarMission({ mission, s3, resources, dryRun: options.dryRun, updates }),
    }));
  const videoJobs = missions
    .filter((mission) => mission.videoIntro)
    .map((mission) => ({
      label: mission.missionId,
      run: () => processVideoMission({ mission, s3, resources, dryRun: options.dryRun, updates }),
    }));

  const avatarResult = await runPool("avatars", avatarJobs, options.imageConcurrency);
  console.log(`\nAvatars done: ${avatarResult.ok} ok, ${avatarResult.failed} failed\n`);
  const videoResult = await runPool("videos", videoJobs, options.videoConcurrency);
  console.log(`\nVideos done: ${videoResult.ok} ok, ${videoResult.failed} failed\n`);

  const inserted = options.dryRun ? 0 : writeSeedUpdates(options.seedPath, updates);
  if (options.dryRun) {
    console.log("Dry run complete; seed was not changed.");
  } else {
    console.log(`Seed fields inserted: ${inserted}`);
  }

  const failures = avatarResult.failed + videoResult.failed;
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Error:", error.message || error);
  process.exit(1);
});
