Backend (Lambdas Node/TypeScript)

Estado
- Lambda única `api` con router ligero y mocks de endpoints. Contratos estables, lógica lista para conectar con DynamoDB, S3 y OpenAI.

Scripts
- `npm run build` — compila a `dist/`
- `npm test` — tests básicos (opcional)

Env
- `TABLE_NAME` — nombre DynamoDB (inyectado por CDK)
- `AUDIO_BUCKET` — bucket S3 para audios
- `OPENAI_KEY_PARAM` — ruta en SSM del API key de OpenAI
- `STAGE` — `dev|prod`

Notas
- El endpoint `/v1/sessions/start` genera un presigned PUT URL para subir `.m4a`.
- `/v1/sessions/{id}/transcribe` y `/v1/sessions/{id}/evaluate` devuelven mocks compatibles con el contrato.

