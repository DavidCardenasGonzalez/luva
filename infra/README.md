Infra (AWS CDK)

Stacks
- DynamoDB single-table `Luva` (pk, sk) + GSI1/GSI2
- DynamoDB `LuvaUsersTable` para usuarios autenticados (`email` como llave)
- S3 buckets: `audio-raw`, `public`
- Hosting estático del portal admin en S3 + CloudFront propio
- Cognito Hosted UI con email y proveedores sociales opcionales
- Grupo de Cognito `admin` para acceso al portal administrativo
- API Gateway REST `/v1` → Lambda `api`
- API Gateway REST `/v1/users/me` y `/v1/users/me/progress` → Lambda `users` protegida con Cognito authorizer
- API Gateway REST `/v1/admin` → Lambda `admin` protegida con Cognito authorizer y validación explícita del rol `admin`
- Lambda programada `VideoPublisherFunction` cada 7 minutos para publicar videos `programado` vencidos en Instagram/TikTok
- SSM Parameters (OpenAI key, flags)

Uso
1) `npm install`
2) Exporta variables de entorno para auth según necesites:
   `COGNITO_CALLBACK_URLS`, `COGNITO_LOGOUT_URLS`, `COGNITO_DOMAIN_PREFIX`
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   `APPLE_SERVICE_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`
   `INSTAGRAM_AUTOPUBLISH_ENABLED`, `INSTAGRAM_IG_USER_ID`, `INSTAGRAM_GRAPH_API_VERSION`, `INSTAGRAM_SHARE_TO_FEED`
   `TIKTOK_AUTOPUBLISH_ENABLED`, `TIKTOK_DEFAULT_PRIVACY_LEVEL`, `TIKTOK_DISABLE_COMMENT`, `TIKTOK_DISABLE_DUET`, `TIKTOK_DISABLE_STITCH`
   `SOCIAL_POST_CAPTION_SUFFIX`
   Puedes copiar `infra/.env.infra.example` a `infra/.env.infra` y cargarlo con:
   `set -a && source .env.infra && set +a`
   Si usas `infra/.env`, los scripts `npm run synth` y `npm run deploy` ya lo cargan automáticamente.
3) `npx cdk bootstrap` (primera vez en la cuenta)
4) `npx cdk deploy` (usa `cdk.json` → no requiere `--app`)

Notas
- La Lambda `api` usa `NodejsFunction` y referencia `backend/src/handlers/api.ts`. Requiere `esbuild` (CDK lo maneja automáticamente).
- La Lambda `users` usa `backend/src/handlers/users.ts` y sincroniza usuarios por `email`.
- La Lambda `admin` usa `backend/src/handlers/admin.ts`, sirve `/v1/admin/*` y vuelve a validar el rol `admin` dentro de la propia lambda.
- La Lambda programada usa `backend/src/handlers/video-publisher.ts`, consulta el índice `StatusPublishOnIndex` en `GeneratedVideosTable`, toma videos `programado` con `publishOn <= now`, y persiste estado por plataforma para evitar duplicados.
- Integra con S3 presigned PUT para audio y DynamoDB para progreso.
- Los tokens de Instagram y TikTok se leen desde SSM (`/luva/social/instagram/accessToken` y `/luva/social/tiktok/accessToken`) salvo que se inyecten directamente por entorno.
- Los outputs de CDK incluyen `ApiBaseUrl`, `AdminApiBaseUrl`, `AdminPortalBucketName`, `AdminPortalDistributionId`, `AdminPortalUrl`, `UserPoolClientId` y `HostedUiDomain` para cablear web y portal admin.
- El stack crea el grupo `admin` en Cognito. Para dar acceso al portal admin, solo agrega el usuario a ese grupo y haz que vuelva a iniciar sesión.
- La URL de CloudFront del admin se agrega automáticamente a callbacks/logout de Cognito y a CORS del bucket de videos generados para que el portal funcione publicado sin configuración manual extra.

Tips
- Si ejecutas desde la raíz del repo, puedes usar: `npx cdk -a "npx ts-node --prefer-ts-exts infra/bin/luva-infra.ts" deploy`.
- Para silenciar el aviso de telemetría: `cdk acknowledge 34892`.
