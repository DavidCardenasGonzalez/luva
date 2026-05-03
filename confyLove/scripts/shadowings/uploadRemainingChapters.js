const fs = require("fs");
const path = require("path");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const LIST_ID = "61356926-bb1d-46a5-9b78-4fe348c5c05f";
const API_BASE = "https://45vwgzmxke.execute-api.us-west-2.amazonaws.com/prod/v1";
const DIR = __dirname;

const CHAPTERS = [
  { order: 3,  title: "The First Real Date",               file: "shadowing-dialogue-03-the-first-real-date.mp3" },
  { order: 4,  title: "All Summer Long",                   file: "shadowing-dialogue-04-all-summer-long.mp3" },
  { order: 5,  title: "The Wrong Family",                  file: "shadowing-dialogue-05-the-wrong-family.mp3" },
  { order: 6,  title: "The Last Night",                    file: "shadowing-dialogue-06-the-last-night.mp3" },
  { order: 7,  title: "Three Hundred and Sixty-Five Letters", file: "shadowing-dialogue-07-three-hundred-and-sixty-five-letters.mp3" },
  { order: 8,  title: "Lon Hammond",                       file: "shadowing-dialogue-08-lon-hammond.mp3" },
  { order: 9,  title: "The Old House in the Paper",        file: "shadowing-dialogue-09-the-old-house-in-the-paper.mp3" },
  { order: 10, title: "The Reunion",                       file: "shadowing-dialogue-10-the-reunion.mp3" },
  { order: 11, title: "In the Rain",                       file: "shadowing-dialogue-11-in-the-rain.mp3" },
  { order: 12, title: "The Choice",                        file: "shadowing-dialogue-12-the-choice.mp3" },
  { order: 13, title: "A Love That Never Ends",            file: "shadowing-dialogue-13-a-love-that-never-ends.mp3" },
];

function getToken() {
  const token = process.env.LUVA_ADMIN_JWT_TOKEN;
  if (!token?.trim()) {
    throw new Error(
      "LUVA_ADMIN_JWT_TOKEN no está configurado.\n" +
      "Agrégalo al archivo confyLove/scripts/.env:\n" +
      "  LUVA_ADMIN_JWT_TOKEN=eyJhbGci...\n\n" +
      "Puedes obtenerlo en Chrome DevTools:\n" +
      "  1. Abre el admin portal y ve a cualquier sección de shadowings\n" +
      "  2. DevTools > Network > cualquier request al API > Headers > Authorization\n" +
      "  3. Copia el token (sin el 'Bearer ' del inicio)"
    );
  }
  return token.trim();
}

function headers(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function summarizeError(error) {
  const data = error.response?.data;
  if (!data) return error.message;
  if (typeof data === "string") return data.slice(0, 400);
  return JSON.stringify(data).slice(0, 400);
}

async function post(token, endpoint, body) {
  try {
    const { data } = await axios.post(`${API_BASE}${endpoint}`, body, {
      headers: headers(token),
      timeout: 30000,
    });
    return data;
  } catch (error) {
    throw new Error(`POST ${endpoint}: ${summarizeError(error)}`);
  }
}

async function uploadChapter(token, chapter) {
  const audioPath = path.join(DIR, chapter.file);
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Archivo no encontrado: ${chapter.file}`);
  }

  console.log(`\n[${chapter.order}/13] ${chapter.title}`);

  // 1. Create chapter
  const { chapter: created } = await post(token, "/admin/shadowing/chapters", {
    listId: LIST_ID,
    title: chapter.title,
    order: chapter.order,
    description: "",
  });
  console.log(`  Capítulo creado: ${created.chapterId}`);

  // 2. Get signed upload URL
  const uploadData = await post(token, "/admin/shadowing/chapters/audio-upload", {
    listId: LIST_ID,
    chapterId: created.chapterId,
    kind: "audio",
    contentType: "audio/mpeg",
    fileName: chapter.file,
  });

  // 3. Upload to S3
  const fileBuffer = fs.readFileSync(audioPath);
  const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(1);
  console.log(`  Subiendo ${fileSizeMB} MB...`);
  try {
    await axios.put(uploadData.uploadUrl, fileBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": uploadData.cacheControl || "public, max-age=31536000, immutable",
      },
      timeout: 300000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  } catch (error) {
    throw new Error(`S3 upload falló: ${summarizeError(error)}`);
  }

  // 4. Complete upload
  const { chapter: ready } = await post(token, "/admin/shadowing/chapters/audio-complete", {
    listId: LIST_ID,
    chapterId: created.chapterId,
    kind: "audio",
    audioKey: uploadData.key,
  });

  console.log(`  Listo: status=${ready.status} audioUrl=${ready.audioUrl}`);
  return ready;
}

async function main() {
  const token = getToken();
  const failures = [];

  console.log(`Subiendo ${CHAPTERS.length} capítulos a la lista: ${LIST_ID}`);

  for (const chapter of CHAPTERS) {
    try {
      await uploadChapter(token, chapter);
    } catch (error) {
      console.error(`  ERROR: ${error.message}`);
      failures.push({ chapter, error: error.message });
    }
  }

  console.log(`\n=== Resultado ===`);
  console.log(`Exitosos: ${CHAPTERS.length - failures.length}/${CHAPTERS.length}`);

  if (failures.length > 0) {
    console.error(`Fallidos:`);
    failures.forEach(({ chapter, error }) =>
      console.error(`  - [${chapter.order}] ${chapter.title}: ${error}`)
    );
    process.exitCode = 1;
  } else {
    console.log(`Todos los capítulos subidos correctamente.`);
  }
}

main().catch((error) => {
  console.error("Error fatal:", error.message);
  process.exit(1);
});
