"""
Rellena definiciones en vocab_relevant_clean.json usando la API de OpenAI.

Reglas:
- Devuelve definición breve en español (6–14 palabras aprox).
- Si la entrada es un nombre propio, nacionalidad/demonio, acrónimo o no es vocabulario de inglés,
  se descarta (definition = None).
- Escribe el resultado de vuelta al mismo archivo, sin los descartados.

Uso:
  python3 scripts/fill_definitions.py
Requiere OPENAI_API_KEY en el entorno o scripts/environment.local.json.
"""

import json
import os
import time
import urllib.request
from pathlib import Path
from typing import Dict, Iterable, List


ROOT = Path(__file__).resolve().parent
INPUT_PATH = ROOT / "vocab_relevant_clean.json"
OUTPUT_PATH = INPUT_PATH  # sobrescribimos el mismo archivo
SECRETS_PATH = ROOT / "environment.local.json"
BATCH_SIZE = 120
MAX_RETRIES = 4


def load_api_key() -> str:
    if "OPENAI_API_KEY" in os.environ:
        return os.environ["OPENAI_API_KEY"]
    api_key = (
        Path(SECRETS_PATH).exists()
        and json.loads(SECRETS_PATH.read_text()).get("OPENAI_API_KEY")
    )
    return api_key or ""


def chunked(seq: List[dict], size: int) -> Iterable[List[dict]]:
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


def call_openai(api_key: str, labels: List[str]) -> Dict[str, str]:
    system = {
        "role": "system",
        "content": (
            "Eres un asistente que responde solo JSON válido. "
            "Ayudas a hispanohablantes a aprender vocabulario en inglés."
        ),
    }
    user_payload = {
        "task": "define words",
        "instructions": [
            "Devuelve un objeto JSON con la clave 'results'.",
            "results debe mapear cada palabra EXACTAMENTE igual a como se envió, a: una definición breve en español o null.",
            "Definición: 6-14 palabras, sentido principal como sustantivo/verbo/adjetivo común.",
            "Si la palabra es nombre propio (persona, lugar, marca), nacionalidad/demonio, acrónimo, abreviatura o no es vocabulario común, devuelve null.",
            "No añadas ejemplos ni traducciones literales.",
        ],
        "words": labels,
    }

    body = json.dumps(
        {
            "model": "gpt-4.1-nano",
            "messages": [system, {"role": "user", "content": json.dumps(user_payload)}],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }
    ).encode()

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )

    backoff = 1.5
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read()
                data = json.loads(raw)
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return parsed.get("results", {})
        except Exception as exc:  # pragma: no cover - script de línea de comandos
            if attempt >= MAX_RETRIES:
                raise
            time.sleep(backoff)
            backoff = min(backoff * 2, 12)
    return {}


def main() -> None:
    api_key = load_api_key() or ""
    if not api_key:
        raise SystemExit("Falta OPENAI_API_KEY")

    data = json.loads(INPUT_PATH.read_text())
    try:
        proper_names = {
            w.strip().lower()
            for w in Path("/usr/share/dict/propernames").read_text().splitlines()
        }
    except FileNotFoundError:
        proper_names = set()

    kept: List[dict] = []
    dropped: List[str] = []
    total = len(data)

    for batch in chunked(data, BATCH_SIZE):
        labels = [item["label"] for item in batch if item["label"].lower() not in proper_names]
        if not labels:
            dropped.extend(item["label"] for item in batch)
            continue

        results = call_openai(api_key, labels)
        for item in batch:
            label = item["label"]
            definition = results.get(label)
            if definition:
                kept.append({"label": label, "definition": definition.strip()})
            else:
                dropped.append(label)

        print(
            f"Progreso: {len(kept)+len(dropped)}/{total} "
            f"(kept {len(kept)} dropped {len(dropped)})"
        )

    OUTPUT_PATH.write_text(json.dumps(kept, ensure_ascii=False, indent=2) + "\n")
    print(
        f"Listo. Total original {total}, mantenidos {len(kept)}, eliminados {len(dropped)}."
    )


if __name__ == "__main__":
    main()
