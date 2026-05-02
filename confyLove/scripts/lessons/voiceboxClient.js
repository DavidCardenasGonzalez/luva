const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const axios = require("axios");

const DEFAULT_BASE_URL = "http://127.0.0.1:17493";
const DEFAULT_PROFILE_NAME = "Elearning";
const DEFAULT_ENGINE = "qwen";
const DEFAULT_MODEL_SIZE = "1.7B";
const DEFAULT_LANGUAGE = "en";
const DEFAULT_INSTRUCT =
  "Instructional e-learning. Calm, deliberate pacing with natural pauses for clarity. Tone is authoritative, accessible, and articulate.";

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
}

function parseOptionalInt(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalBool(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "n"].includes(normalized)) return false;
  return undefined;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class VoiceboxGenerationPendingError extends Error {
  constructor(generationId, timeoutMs) {
    super(`VOICEBOX_GENERATION_PENDING: ${generationId}`);
    this.name = "VoiceboxGenerationPendingError";
    this.code = "VOICEBOX_GENERATION_PENDING";
    this.generationId = generationId;
    this.timeoutMs = timeoutMs;
  }
}

function getVoiceboxConfig(overrides = {}) {
  return {
    baseUrl: normalizeBaseUrl(overrides.baseUrl || process.env.VOICEBOX_BASE_URL),
    profileId: overrides.profileId || process.env.VOICEBOX_PROFILE_ID,
    profileName: overrides.profileName || process.env.VOICEBOX_PROFILE_NAME || DEFAULT_PROFILE_NAME,
    engine: overrides.engine || process.env.VOICEBOX_ENGINE || DEFAULT_ENGINE,
    modelSize: overrides.modelSize || process.env.VOICEBOX_MODEL_SIZE || DEFAULT_MODEL_SIZE,
    language: overrides.language || process.env.VOICEBOX_LANGUAGE || DEFAULT_LANGUAGE,
    instruct: overrides.instruct || process.env.VOICEBOX_INSTRUCT || DEFAULT_INSTRUCT,
    maxChunkChars:
      parseOptionalInt(overrides.maxChunkChars) ??
      parseOptionalInt(process.env.VOICEBOX_MAX_CHUNK_CHARS) ??
      800,
    crossfadeMs:
      parseOptionalInt(overrides.crossfadeMs) ??
      parseOptionalInt(process.env.VOICEBOX_CROSSFADE_MS) ??
      50,
    normalize:
      parseOptionalBool(overrides.normalize) ??
      parseOptionalBool(process.env.VOICEBOX_NORMALIZE) ??
      true,
    seed: parseOptionalInt(overrides.seed) ?? parseOptionalInt(process.env.VOICEBOX_SEED),
    timeoutMs:
      parseOptionalInt(overrides.timeoutMs) ??
      parseOptionalInt(process.env.VOICEBOX_TIMEOUT_MS) ??
      10800000,
    pollIntervalMs:
      parseOptionalInt(overrides.pollIntervalMs) ??
      parseOptionalInt(process.env.VOICEBOX_POLL_INTERVAL_MS) ??
      1000,
  };
}

function extractProfiles(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.value)) return data.value;
  if (Array.isArray(data?.profiles)) return data.profiles;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

async function listProfiles(config = getVoiceboxConfig()) {
  const { data } = await axios.get(`${config.baseUrl}/profiles`, {
    timeout: config.timeoutMs,
  });
  return extractProfiles(data);
}

async function resolveProfile(config = getVoiceboxConfig()) {
  const profiles = await listProfiles(config);

  if (config.profileId) {
    const byId = profiles.find((profile) => profile?.id === config.profileId);
    return byId || { id: config.profileId, name: config.profileName, language: config.language };
  }

  const wanted = String(config.profileName || "").trim().toLowerCase();
  const exact = profiles.find((profile) => String(profile?.name || "").trim().toLowerCase() === wanted);
  const partial = profiles.find((profile) => String(profile?.name || "").trim().toLowerCase().includes(wanted));
  const profile = exact || partial;

  if (!profile?.id) {
    const available = profiles.map((item) => item?.name).filter(Boolean).join(", ");
    throw new Error(
      `Voicebox profile not found: ${config.profileName}. Available profiles: ${available || "none"}`
    );
  }

  return profile;
}

function buildGenerationPayload(text, profile, config) {
  const payload = {
    profile_id: profile.id,
    text,
    language: config.language || profile.language || DEFAULT_LANGUAGE,
    model_size: config.modelSize,
    engine: config.engine,
    instruct: config.instruct,
    max_chunk_chars: config.maxChunkChars,
    crossfade_ms: config.crossfadeMs,
    normalize: config.normalize,
  };

  if (config.seed !== undefined) payload.seed = config.seed;

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function summarizeAxiosError(error) {
  const data = error.response?.data;
  if (!data) return error.message;
  if (Buffer.isBuffer(data)) return data.toString("utf8").slice(0, 1000);
  if (typeof data === "string") return data.slice(0, 1000);
  return JSON.stringify(data).slice(0, 1000);
}

async function requestGeneration(text, profile, config = getVoiceboxConfig()) {
  const payload = buildGenerationPayload(text, profile, config);

  try {
    const { data } = await axios.post(`${config.baseUrl}/generate`, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: config.timeoutMs,
    });
    if (typeof config.onGeneration === "function") config.onGeneration(data);
    return data;
  } catch (error) {
    throw new Error(`Voicebox generate failed: ${summarizeAxiosError(error)}`);
  }
}

async function getGenerationHistory(generationId, config = getVoiceboxConfig()) {
  const { data } = await axios.get(`${config.baseUrl}/history/${encodeURIComponent(generationId)}`, {
    timeout: Math.min(config.timeoutMs, 30000),
  });
  return data;
}

async function findGenerationByExactText(text, config = getVoiceboxConfig(), profile) {
  const params = { limit: 50 };
  if (profile?.id) params.profile_id = profile.id;

  const { data } = await axios.get(`${config.baseUrl}/history`, {
    params,
    timeout: Math.min(config.timeoutMs, 30000),
  });

  const items = Array.isArray(data?.items) ? data.items : [];
  return items.find((item) => {
    if (item?.profile_id && profile?.id && item.profile_id !== profile.id) return false;
    if (String(item?.text || "") !== String(text || "")) return false;
    return !["failed", "error", "cancelled", "canceled"].includes(String(item?.status || "").toLowerCase());
  });
}

async function waitForGenerationComplete(generation, config = getVoiceboxConfig()) {
  if (!generation?.id) {
    throw new Error("Voicebox generation did not return an id.");
  }

  let current = generation;
  const startedAt = Date.now();

  while (Date.now() - startedAt <= config.timeoutMs) {
    const status = String(current?.status || "").toLowerCase();
    if (typeof config.onStatus === "function") config.onStatus(current);
    if (status === "completed") return current;
    if (["failed", "error", "cancelled", "canceled"].includes(status)) {
      throw new Error(current?.error || `Voicebox generation ended with status: ${current.status}`);
    }

    await sleep(config.pollIntervalMs);

    try {
      current = await getGenerationHistory(generation.id, config);
    } catch (error) {
      current = generation;
    }
  }

  throw new VoiceboxGenerationPendingError(generation.id, config.timeoutMs);
}

async function downloadGeneratedAudio(generation, config = getVoiceboxConfig()) {
  if (!generation?.id) {
    throw new Error("Voicebox generation did not return an id.");
  }

  try {
    const response = await axios.get(`${config.baseUrl}/audio/${encodeURIComponent(generation.id)}`, {
      responseType: "arraybuffer",
      timeout: config.timeoutMs,
      validateStatus: () => true,
    });

    const contentType = String(response.headers?.["content-type"] || "");
    const buffer = Buffer.from(response.data);

    if (response.status >= 400) {
      throw new Error(buffer.toString("utf8").slice(0, 1000));
    }

    if (/application\/json/i.test(contentType)) {
      const parsed = JSON.parse(buffer.toString("utf8"));
      if (parsed?.audio_path) {
        return readLocalAudioPath(parsed.audio_path, contentType);
      }
      throw new Error(`Voicebox audio endpoint returned JSON: ${JSON.stringify(parsed).slice(0, 1000)}`);
    }

    return { buffer, contentType: contentType || contentTypeFromPath(generation.audio_path) || "audio/wav" };
  } catch (error) {
    if (generation.audio_path) {
      return readLocalAudioPath(generation.audio_path);
    }
    throw new Error(`Voicebox audio download failed: ${error.message}`);
  }
}

function readLocalAudioPath(audioPath, fallbackContentType) {
  const resolved = path.resolve(audioPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Voicebox audio path does not exist: ${resolved}`);
  }
  return {
    buffer: fs.readFileSync(resolved),
    contentType: fallbackContentType || contentTypeFromPath(resolved) || "audio/wav",
  };
}

function contentTypeFromPath(filePath) {
  const ext = path.extname(String(filePath || "")).toLowerCase();
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".m4a") return "audio/mp4";
  if (ext === ".ogg") return "audio/ogg";
  if (ext === ".flac") return "audio/flac";
  if (ext === ".wav" || ext === ".wave") return "audio/wav";
  return undefined;
}

function resolveAudioExtension(contentType, audioPath) {
  const ext = path.extname(String(audioPath || "")).replace(".", "").toLowerCase();
  if (ext) return ext === "wave" ? "wav" : ext;

  const normalized = String(contentType || "").toLowerCase();
  if (normalized.includes("mpeg")) return "mp3";
  if (normalized.includes("mp4")) return "m4a";
  if (normalized.includes("ogg")) return "ogg";
  if (normalized.includes("flac")) return "flac";
  return "wav";
}

async function generateSpeechToBuffer(text, overrides = {}) {
  const config = { ...getVoiceboxConfig(overrides), ...overrides };
  const profile = overrides.profile || (await resolveProfile(config));
  let generation;

  if (overrides.generationId) {
    generation = await getGenerationHistory(overrides.generationId, config);
    if (typeof config.onGeneration === "function") config.onGeneration(generation);
  } else if (overrides.reuseExisting !== false) {
    generation = await findGenerationByExactText(text, config, profile);
    if (generation && typeof config.onGeneration === "function") config.onGeneration(generation);
  }

  if (!generation) {
    generation = await requestGeneration(text, profile, config);
  }

  const completedGeneration = await waitForGenerationComplete(generation, config);
  const audio = await downloadGeneratedAudio(completedGeneration, config);

  return {
    profile,
    generation: completedGeneration,
    buffer: audio.buffer,
    contentType: audio.contentType || "audio/wav",
    extension: resolveAudioExtension(audio.contentType, completedGeneration.audio_path),
    config,
  };
}

async function writeGeneratedSpeech(outputPath, text, overrides = {}) {
  const result = await generateSpeechToBuffer(text, overrides);
  await fsp.mkdir(path.dirname(outputPath), { recursive: true });
  await fsp.writeFile(outputPath, result.buffer);
  return { ...result, outputPath };
}

module.exports = {
  getVoiceboxConfig,
  listProfiles,
  resolveProfile,
  generateSpeechToBuffer,
  writeGeneratedSpeech,
  resolveAudioExtension,
  waitForGenerationComplete,
  getGenerationHistory,
  findGenerationByExactText,
  VoiceboxGenerationPendingError,
};
