App (React Native, TypeScript)

Estado
- Esqueleto con pantallas stub (Onboarding, Home, Deck, Practice, Stories, Profile), hooks (`useAudioRecorder`, `useUploadToS3`, `useSession`) y componentes básicos (`FeedbackCard`, `PointsBanner`, `UnlockModal`).

Stack sugerido
- Expo (recomendado para rapidez) o bare RN.

Ejecutar (Expo)
1) `npm install`
2) Configura `.env`
3) `npx expo start`

Meta Ads
- Ver `README_META_ADS.md` para estrategia, setup del SDK, permisos y verificacion.

Seguridad
- Sin claves de OpenAI en cliente.
- Auth por Cognito Hosted UI (WebView / deep link redirect).
