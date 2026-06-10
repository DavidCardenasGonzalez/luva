App (React Native, TypeScript)

Estado
- Esqueleto con pantallas stub (Onboarding, Home, Deck, Practice, Stories, Profile), hooks (`useAudioRecorder`, `useUploadToS3`, `useSession`) y componentes básicos (`FeedbackCard`, `PointsBanner`, `UnlockModal`).

Stack sugerido
- Expo (recomendado para rapidez) o bare RN.

Ejecutar (Expo)
1) `npm install`
2) Configura `.env.development`
3) `APP_ENV=development npx expo start --dev-client`

Entornos
- `APP_ENV=development` carga `.env.development`; no usa `.env` para evitar apuntar accidentalmente a produccion.
- `APP_ENV=production` carga `.env.production` si existe; si no, usa `.env`.
- Los perfiles `development`, `phone` y `preview` de EAS usan `APP_ENV=development`.
- El perfil `production` de EAS usa `APP_ENV=production`.

Para trabajar sin tocar usuarios reales, crea `app/.env.development` con un backend/Cognito de dev:

```env
APP_ENV=development
APP_DISPLAY_NAME=Luva Dev
APP_SCHEME=luvadev
IOS_BUNDLE_IDENTIFIER=com.cardi7.luva.dev
ANDROID_PACKAGE=com.cardi7.luva.dev
API_BASE_URL=https://YOUR_DEV_APIGW_ID.execute-api.us-east-1.amazonaws.com/dev/v1
COGNITO_DOMAIN=https://your-dev-domain.auth.us-east-1.amazoncognito.com
COGNITO_CLIENT_ID=your_dev_client_id
COGNITO_REGION=us-east-1
REDIRECT_URI=luvadev://callback
ANALYTICS_ENABLED_IN_DEV=false
```

Mantén `app/.env.production` con los valores reales. No uses el `API_BASE_URL` ni el `COGNITO_CLIENT_ID` de produccion en `.env.development` si quieres aislamiento real de usuarios y progreso.

Builds utiles:
- Simulador iOS dev: `eas build --profile development --platform ios`
- Telefono interno: `eas build --profile phone --platform ios` o `eas build --profile phone --platform android`
- Produccion: `eas build --profile production --platform all`

Meta Ads
- Ver `README_META_ADS.md` para estrategia, setup del SDK, permisos y verificacion.

Seguridad
- Sin claves de OpenAI en cliente.
- Auth por Cognito Hosted UI (WebView / deep link redirect).
