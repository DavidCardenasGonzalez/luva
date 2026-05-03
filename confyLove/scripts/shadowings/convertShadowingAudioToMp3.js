const fs = require("fs");
const path = require("path");

const { findFfmpegPath, runFfmpeg } = require("../b1c1movie/ffmpegUtils");

const DEFAULT_INPUT = path.join(__dirname, "shadowing-dialogue*.wav");
const DEFAULT_BITRATE = "192k";

function parseArgs(argv) {
  const options = {
    input: DEFAULT_INPUT,
    outputDir: undefined,
    bitrate: DEFAULT_BITRATE,
    force: false,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[index];
    };

    if (arg === "--input") options.input = path.resolve(next());
    else if (arg === "--output-dir") options.outputDir = path.resolve(next());
    else if (arg === "--bitrate") options.bitrate = next();
    else if (arg === "--force") options.force = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  node shadowings/convertShadowingAudioToMp3.js [options]

Options:
  --input <path>       WAV file, directory, or simple glob. Default: shadowings/shadowing-dialogue*.wav
  --output-dir <path>  Directory for MP3 files. Default: next to each WAV
  --bitrate <value>    MP3 bitrate. Default: ${DEFAULT_BITRATE}
  --force              Overwrite existing MP3 files
  --dry-run            Print planned conversions without writing files

Examples:
  node shadowings/convertShadowingAudioToMp3.js
  node shadowings/convertShadowingAudioToMp3.js --input shadowings/shadowing-dialogue-01-a-summer-night.wav
  node shadowings/convertShadowingAudioToMp3.js --input shadowings --output-dir shadowings/mp3 --force
`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function globToRegExp(pattern) {
  const normalized = path.resolve(pattern);
  const escaped = escapeRegExp(normalized).replace(/\\\*/g, "[^/\\\\]*");
  return new RegExp(`^${escaped}$`);
}

function isWavPath(filePath) {
  return path.extname(filePath).toLowerCase() === ".wav";
}

function findInputFiles(input) {
  const resolvedInput = path.resolve(input);

  if (fs.existsSync(resolvedInput)) {
    const stat = fs.statSync(resolvedInput);
    if (stat.isFile()) {
      if (!isWavPath(resolvedInput)) throw new Error(`Input file is not a WAV: ${resolvedInput}`);
      return [resolvedInput];
    }

    if (stat.isDirectory()) {
      return fs
        .readdirSync(resolvedInput)
        .map((name) => path.join(resolvedInput, name))
        .filter((filePath) => fs.statSync(filePath).isFile())
        .filter(isWavPath)
        .filter((filePath) => path.basename(filePath).toLowerCase() !== "beep.wav")
        .sort();
    }
  }

  if (!resolvedInput.includes("*")) {
    throw new Error(`Input not found: ${resolvedInput}`);
  }

  const directory = path.dirname(resolvedInput);
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    throw new Error(`Input directory not found: ${directory}`);
  }

  const matcher = globToRegExp(resolvedInput);
  return fs
    .readdirSync(directory)
    .map((name) => path.join(directory, name))
    .filter((filePath) => fs.statSync(filePath).isFile())
    .filter(isWavPath)
    .filter((filePath) => matcher.test(path.resolve(filePath)))
    .filter((filePath) => path.basename(filePath).toLowerCase() !== "beep.wav")
    .sort();
}

function getOutputPath(inputPath, outputDir) {
  const parsed = path.parse(inputPath);
  const directory = outputDir || parsed.dir;
  return path.join(directory, `${parsed.name}.mp3`);
}

function convertToMp3(ffmpegPath, inputPath, outputPath, bitrate) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  runFfmpeg(ffmpegPath, [
    "-y",
    "-i",
    inputPath,
    "-vn",
    "-codec:a",
    "libmp3lame",
    "-b:a",
    bitrate,
    outputPath,
  ]);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const inputFiles = findInputFiles(options.input);
  if (inputFiles.length === 0) {
    throw new Error(`No WAV files matched: ${options.input}`);
  }

  const ffmpegPath = options.dryRun ? undefined : findFfmpegPath();
  const conversions = inputFiles.map((inputPath) => ({
    inputPath,
    outputPath: getOutputPath(inputPath, options.outputDir),
  }));

  for (const { inputPath, outputPath } of conversions) {
    if (!options.force && fs.existsSync(outputPath)) {
      console.log(`Skip: ${outputPath} already exists. Use --force to overwrite.`);
      continue;
    }

    console.log(`${options.dryRun ? "Would convert" : "Converting"}: ${inputPath}`);
    console.log(`Output: ${outputPath}`);

    if (!options.dryRun) {
      convertToMp3(ffmpegPath, inputPath, outputPath, options.bitrate);
    }
  }

  console.log(`Done. Matched WAV files: ${inputFiles.length}`);
}

try {
  main();
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
