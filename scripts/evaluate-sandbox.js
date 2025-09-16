// #!/usr/bin/env node
/**
 * Sandbox para jugar con la evaluación (fuera de AWS Lambda)
 *
 * Uso:
 *   node scripts/evaluate-sandbox.js \
 *     --text "I would like some water" \
 *     --label "by contrast" \
 *     --example "By contrast, sales fell in Q2" \
 *     --model gpt-5-nano
 *
 * API Key:
 *   - Lee de la variable de entorno OPENAI_API_KEY
 *   - O defínela en scripts/evaluate-sandbox.local.json (no lo subas al repo)
 */

const fs = require("fs");
const path = require("path");

// Carga secretos locales desde scripts/environment.local.json si existe.
try {
  const secretsFile = path.join(__dirname, "environment.local.json");
  const raw = fs.readFileSync(secretsFile, "utf8");
  const data = JSON.parse(raw);
  console.log(`Cargando variables de entorno desde ${data}`);
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      console.log(
        `(Usando ${key} de environment.local.json) con valor: ${
          value ? "***" : "(vacío)"
        }`
      );
      if (!process.env[key] && typeof value === "string" && value) {
        process.env[key] = value;
      }
    }
  }
} catch (err) {
  if (err.code !== "ENOENT") {
    console.warn(
      "[WARN] No se pudo leer scripts/environment.local.json:",
      err.message
    );
  }
}
// console.log(process.env);
// NOTA: Por seguridad, evita commitear tu API key. Usa env vars cuando sea posible.
const API_KEY = process.env.OPENAI_API_KEY;

function arg(name, short) {
  const i = process.argv.findIndex(
    (a) => a === `--${name}` || a === `-${short}`
  );
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
}

async function main() {
  const text = "I would like some made up water"; // arg('text', 't');
  const label = "make up";
  const example = "They made up after the argument.";
  // const model = "gpt-5-nano";
  const model = "gpt-4.1-nano";

  const timeoutMs = Number(process.env.EVAL_TIMEOUT_MS || 20000);
  if (!text) {
    console.error('Falta --text "..."');
    process.exit(1);
  }

  const sys = `Eres un profesor de inglés que habla español. 
  El alumno va a dar un ejemplo del uso de ${label} debe evaluar su respuesta.

Devuelve SOLO JSON (sin texto extra) con estas claves:
  - correctness: número 0-100 que indique qué tan correcta es la respuesta.
  - errors: arreglo con hasta 3 puntos breves y accionables en español (solo si hay errores reales, no inventes errores).
  - improvements: arreglo con 1 reformulación más natural para un nativo en inglés (frase concisa), sin explicaciones. Opcional si ya está perfecto.

Responde únicamente el JSON, da tu respuesta de una forma amable.`;

  const user =
    `${text}`;
  const start = Date.now();
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        // Para Responses API: usa 'instructions' como prompt de sistema
        instructions: sys,
        // Y la entrada del usuario como input_text
        input: [
          {
            role: "user",
            content: [{ type: "input_text", text: user }],
          },
        ],
        // Limitar output para evitar truncamientos inesperados
        max_output_tokens: 300,
        temperature: 0.4,
        // top_p: 1,
      }),
      signal: ac.signal,
    });

    const full = await res.json();
    // console.log("[Full response]", JSON.stringify(full, null, 2));
    const elapsed = Date.now() - start;
    console.log(`(Request took ${elapsed}ms)`);
    if (!res.ok) {
      const txt = full?.error?.message || res.statusText;
      console.error("\n[HTTP Error]", res.status, txt);
      process.exit(2);
    }

    // Extraer texto desde Responses API
    let contentText = "";
    if (Array.isArray(full?.output)) {
      for (const item of full.output) {
        if (item?.type === "message" && Array.isArray(item.content)) {
          const texts = item.content
            .filter(
              (c) => c?.type === "output_text" && typeof c.text === "string"
            )
            .map((c) => c.text);
          if (texts.length) {
            contentText = texts.join("\n");
            break;
          }
        }
      }
    }
    // Fallback a chat.completions shape si fuese necesario
    if (!contentText && full?.choices && full.choices[0]?.message?.content) {
      contentText = full.choices[0].message.content;
    }

    let parsed;
    try {
      parsed = JSON.parse(contentText);
    } catch {
      parsed = null;
    }

    // console.log("--- Raw content ---");
    // console.log(contentText || "{}");
    console.log("\n--- Parsed JSON ---");
    console.log(JSON.stringify(parsed, null, 2));

    // Resumen amigable
    console.log("\n=== Resumen ===");
    console.log("Modelo:", full?.model || model);
    if (full?.status) console.log("Estado:", full.status);
    const usage = full?.usage || {};
    const inTok = usage?.input_tokens ?? usage?.prompt_tokens;
    const outTok = usage?.output_tokens ?? usage?.completion_tokens;
    if (inTok || outTok)
      console.log("Tokens → input:", inTok ?? "-", "output:", outTok ?? "-");
    if (full?.incomplete_details?.reason)
      console.log("Incompleto:", full.incomplete_details.reason);

    if (parsed && typeof parsed === "object") {
      const correctness = parsed.correctness ?? parsed.score ?? "-";
      console.log("\nPuntaje (correctness):", correctness);
      if (Array.isArray(parsed.errors) && parsed.errors.length) {
        console.log("\nDetalles a mejorar:");
        parsed.errors.forEach((e) => console.log(` - ${e}`));
      }
      if (Array.isArray(parsed.improvements) && parsed.improvements.length) {
        console.log("\nReformulaciones más naturales:");
        parsed.improvements.forEach((s) => console.log(` - ${s}`));
      }
    } else {
      console.log("\n(No se reconoció JSON). Muestra de texto:");
      console.log(contentText?.slice(0, 400) || "(vacío)");
    }
  } catch (e) {
    if (e?.name === "AbortError") {
      console.error(`[Timeout] ${timeoutMs}ms`);
    } else {
      console.error("[Fetch Error]", e?.message || e);
    }
    process.exit(3);
  } finally {
    clearTimeout(to);
  }
}

main();
