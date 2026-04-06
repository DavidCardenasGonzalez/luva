Infra (AWS CDK)

Stacks
- DynamoDB single-table `Luva` (pk, sk) + GSI1/GSI2
- DynamoDB `LuvaUsersTable` para usuarios autenticados (`email` como llave)
- S3 buckets: `audio-raw`, `public`
- Cognito Hosted UI con email y proveedores sociales opcionales
- Grupo de Cognito `admin` para acceso al portal administrativo
- API Gateway REST `/v1` → Lambda `api`
- API Gateway REST `/v1/users/me` y `/v1/users/me/progress` → Lambda `users` protegida con Cognito authorizer
- API Gateway REST `/v1/admin` → Lambda `admin` protegida con Cognito authorizer y validación explícita del rol `admin`
- SSM Parameters (OpenAI key, flags)

Uso
1) `npm install`
2) Exporta variables de entorno para auth según necesites:
   `COGNITO_CALLBACK_URLS`, `COGNITO_LOGOUT_URLS`, `COGNITO_DOMAIN_PREFIX`
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   `APPLE_SERVICE_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`
   Puedes copiar `infra/.env.infra.example` a `infra/.env.infra` y cargarlo con:
   `set -a && source .env.infra && set +a`
   Si usas `infra/.env`, los scripts `npm run synth` y `npm run deploy` ya lo cargan automáticamente.
3) `npx cdk bootstrap` (primera vez en la cuenta)
4) `npx cdk deploy` (usa `cdk.json` → no requiere `--app`)

Notas
- La Lambda `api` usa `NodejsFunction` y referencia `backend/src/handlers/api.ts`. Requiere `esbuild` (CDK lo maneja automáticamente).
- La Lambda `users` usa `backend/src/handlers/users.ts` y sincroniza usuarios por `email`.
- La Lambda `admin` usa `backend/src/handlers/admin.ts`, sirve `/v1/admin/*` y vuelve a validar el rol `admin` dentro de la propia lambda.
- Integra con S3 presigned PUT para audio y DynamoDB para progreso.
- Los outputs de CDK incluyen `ApiBaseUrl`, `AdminApiBaseUrl`, `UserPoolClientId` y `HostedUiDomain` para cablear web y portal admin.
- El stack crea el grupo `admin` en Cognito. Para dar acceso al portal admin, solo agrega el usuario a ese grupo y haz que vuelva a iniciar sesión.

Tips
- Si ejecutas desde la raíz del repo, puedes usar: `npx cdk -a "npx ts-node --prefer-ts-exts infra/bin/luva-infra.ts" deploy`.
- Para silenciar el aviso de telemetría: `cdk acknowledge 34892`.
