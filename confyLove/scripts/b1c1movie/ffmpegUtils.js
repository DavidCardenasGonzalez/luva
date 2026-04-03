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
  const result = spawnSync(ffmpegPath, args, {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "ffmpeg fallo");
  }
}

module.exports = {
  findFfmpegPath,
  runFfmpeg,
};
