#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const infraDir = path.resolve(__dirname, "..");
const envFile = path.join(infraDir, ".env");

loadEnvFile(envFile);

const isWindows = process.platform === "win32";
const npxCommand = isWindows ? "npx" : "npx";
const args = process.argv.slice(2);

const result = spawnSync(npxCommand, ["cdk", ...args], {
  cwd: infraDir,
  stdio: "inherit",
  env: process.env,
  shell: isWindows,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const cleanLine = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separatorIndex = cleanLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = cleanLine.slice(0, separatorIndex).trim();
    let value = cleanLine.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
