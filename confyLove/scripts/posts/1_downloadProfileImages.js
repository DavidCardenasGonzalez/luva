const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { pipeline } = require("stream/promises");
const { URL } = require("url");
const axios = require("axios");

const STORIES_SEED_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "backend",
  "src",
  "data",
  "stories-seed.ts"
);
const OUTPUT_DIR = path.join(__dirname, "profilesImages");

function getQuotedValue(block, key) {
  const match = block.match(new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`));
  return match ? match[1] : null;
}

function getExtensionFromUrl(imageUrl) {
  try {
    const { pathname } = new URL(imageUrl);
    const extension = path.extname(pathname).toLowerCase();

    if (extension) {
      return extension;
    }
  } catch (_error) {
    // The URL is validated by axios later; use a safe default here.
  }

  return ".png";
}

function getMissionsWithAvatarImages(seedContent) {
  const missionBlocks = seedContent.match(/\{\s*missionId\s*:[\s\S]*?\n\s*\},/g) || [];

  return missionBlocks
    .map((block) => {
      const missionId = getQuotedValue(block, "missionId");
      const avatarImageUrl = getQuotedValue(block, "avatarImageUrl");

      if (!missionId || !avatarImageUrl) {
        return null;
      }

      return { missionId, avatarImageUrl };
    })
    .filter(Boolean);
}

async function downloadImage({ missionId, avatarImageUrl }) {
  const extension = getExtensionFromUrl(avatarImageUrl);
  const outputPath = path.join(OUTPUT_DIR, `${missionId}-profile${extension}`);

  const response = await axios.get(avatarImageUrl, {
    responseType: "stream",
    timeout: 60000,
  });

  await pipeline(response.data, fs.createWriteStream(outputPath));
  return outputPath;
}

async function main() {
  const seedContent = await fsp.readFile(STORIES_SEED_PATH, "utf8");
  const missions = getMissionsWithAvatarImages(seedContent);

  if (missions.length === 0) {
    throw new Error(
      `No encontre misiones con missionId y avatarImageUrl en ${STORIES_SEED_PATH}`
    );
  }

  await fsp.mkdir(OUTPUT_DIR, { recursive: true });

  console.log(`Descargando ${missions.length} imagenes en ${OUTPUT_DIR}`);

  let downloaded = 0;
  let failed = 0;

  for (const mission of missions) {
    try {
      const outputPath = await downloadImage(mission);
      downloaded += 1;
      console.log(`[OK] ${mission.missionId} -> ${outputPath}`);
    } catch (error) {
      failed += 1;
      console.error(
        `[ERROR] ${mission.missionId}: ${error.message || String(error)}`
      );
    }
  }

  console.log(`Listo. Descargadas: ${downloaded}. Fallidas: ${failed}.`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
