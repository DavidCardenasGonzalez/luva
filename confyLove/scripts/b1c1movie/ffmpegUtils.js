const ffmpegStatic = require("ffmpeg-static");
const { spawnSync } = require("child_process");

function findFfmpegPath() {
  if (ffmpegStatic) {
    return ffmpegStatic;
  }

  if (process.env.FFMPEG_PATH) {
    return process.env.FFMPEG_PATH;
  }

  const whereResult = spawnSync("where.exe", ["ffmpeg"], { encoding: "utf8" });
  if (whereResult.status === 0) {
    const match = whereResult.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);

    if (match) {
      return match;
    }
  }

  const commonPaths = [
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\tools\\ffmpeg\\bin\\ffmpeg.exe",
  ];

  for (const candidate of commonPaths) {
    const result = spawnSync(
      "powershell",
      ["-NoProfile", "-Command", `Test-Path '${candidate}'`],
      {
        encoding: "utf8",
      }
    );

    if (result.stdout.trim().toLowerCase() === "true") {
      return candidate;
    }
  }

  throw new Error(
    'No encontre ffmpeg. Instala ffmpeg o define la variable de entorno FFMPEG_PATH'
  );
}

function runFfmpeg(ffmpegPath, args) {
  const result = spawnSync(ffmpegPath, ["-hide_banner", "-loglevel", "error", ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: "pipe",
    windowsHide: true,
  });

  if (result.error) {
    const details = [result.error.message, result.stderr, result.stdout].filter(Boolean).join("\n");
    throw new Error(details || "ffmpeg fallo");
  }

  if (result.status !== 0) {
    const details = [result.stderr, result.stdout]
      .filter(Boolean)
      .map((value) => value.trim())
      .filter(Boolean)
      .join("\n");
    throw new Error(details || `ffmpeg fallo con codigo ${result.status}`);
  }
}

function getAudioDurationSeconds(ffmpegPath, filePath) {
  const result = spawnSync(ffmpegPath, ["-hide_banner", "-i", filePath, "-f", "null", "-"], {
    encoding: "utf8",
    stdio: "pipe",
    windowsHide: true,
  });
  const match = (result.stderr || "").match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const [, h, m, s] = match;
  return Math.round(Number(h) * 3600 + Number(m) * 60 + Number(s));
}

module.exports = {
  findFfmpegPath,
  runFfmpeg,
  getAudioDurationSeconds,
};
