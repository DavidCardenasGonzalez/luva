const path = require("path");
const dotenv = require("dotenv");
const { writeGeneratedSpeech } = require("./voiceboxClient");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const text = process.argv.slice(2).join(" ").trim() || "Hello world.";
  const outputPath =
    process.env.VOICEBOX_TEST_OUTPUT ||
    path.join(__dirname, `voicebox-hello-world.${process.env.VOICEBOX_TEST_EXT || "wav"}`);

  console.log(`Voicebox text: ${text}`);
  console.log(`Output: ${outputPath}`);

  const result = await writeGeneratedSpeech(outputPath, text);

  console.log(
    JSON.stringify(
      {
        profile: result.profile?.name || result.profile?.id,
        profileId: result.profile?.id,
        generationId: result.generation?.id,
        engine: result.generation?.engine || result.config.engine,
        modelSize: result.generation?.model_size || result.config.modelSize,
        contentType: result.contentType,
        bytes: result.buffer.length,
        outputPath,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  const detail = error.response?.data ?? error.message;
  console.error("Error:", typeof detail === "object" ? JSON.stringify(detail, null, 2) : detail);
  process.exit(1);
});
