Backend (Lambdas Node/TypeScript)

Estado
- Lambda única `api` con router ligero y mocks de endpoints. Contratos estables, lógica lista para conectar con DynamoDB, S3 y OpenAI.
- Lambda `users` dedicada a gestión de usuarios autenticados con Cognito y respaldados en DynamoDB por correo.

Scripts
- `npm run build` — compila a `dist/`
- `npm test` — tests básicos (opcional)

Env
- `TABLE_NAME` — nombre DynamoDB (inyectado por CDK)
- `USERS_TABLE_NAME` — tabla DynamoDB dedicada a usuarios autenticados
- `AUDIO_BUCKET` — bucket S3 para audios
- `OPENAI_KEY_PARAM` — ruta en SSM del API key de OpenAI
- `STAGE` — `dev|prod`

Notas
- El endpoint `/v1/sessions/start` genera un presigned PUT URL para subir `.m4a`.
- `/v1/sessions/{id}/transcribe` y `/v1/sessions/{id}/evaluate` devuelven mocks compatibles con el contrato.
- `GET/POST /v1/users/me` vive en la lambda `users` y requiere un token válido de Cognito vía API Gateway authorizer.
