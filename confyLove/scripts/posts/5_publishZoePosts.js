const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const dotenv = require("dotenv");
const {
  CloudFormationClient,
  DescribeStacksCommand,
} = require("@aws-sdk/client-cloudformation");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const IMAGES_DIR = "/Users/cardenas/Downloads/zoe";
const PUBLISHED_PATH = path.join(__dirname, "published_zoe.json");
const DEFAULT_STACK_NAME = process.env.LUVA_STACK_NAME || "LuvaStack";
const DEFAULT_REGION = process.env.AWS_REGION || "us-west-2";
const S3_PREFIX = "characterPosts";

const CHARACTER = {
  characterId: "initials:meet_zoe_first_mission",
  storyId: "initials",
  missionId: "meet_zoe_first_mission",
  sceneIndex: 1,
  storyTitle: "Iniciando Conversaciones",
  missionTitle: "Conoce a Zoe",
  characterName: "Zoe",
  avatarImageUrl:
    "https://d2ozl81tz5pxlo.cloudfront.net/storiesProfile/20260509182334-992b19f2-f707-452e-bd38-3d8febf4e92e.png",
};

// Image filename -> { caption, context }. Order = array index + 1.
const POSTS = [
  {
    file: "ChatGPT Image 13 may 2026, 03_30_35 p.m..png",
    caption:
      "Italian pizza just hits different 🍕 honestly I think pizza might be my favorite food ever. what’s yours?",
    context:
      "Zoe is sitting outside at a restaurant in Italy during golden hour, taking a selfie while eating pizza. The atmosphere feels warm, aesthetic and relaxed. She’s casually talking about loving pizza and asking the user about their favorite food.",
  },
  {
    file: "ChatGPT Image 13 may 2026, 03_54_46 p.m..png",
    caption:
      "My soda addiction is actually getting out of control 😭 what’s the one drink you can’t stop buying?",
    context:
      "Zoe is inside a convenience store standing in front of a refrigerator full of colorful sodas. She’s grabbing a drink while smiling at the camera. The vibe is playful and casual, joking about always buying soda.",
  },
  {
    file: "ChatGPT Image 13 may 2026, 03_55_48 p.m..png",
    caption:
      "Went to support Barça today 🍻⚽ stadium atmosphere is honestly insane. have you ever been to a football game?",
    context:
      "Zoe is at a packed FC Barcelona stadium wearing a Barça jersey and holding a beer. It’s nighttime and the crowd is energetic. She’s excited about football and talking about the experience of being at a live match.",
  },
  {
    file: "ChatGPT Image 13 may 2026, 04_16_49 p.m..png",
    caption:
      "Trying to survive another work day with coffee and good vibes ☕ what helps you stay productive?",
    context:
      "Zoe is sitting at her desk working on her laptop inside the cozy Luva office. The place has warm lighting, modern decor and a relaxed startup vibe. She’s talking about work, productivity and daily routines.",
  },
  {
    file: "ChatGPT Image 13 may 2026, 04_21_40 p.m..png",
    caption:
      "Best show ever and I’m ready to defend it 😭⚔️ did you watch Game of Thrones? what did you think about the ending?",
    context:
      "Zoe is sitting on her couch at night watching Game of Thrones on TV with cozy lighting around her living room. She’s relaxed in comfortable clothes and talking about loving the series.",
  },
  {
    file: "ChatGPT Image 13 may 2026, 04_34_49 p.m..png",
    caption:
      "Pilates + iced coffee = productive day ☁️ do you like working out in the mornings?",
    context:
      "Zoe is outside after a pilates session wearing white sporty clothes and sunglasses while holding an iced coffee. The vibe feels healthy, clean girl aesthetic and relaxed.",
  },
  {
    file: "ChatGPT Image 13 may 2026, 04_40_55 p.m..png",
    caption:
      "I swear tennis looks easier on TV 😭 have you ever played?",
    context:
      "Zoe is on a tennis court holding a racket and smiling. She’s dressed in a sporty tennis outfit under warm sunlight. She’s casually talking about trying tennis and having fun.",
  },
  {
    file: "ChatGPT Image 13 may 2026, 05_00_48 p.m..png",
    caption:
      "Okay but why does this Pringles can actually look like a duck 😭",
    context:
      "Zoe is sitting on a boat during the daytime holding a green Pringles can in a playful way like it’s a little duck. The atmosphere is sunny, carefree and funny.",
  },
  {
    file: "ChatGPT Image 13 may 2026, 06_01_27 p.m..png",
    caption:
      "Girls night ✨ honestly I almost stayed home though 😭 do you prefer going out or staying in?",
    context:
      "Zoe is at a party or nightclub at night wearing a black outfit and sunglasses while holding a drink. The vibe is energetic but still casual and relatable.",
  },
  {
    file: "hf_20260513_222815_967b8468-1cc1-49c9-8a72-b61410b17ee5.png",
    caption:
      "Mentally I still live on this boat 🌊 if you could disappear somewhere for a week, where would you go?",
    context:
      "Zoe is on a boat during a sunny day wearing a captain hat and a bikini while smiling at the camera. The ocean and blue sky create a relaxed vacation vibe.",
  },
];

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
  const { Stacks } = await cfClient.send(
    new DescribeStacksCommand({ StackName: DEFAULT_STACK_NAME })
  );
  const outputs = new Map(
    (Stacks?.[0]?.Outputs || [])
      .filter((o) => o.OutputKey && o.OutputValue)
      .map((o) => [o.OutputKey, o.OutputValue])
  );
  return {
    bucketName: bucketName || outputs.get("AssetsBucketName"),
    tableName: tableName || outputs.get("CharacterPostsTableName"),
    cloudfrontUrl: cloudfrontUrl || outputs.get("AssetsUrl"),
  };
}

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
      Metadata: { missionid: missionId, day: String(day) },
    })
  );
  return s3Key;
}

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

async function main() {
  const published = readJsonFile(PUBLISHED_PATH, {});

  const awsConfig = getAwsConfig();
  const cfClient = new CloudFormationClient(awsConfig);
  const s3Client = new S3Client(awsConfig);
  const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient(awsConfig), {
    marshallOptions: { removeUndefinedValues: true },
  });

  const { bucketName, tableName, cloudfrontUrl } = await resolveAwsResources(cfClient);
  const cdnBase = cloudfrontUrl.replace(/\/+$/, "");

  console.log(`Bucket:  ${bucketName}`);
  console.log(`Tabla:   ${tableName}`);
  console.log(`CDN:     ${cdnBase}`);
  console.log(`Posts:   ${POSTS.length} | Ya publicados: ${Object.keys(published).length}\n`);

  let ok = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < POSTS.length; i += 1) {
    const day = i + 1;
    const jobKey = `${CHARACTER.missionId}__day${String(day).padStart(2, "0")}`;

    if (published[jobKey]) {
      console.log(`[SKIP] ${jobKey}: ya publicado`);
      skipped += 1;
      continue;
    }

    const post = POSTS[i];
    const imagePath = path.join(IMAGES_DIR, post.file);
    if (!fs.existsSync(imagePath)) {
      console.log(`[ERROR] ${jobKey}: imagen no encontrada -> ${imagePath}`);
      errors += 1;
      continue;
    }

    console.log(`[${jobKey}]`);
    console.log(`  imagen:  ${post.file}`);
    console.log(`  caption: ${post.caption.slice(0, 60)}...`);

    let s3Key;
    try {
      process.stdout.write(`  upload S3... `);
      s3Key = await uploadToS3(s3Client, bucketName, imagePath, CHARACTER.missionId, day);
      console.log(`ok -> ${s3Key}`);
    } catch (error) {
      console.log(`ERROR: ${error.message}`);
      errors += 1;
      continue;
    }

    const imageUrl = `${cdnBase}/${s3Key}`;
    const now = new Date().toISOString();
    const postId = randomUUID();

    const record = {
      characterId: CHARACTER.characterId,
      postId,
      storyId: CHARACTER.storyId,
      missionId: CHARACTER.missionId,
      sceneIndex: CHARACTER.sceneIndex,
      storyTitle: CHARACTER.storyTitle,
      missionTitle: CHARACTER.missionTitle,
      characterName: CHARACTER.characterName,
      avatarImageUrl: CHARACTER.avatarImageUrl,
      caption: post.caption,
      context: post.context,
      ...(post.conversationNarration ? { conversationNarration: post.conversationNarration } : {}),
      ...(post.initialMessage ? { initialMessage: post.initialMessage } : {}),
      imageUrl,
      order: day,
      createdAt: now,
      updatedAt: now,
    };

    try {
      process.stdout.write(`  dynamo put... `);
      await dynamo.send(
        new PutCommand({
          TableName: tableName,
          Item: record,
          ConditionExpression:
            "attribute_not_exists(characterId) AND attribute_not_exists(postId)",
        })
      );
      console.log(`ok (postId: ${postId})`);
    } catch (error) {
      console.log(`ERROR: ${error.message}`);
      errors += 1;
      continue;
    }

    published[jobKey] = { postId, imageUrl, s3Key, publishedAt: now };
    writeJsonFile(PUBLISHED_PATH, published);
    ok += 1;
    console.log();
  }

  console.log(`\nListo. Publicados: ${ok} | Saltados: ${skipped} | Errores: ${errors}`);
  console.log(`Registro: ${PUBLISHED_PATH}`);
}

main().catch((error) => {
  const detail = error.response?.data ?? error.message;
  console.error("Error:", typeof detail === "object" ? JSON.stringify(detail, null, 2) : detail);
  process.exit(1);
});
