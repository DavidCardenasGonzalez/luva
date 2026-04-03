const axios = require("axios");
const { randomInt } = require("crypto");
const util = require("util");
// const apiWorkflow = require("../../apis/image_z_upscale.json");
const apiWorkflow = require("../../apis/image_z_image_turbo.json");
const storyData = require("../story.json");
const { getStories, getStoryId } = require("./storyUtils");

const COMFYUI_URL = "http://127.0.0.1:8000/prompt";

function buildWorkflow({ promptText, width, height, storyId }) {
  const workflow = JSON.parse(JSON.stringify(apiWorkflow));

  if (!workflow["57:27"]?.inputs) {
    throw new Error('Nodo "57:27" no encontrado');
  }

  if (!workflow["57:3"]?.inputs) {
    throw new Error('Nodo "57:3" no encontrado');
  }

  if (!workflow["9"]?.inputs) {
    throw new Error('Nodo "9" no encontrado');
  }

  if (!workflow["57:13"]?.inputs) {
    throw new Error('Nodo "57:13" no encontrado');
  }

  workflow["57:27"].inputs.text = promptText;
  workflow["57:3"].inputs.seed = randomInt(0, 2147483647);
  workflow["57:13"].inputs.width = width;
  workflow["57:13"].inputs.height = height;
  workflow["9"].inputs.filename_prefix = `${storyId}_image`;

  return workflow;
}

async function processStory(story) {
  if (!story.promptImage || typeof story.promptImage !== "string") {
    throw new Error('El campo "promptImage" no existe en story.json');
  }

  if (!Number.isInteger(story.width) || !Number.isInteger(story.height)) {
    throw new Error('Los campos "width" y "height" deben ser enteros en story.json');
  }

  const storyId = getStoryId(story.id);
  const workflow = buildWorkflow({
    promptText: story.promptImage,
    width: story.width,
    height: story.height,
    storyId,
  });

  await axios.post(COMFYUI_URL, { prompt: workflow });

  console.log("Prompt enviado a ComfyUI");
  console.log(`Story ID: ${storyId}`);
  console.log(`Prompt: ${story.promptImage}`);
  console.log(`Width: ${story.width}`);
  console.log(`Height: ${story.height}`);
  console.log(`Output prefix: ${workflow["9"].inputs.filename_prefix}`);
  console.log(`Seed: ${workflow["57:3"].inputs.seed}`);
}

async function main() {
  const stories = getStories(storyData);

  for (const story of stories) {
    await processStory(story);
  }
}

main().catch((error) => {
  const errorData = error.response?.data || error.message;

  console.error(
    "Error al enviar a ComfyUI:",
    typeof errorData === "object"
      ? util.inspect(errorData, { depth: null, colors: true, compact: false })
      : errorData
  );
  process.exit(1);
});
