const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getAudioDurationSeconds } = require("../b1c1movie/ffmpegUtils");

const WHISPER_MODEL = "whisper-1";

// ── API config ──────────────────────────────────────────────────────────────

function getApiConfig() {
  const apiUrl = process.env.LUVA_ADMIN_API_URL;
  const token = process.env.LUVA_ADMIN_JWT_TOKEN;
  if (!apiUrl?.trim()) throw new Error("LUVA_ADMIN_API_URL is not set in .env");
  if (!token?.trim()) throw new Error("LUVA_ADMIN_JWT_TOKEN is not set in .env");
  return {
    baseUrl: apiUrl.trim().replace(/\/+$/, ""),
    headers: { Authorization: `Bearer ${token.trim()}`, "Content-Type": "application/json" },
  };
}

function getOpenAiKey() {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (!key?.trim()) throw new Error("OPENAI_API_KEY is not set in .env");
  return key.trim();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function audioContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".m4a") return "audio/mp4";
  if (ext === ".ogg") return "audio/ogg";
  return "audio/wav";
}

function summarizeAxiosError(error) {
  const data = error.response?.data;
  if (!data) return error.message;
  if (Buffer.isBuffer(data)) return data.toString("utf8").slice(0, 500);
  if (typeof data === "string") return data.slice(0, 500);
  return JSON.stringify(data).slice(0, 500);
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
    .map((seg, i) =>
      [i + 1, `${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}`, seg.text.trim(), ""].join("\n")
    )
    .join("\n");
}

// ── Low-level API calls ──────────────────────────────────────────────────────

async function apiPost(config, endpoint, body) {
  try {
    const { data } = await axios.post(`${config.baseUrl}${endpoint}`, body, {
      headers: config.headers,
      timeout: 30000,
    });
    return data;
  } catch (error) {
    throw new Error(`POST ${endpoint}: ${summarizeAxiosError(error)}`);
  }
}

async function apiGet(config, endpoint) {
  try {
    const { data } = await axios.get(`${config.baseUrl}${endpoint}`, {
      headers: config.headers,
      timeout: 30000,
    });
    return data;
  } catch (error) {
    throw new Error(`GET ${endpoint}: ${summarizeAxiosError(error)}`);
  }
}

// ── Whisper transcription ────────────────────────────────────────────────────

async function transcribeToSrt(audioPath) {
  const apiKey = getOpenAiKey();
  const audioBuffer = fs.readFileSync(audioPath);
  const contentType = audioContentType(audioPath);

  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: contentType });
  form.append("file", blob, path.basename(audioPath));
  form.append("model", process.env.WHISPER_MODEL || WHISPER_MODEL);
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
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

// ── Shadowing API calls ──────────────────────────────────────────────────────

async function ensureList(config, { listName, category, order = 1 }) {
  const catalog = await apiGet(config, "/v1/admin/shadowing");
  const existing = (catalog?.lists || []).find((l) => l.name === listName);

  if (existing) {
    console.log(`List already exists: ${existing.listId} (${existing.name})`);
    return existing;
  }

  const result = await apiPost(config, "/v1/admin/shadowing/lists", { name: listName, category, order });
  console.log(`Created list: ${result.list.listId} (${result.list.name})`);
  return result.list;
}

async function createChapter(config, listId, { title, order, description, durationSeconds }) {
  const body = { listId, title, order, description: description || "" };
  if (durationSeconds != null && durationSeconds > 0) body.durationSeconds = durationSeconds;
  const result = await apiPost(config, "/v1/admin/shadowing/chapters", body);
  return result.chapter;
}

async function uploadAudio(config, listId, chapterId, audioPath) {
  const contentType = audioContentType(audioPath);

  const uploadData = await apiPost(config, "/v1/admin/shadowing/chapters/audio-upload", {
    listId,
    chapterId,
    kind: "audio",
    contentType,
    fileName: path.basename(audioPath),
  });

  const fileBuffer = fs.readFileSync(audioPath);
  try {
    await axios.put(uploadData.uploadUrl, fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": uploadData.cacheControl || "public, max-age=31536000, immutable",
      },
      timeout: 300000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  } catch (error) {
    throw new Error(`S3 audio upload failed: ${summarizeAxiosError(error)}`);
  }

  const completeData = await apiPost(config, "/v1/admin/shadowing/chapters/audio-complete", {
    listId,
    chapterId,
    kind: "audio",
    audioKey: uploadData.key,
  });

  return completeData.chapter;
}

async function uploadSubtitles(config, listId, chapterId, srtContent) {
  const contentType = "application/x-subrip";

  const uploadData = await apiPost(config, "/v1/admin/shadowing/chapters/subtitles-upload", {
    listId,
    chapterId,
    contentType,
    fileName: "subtitles.srt",
  });

  try {
    await axios.put(uploadData.uploadUrl, Buffer.from(srtContent, "utf-8"), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": uploadData.cacheControl || "public, max-age=31536000, immutable",
      },
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  } catch (error) {
    throw new Error(`S3 subtitles upload failed: ${summarizeAxiosError(error)}`);
  }

  const completeData = await apiPost(config, "/v1/admin/shadowing/chapters/subtitles-complete", {
    listId,
    chapterId,
    subtitlesKey: uploadData.key,
  });

  return completeData.chapter;
}

// ── Main publish flow ────────────────────────────────────────────────────────

async function publishShadowingCatalog(listMeta, jobs, { ffmpegPath, subtitles = true } = {}) {
  const config = getApiConfig();

  console.log(`\nPublishing to shadowing catalog...`);
  const list = await ensureList(config, {
    listName: listMeta.listName,
    category: listMeta.category,
    order: listMeta.order || 1,
  });

  const failures = [];

  for (const job of jobs) {
    if (!fs.existsSync(job.outputPath)) {
      console.warn(`Skip chapter ${job.index + 1}: audio not found at ${job.outputPath}`);
      continue;
    }

    const title = job.dialogueData.title || job.slug;
    const order = job.dialogueData.chapter || job.index + 1;
    const description = job.dialogueData.description || "";
    const durationSeconds = ffmpegPath ? getAudioDurationSeconds(ffmpegPath, job.outputPath) : undefined;
    const fileSizeMB = (fs.statSync(job.outputPath).size / 1024 / 1024).toFixed(1);

    console.log(`\nChapter ${order}: ${title}${durationSeconds != null ? ` (${durationSeconds}s)` : ""}`);

    try {
      const chapter = await createChapter(config, list.listId, { title, order, description, durationSeconds });

      console.log(`  Uploading audio ${fileSizeMB} MB...`);
      const ready = await uploadAudio(config, list.listId, chapter.chapterId, job.outputPath);
      console.log(`  Audio ready: ${ready.chapterId}`);

      if (subtitles) {
        console.log(`  Transcribing with Whisper...`);
        const srt = await transcribeToSrt(job.outputPath);

        const srtPath = job.outputPath.replace(/\.[^.]+$/, ".srt");
        fs.writeFileSync(srtPath, srt, "utf-8");
        console.log(`  SRT saved: ${path.basename(srtPath)}`);

        const withSubs = await uploadSubtitles(config, list.listId, ready.chapterId, srt);
        console.log(`  Subtitles: ${withSubs.subtitlesUrl}`);
      }
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
