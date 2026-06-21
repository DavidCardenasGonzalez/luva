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

const IMAGES_DIR = "/Users/cardenas/Downloads/mateo";
const PUBLISHED_PATH = path.join(__dirname, "published_mateo.json");
const DEFAULT_STACK_NAME = process.env.LUVA_STACK_NAME || "LuvaStack";
const DEFAULT_REGION = process.env.AWS_REGION || "us-west-2";
const S3_PREFIX = "characterPosts";

const CHARACTER = {
  characterId: "initials:meet_mateo_first_mission",
  storyId: "initials",
  missionId: "meet_mateo_first_mission",
  sceneIndex: 0,
  storyTitle: "Iniciando Conversaciones",
  missionTitle: "Conoce a Mateo",
  characterName: "Mateo",
  avatarImageUrl:
    "https://d2ozl81tz5pxlo.cloudfront.net/storiesProfile/20260509182223-f7ef4b5b-9f42-41d3-b537-b83fc1e3db17.png",
};

const POSTS = [
  {
    file: "ChatGPT Image 14 may 2026, 01_01_39 a.m..png",
    caption:
      "Live music just hits different 🎶 what’s the best concert you’ve ever been to?",
    context:
      "Mateo is walking through a music festival or concert during sunset wearing casual summer clothes. There are crowds, lights and a lively atmosphere around him. He’s talking about how much he loves live music and asking the user about their favorite concert experience.",
  },
  {
    file: "ChatGPT Image 14 may 2026, 01_01_47 a.m..png",
    caption: "Okay serious question… do you prefer going out or staying home? 🍷",
    context:
      "Mateo is sitting at a nighttime dinner or lounge holding a glass of wine and smiling at the camera. The atmosphere feels elegant but relaxed, like a night out with friends.",
  },
  {
    file: "ChatGPT Image 14 may 2026, 01_04_33 a.m..png",
    caption:
      "I genuinely think dogs make life 10x better 🐶 do you have a pet?",
    context:
      "Mateo is sitting in a field during golden hour hugging his golden retriever. The vibe is warm, emotional and peaceful. He’s talking about loving dogs and asking the user about pets.",
  },
  {
    file: "ChatGPT Image 14 may 2026, 01_06_54 a.m..png",
    caption:
      "Always somewhere on the road 🚗 do you enjoy long drives or do you get bored fast?",
    context:
      "Mateo is sitting in a vintage green car parked outside surrounded by plants and warm sunlight. The mood feels adventurous and relaxed, like someone who enjoys road trips and spontaneous plans.",
  },
  {
    file: "ChatGPT Image 14 may 2026, 01_07_01 a.m..png",
    caption:
      "Weddings are fun until they start forcing you to dance 😭 have you ever been to a crazy wedding?",
    context:
      "Mateo is dressed in a formal gray suit standing outside a rustic wedding venue. He’s attending a friend’s wedding and joking about wedding parties and dancing.",
  },
  {
    file: "ChatGPT Image 14 may 2026, 01_07_09 a.m..png",
    caption:
      "Trying to stay consistent at the gym even when I don’t feel like going 💀 do you work out?",
    context:
      "Mateo is at the gym holding weights during a workout session. The atmosphere is dark and focused. He’s talking casually about discipline and motivation.",
  },
  {
    file: "ChatGPT Image 14 may 2026, 01_07_22 a.m..png",
    caption:
      "Mentally I’m still on this boat 🌊 if you could disappear somewhere right now, where would you go?",
    context:
      "Mateo is relaxing shirtless on a small boat in the ocean during a sunny afternoon. The atmosphere feels carefree, tropical and peaceful.",
  },
  {
    file: "ChatGPT Image 14 may 2026, 01_07_51 a.m..png",
    caption:
      "Riding a camel in Morocco was definitely not on my bingo card 😭 what’s the most random thing you’ve done while traveling?",
    context:
      "Mateo is in Morocco during sunset riding a camel through a desert area with warm orange lighting and mountains in the background. He’s talking about travel experiences and funny unexpected moments.",
  },
  {
    file: "ChatGPT Image 14 may 2026, 01_07_58 a.m..png",
    caption:
      "Camping nights make you forget about your phone for a while 🔥 have you ever gone camping?",
    context:
      "Mateo is sitting next to a campfire in the woods at night wearing cozy outdoor clothes. The atmosphere feels calm, reflective and warm.",
  },
  {
    file: "ChatGPT Image 14 may 2026, 01_08_11 a.m..png",
    caption:
      "Beach days automatically improve my mood ☀️ are you more of a beach person or mountain person?",
    context:
      "Mateo is sitting shirtless on the beach during sunset smiling at the camera. The mood is relaxed, attractive and summery.",
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
