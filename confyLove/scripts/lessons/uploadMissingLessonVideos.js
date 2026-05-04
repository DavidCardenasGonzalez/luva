const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const dotenv = require("dotenv");
const {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} = require("@aws-sdk/client-cloudformation");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchGetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DEFAULT_STACK_NAME = "LuvaStack";
const DEFAULT_REGION = "us-west-2";
const GENERATED_PATH = path.join(__dirname, "generatedLessons.json");
const VIDEO_DIR = "/Users/cardenas/Documents/Playground/lexical-precision-video/out";

const lessons = [
  ["4f27ff76-7f34-4106-9450-7561050fc42b", "Think Like a Native: The Invisible Meaning of English Words", "english-invisible-meaning-square-mobile.mp4"],
  ["2baacfcc-1613-4c48-bf92-0d2367504f8c", "How to Understand Movies and Series Without Subtitles", "english-movies-series-listening-square-mobile.mp4"],
  ["be2ff0ea-ac51-471e-8b86-a1d9791d46d9", "Unlock Academic Vocabulary with Latin and Greek Roots", "english-academic-roots-square-mobile.mp4"],
  ["31b75349-8ae1-4b5f-a170-8f56d6f7de28", "Four Powerful Discourse Markers for Writing and Debate", "english-discourse-markers-writing-debate.mp4"],
  ["790fab25-e241-4392-9a0a-df0ed82cc09c", "One Idea, Three Registers: Informal, Formal, and Academic English", "english-three-registers-square-mobile.mp4"],
  ["8cf71d57-aeec-46a1-9008-2527c6f4cde4", "Advanced Idioms for Business and Life", "english-advanced-idioms-business-life.mp4"],
  ["49378387-7021-43b7-99a4-8e6a89be9d23", "Advanced Phrasal Verbs: From Tolerating Problems to Giving Opinions", "english-advanced-phrasal-verbs-opinions.mp4"],
  ["102d7dfe-02d5-4a50-a990-2bf6007fd384", "The Subjunctive in English: Yes, It Exists!", "english-subjunctive-square-mobile.mp4"],
  ["727b66e7-5054-4c7d-8e90-6f3feb13080b", "Cleft Sentences: How to Emphasize What Really Matters", "english-cleft-sentences-emphasis.mp4"],
  ["351ecf1e-69f1-456a-94f3-b8bcbbf778d0", "Advanced Inversion for Emphasis: Sound More Powerful in English", "english-advanced-inversion-emphasis.mp4"],
  ["d4f737b5-7cbf-4ba3-b220-1463bbe99f7d", "Humor in English: Sarcasm, Irony, and Puns", "english-humor-sarcasm-irony-puns.mp4"],
  ["0b789554-4ae1-4eef-83bc-308db3d1fed1", "How to Disagree Politely in English", "english-disagree-politely-square-mobile.mp4"],
  ["24529b32-f685-4f14-8b83-d47fd7b60655", "Apologizing Naturally: From \"My Bad\" to \"I Owe You an Apology\"", "english-apologizing-naturally-square-mobile.mp4"],
  ["8a432a95-b2c1-47c7-a387-fcf5d3aed4ab", "Polite Complaints in English", "english-polite-complaints-square-mobile.mp4"],
  ["3e183c53-d3ed-4706-bd1e-be097e3960bb", "Advanced Travel English: Sound Confident at Airports, Hotels, and Restaurants", "english-advanced-travel-square-mobile.mp4"],
  ["c5ada560-df30-421a-86f6-3eed22032972", "How to Tell a Great Anecdote in English", "english-great-anecdote-square-mobile.mp4"],
  ["69894350-832e-401e-bb09-1a83fb685f52", "How to Disagree Politely in English", "english-disagree-politely-alt-square-mobile.mp4"],
  ["5821e4f9-973a-4eb6-820f-cfd282e2f54a", "English for Meetings: Sound Natural in Video Calls", "english-meetings-video-calls-square-mobile.mp4"],
  ["37f0ad73-7f7e-4da5-aa7c-abec1ccc87a3", "Professional Emails in English: Three Phrases You Need at Work", "english-professional-emails-square-mobile.mp4"],
  ["0357effb-4628-47a4-a71d-ad199dd32393", "Small Talk: Start and Keep Conversations Going", "english-small-talk-square-mobile.mp4"],
  ["88cd690e-5994-4688-82f7-4523da8302d9", "How to Start Thinking in English: Practical Techniques That Work", "english-thinking-in-english-square-mobile.mp4"],
  ["5f65b48f-ce5c-48db-8378-41accb7aad79", "Natural Filler Words in English: Sound Fluent Without Overusing Them", "english-natural-filler-words-square-mobile.mp4"],
  ["2812db6a-7dc6-48c1-aadd-ad27383a39f0", "Intonation: Questions, Sarcasm, and Emotion", "english-intonation-questions-sarcasm-emotion-square-mobile.mp4"],
  ["b301cdf1-4687-4d15-b76d-eba3e179f4a3", "Master the Two TH Sounds in English", "english-two-th-sounds-square-mobile.mp4"],
].map(([lessonId, title, fileName]) => ({
  lessonId,
  title,
  fileName,
  filePath: path.join(VIDEO_DIR, fileName),
  videoKey: `lessons/${lessonId}/video.mp4`,
}));

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
      .map((output) => [output.OutputKey, output.OutputValue]),
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
      String(item.LogicalResourceId || "").startsWith("LessonsTable"),
  );
  if (!resource?.PhysicalResourceId) {
    throw new Error("No se pudo resolver LessonsTable. Define LESSONS_TABLE_NAME en .env.");
  }
  return resource.PhysicalResourceId;
}

async function resolveAwsResources(cfClient) {
  const { stackName, outputs } = await resolveOutputsFromStack(cfClient);
  const tableName =
    process.env.LESSONS_TABLE_NAME?.trim() ||
    process.env.LUVA_LESSONS_TABLE?.trim() ||
    (await resolveLessonsTableName(cfClient, stackName));
  const bucketName =
    process.env.ASSETS_BUCKET_NAME?.trim() ||
    process.env.LUVA_ASSETS_BUCKET?.trim() ||
    outputs.get("AssetsBucketName");
  const cloudfrontUrl = process.env.ASSETS_CLOUDFRONT_URL?.trim() || outputs.get("AssetsUrl");

  if (!bucketName) throw new Error("No se pudo resolver AssetsBucketName. Define ASSETS_BUCKET_NAME.");
  if (!cloudfrontUrl) throw new Error("No se pudo resolver AssetsUrl. Define ASSETS_CLOUDFRONT_URL.");

  const cdnBase = cloudfrontUrl.startsWith("http")
    ? cloudfrontUrl.replace(/\/+$/, "")
    : `https://${cloudfrontUrl.replace(/\/+$/, "")}`;

  return { tableName, bucketName, cloudfrontUrl: cdnBase };
}

function buildAssetUrl(cdnBase, key) {
  return `${cdnBase.replace(/\/+$/, "")}/${key}`;
}

async function readGeneratedLessons() {
  if (!fs.existsSync(GENERATED_PATH)) return undefined;
  return JSON.parse(await fsp.readFile(GENERATED_PATH, "utf8"));
}

async function writeGeneratedLessons(data) {
  await fsp.writeFile(GENERATED_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function updateGeneratedLessonsCache(cache, lessonId, videoKey, videoUrl) {
  if (!cache || typeof cache !== "object") return false;
  let changed = false;
  for (const record of Object.values(cache)) {
    const lesson = record?.lesson;
    if (lesson?.lessonId !== lessonId) continue;
    lesson.videoKey = videoKey;
    lesson.videoUrl = videoUrl;
    lesson.status = "ready";
    changed = true;
  }
  return changed;
}

async function getExistingLessons(ddb, tableName) {
  const response = await ddb.send(
    new BatchGetCommand({
      RequestItems: {
        [tableName]: {
          Keys: lessons.map((lesson) => ({ lessonId: lesson.lessonId })),
        },
      },
    }),
  );
  return new Map((response.Responses?.[tableName] || []).map((item) => [item.lessonId, item]));
}

async function uploadVideo(s3, bucketName, lesson) {
  const body = await fsp.readFile(lesson.filePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: lesson.videoKey,
      Body: body,
      ContentType: "video/mp4",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return body.length;
}

async function completeVideo(ddb, tableName, lesson) {
  const now = new Date().toISOString();
  await ddb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { lessonId: lesson.lessonId },
      UpdateExpression: "SET videoKey = :videoKey, #status = :status, updatedAt = :now",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":videoKey": lesson.videoKey,
        ":status": "ready",
        ":now": now,
      },
    }),
  );
  return now;
}

async function main() {
  for (const lesson of lessons) {
    if (!fs.existsSync(lesson.filePath)) {
      throw new Error(`No existe el MP4 local para ${lesson.title}: ${lesson.filePath}`);
    }
  }

  const config = getAwsClientConfig();
  const cf = new CloudFormationClient(config);
  const s3 = new S3Client(config);
  const ddb = DynamoDBDocumentClient.from(new DynamoDBClient(config));
  const { tableName, bucketName, cloudfrontUrl } = await resolveAwsResources(cf);
  const existing = await getExistingLessons(ddb, tableName);
  const cache = await readGeneratedLessons();
  let cacheChanged = false;

  console.log(`Lessons table: ${tableName}`);
  console.log(`Assets bucket: ${bucketName}`);
  console.log(`CDN: ${cloudfrontUrl}`);

  for (const lesson of lessons) {
    const record = existing.get(lesson.lessonId);
    if (!record) {
      throw new Error(`La leccion no existe en DynamoDB: ${lesson.lessonId} ${lesson.title}`);
    }

    const videoUrl = buildAssetUrl(cloudfrontUrl, lesson.videoKey);
    if (record.videoKey === lesson.videoKey) {
      console.log(`SKIP ${lesson.lessonId} ${lesson.title} ya tiene ${lesson.videoKey}`);
      cacheChanged = updateGeneratedLessonsCache(cache, lesson.lessonId, lesson.videoKey, videoUrl) || cacheChanged;
      continue;
    }

    const size = await uploadVideo(s3, bucketName, lesson);
    const updatedAt = await completeVideo(ddb, tableName, lesson);
    cacheChanged = updateGeneratedLessonsCache(cache, lesson.lessonId, lesson.videoKey, videoUrl) || cacheChanged;
    console.log(`OK ${lesson.lessonId} ${lesson.title} -> ${lesson.videoKey} (${Math.round(size / 1024 / 1024)} MB) ${updatedAt}`);
  }

  if (cacheChanged) {
    await writeGeneratedLessons(cache);
    console.log(`Updated ${GENERATED_PATH}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
