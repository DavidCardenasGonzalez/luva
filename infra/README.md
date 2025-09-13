Infra (AWS CDK)

Stacks
- DynamoDB single-table `Luva` (pk, sk) + GSI1/GSI2
- S3 buckets: `audio-raw`, `public`
- Cognito (Hosted UI, Google/Apple placeholders)
- API Gateway REST `/v1` → Lambda `api`
- SSM Parameters (OpenAI key, flags)

Uso
1) `npm install`
2) Ajusta variables en `lib/luva-stack.ts` (dominios, callbacks)
3) `npx cdk bootstrap` (primera vez en la cuenta)
4) `npx cdk deploy` (usa `cdk.json` → no requiere `--app`)

Notas
- La Lambda `api` usa `NodejsFunction` y referencia `backend/src/handlers/api.ts`. Requiere `esbuild` (CDK lo maneja automáticamente).
- Integra con S3 presigned PUT para audio y DynamoDB para progreso.

Tips
- Si ejecutas desde la raíz del repo, puedes usar: `npx cdk -a "npx ts-node --prefer-ts-exts infra/bin/luva-infra.ts" deploy`.
- Para silenciar el aviso de telemetría: `cdk acknowledge 34892`.
