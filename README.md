Luva — B1 → B2 (MVP)

Visión
- App móvil para practicar inglés con cartas y conversaciones guiadas por voz. Backend serverless en AWS. Sin claves de OpenAI en cliente.

Monorepo
- infra/ — AWS CDK (Cognito, S3, DynamoDB, API Gateway, Lambdas, SSM)
- backend/ — Lambdas Node/TypeScript (mocks) + tests
- app/ — React Native (TypeScript) con pantallas y hooks stub
- seed/ — generador de 100 cartas y 5 historias
- scripts/ — utilidades locales (p.ej., evaluate-sandbox)
- docs/ — colección Postman/Insomnia y [Prompt Development Notes](docs/prompt-development-notes.md)

Estado
- Primera versión esqueleto con mocks y contratos. Preparada para iterar.

Requisitos
- Node 18+
- AWS CLI configurado
- CDK v2 global (opcional): `npm i -g aws-cdk`

Flujo (alto nivel)
1) `cd infra` → `npm install` → `cdk deploy` (crea recursos)
2) `cd backend` → `npm install` → `npm run build` → desplegar con CDK (apunta a código en `backend/dist`)
3) `cd app` → `npm install` → ejecutar en simulador/dispositivo

Seguridad
- Claves y parámetros en SSM Parameter Store (no en código). El cliente nunca llama a OpenAI directamente.

Docs rápidas
- Endpoints bajo `/v1` (ver `docs/luva.postman_collection.json`).
- Contratos principales: `/cards`, `/sessions/start|transcribe|evaluate`, `/stories`, `/me/progress`.

Sandbox evaluación local
- Ejecuta evaluaciones fuera de Lambda para probar prompts/modelos:
  `node scripts/evaluate-sandbox.js --text "I would like some water" --label "by contrast" --example "By contrast, sales fell" --model gpt-5-nano`
- API key: exporta `OPENAI_API_KEY` o reemplaza el placeholder en el archivo (solo local, no lo subas).
