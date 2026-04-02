# Meta Ads SDK en Luva

## Objetivo

Medir con Meta el funnel que realmente mueve revenue en la app:

- activacion e installs del SDK
- inicio de practica
- inicio de mision
- fin de mision
- vista de paywall
- checkout iniciado
- suscripcion comprada

La implementacion actual prioriza atribucion y optimizacion de revenue para un producto de suscripcion con `RevenueCat`, usando senales de producto mas utiles que el registro.

## Estrategia recomendada

1. Usa `Subscribe` como evento final de revenue cuando ya tengas volumen suficiente.
2. Si todavia no tienes suficiente senal de suscripciones, optimiza primero a `InitiatedCheckout`.
3. Usa `luva_mission_start`, `luva_mission_complete` y `luva_practice_start` para entender engagement y correlacion con conversion.
4. Usa `ViewedContent` del paywall solo para diagnostico del funnel, no como evento final de optimizacion.
5. Manten el prompt de ATT fuera del cold start. En esta app se pide en la primera vista del paywall para no degradar onboarding.
6. Segmenta analisis por origen del paywall. Ya dejamos etiquetados estos entry points:
   - `home_banner`
   - `settings_subscription`
   - `coin_chip`
   - `deck_card_unlock`
   - `practice_card_unlock`
   - `practice_recording`
   - `story_mission_unlock`
   - `story_scene_mission_unlock`
   - `story_scene_recording`

## Eventos implementados

| Evento Meta | Cuando se dispara | Para que sirve |
| --- | --- | --- |
| `fb_mobile_activate_app` | Auto log del SDK | Instalacion y activacion |
| `luva_practice_start` | Cuando se abre una sesion de practica | Medir activacion de aprendizaje |
| `luva_mission_start` | Cuando el usuario entra a una mision narrativa | Medir engagement temprano |
| `luva_mission_complete` | Cuando backend confirma `missionCompleted` | Medir progreso de alto valor |
| `ViewedContent` | Cuando se abre el paywall | Diagnostico de funnel |
| `InitiatedCheckout` | Cuando el usuario toca un plan | Senal temprana de intencion |
| `Subscribe` | Cuando `RevenueCat` confirma la compra | Revenue / optimizacion final |

## Archivos clave

- `app.config.js`: activa el plugin de `react-native-fbsdk-next` solo si existen `META_APP_ID` y `META_CLIENT_TOKEN`
- `src/marketing/metaAppEvents.ts`: wrapper comun para inicializacion, ATT y eventos
- `src/marketing/MetaAdsProvider.tsx`: inicializa el SDK y sincroniza identidad del usuario
- `src/screens/PracticeScreen.tsx`: registra `luva_practice_start`
- `src/screens/StorySceneScreen.tsx`: registra `luva_mission_start` y `luva_mission_complete`
- `src/screens/PaywallScreen.tsx`: registra paywall, checkout y compra

## Variables de entorno

Agrega esto en `app/.env`:

```dotenv
META_APP_ID=your_meta_app_id
META_CLIENT_TOKEN=your_meta_client_token
META_DISPLAY_NAME=Luva
META_IOS_USER_TRACKING_PERMISSION=Usamos tu identificador publicitario para medir suscripciones y mejorar nuestras campañas en Meta. No vendemos tu informacion.
```

Tambien quedaron documentadas en `app/.env.example`.

Notas:

- `META_CLIENT_TOKEN` es obligatorio para que Expo configure correctamente el SDK nativo.
- El scheme de retorno de Facebook para iOS se deriva automaticamente como `fb<META_APP_ID>`.

## Pasos para activar en Meta

1. Crea o abre tu app en Meta for Developers.
2. Agrega la app de iOS con bundle id `com.cardi7.luva`.
3. Agrega la app de Android con package `com.cardi7.luva`.
4. Copia `App ID` y `Client Token` a `app/.env`.
5. Reconstruye la app nativa. Como esto toca config nativa, no basta con recargar JS.
6. Si Meta Events Manager sigue mostrando el aviso, sube una nueva build de iOS con ese cambio nativo y espera a que Meta vuelva a escanear la app.

Ejemplos:

```bash
cd app
npm install
npx expo prebuild --clean -p ios
eas build --platform ios
eas build --platform android
```

En este repo no editas manualmente un `Podfile` para Facebook SDK. `react-native-fbsdk-next` genera la configuracion nativa durante `expo prebuild` y en iOS instala `FBSDKCoreKit/LoginKit/ShareKit` de la linea 18.x.

## Permisos y revisiones

### iOS

- Si quieres la mejor atribucion en iOS, si necesitas ATT.
- El prompt se solicita con `expo-tracking-transparency`.
- `NSUserTrackingUsageDescription` se inyecta desde `app.config.js` cuando `META_APP_ID` esta configurado.
- Tambien se envia `Settings.setAdvertiserTrackingEnabled(true|false)` segun la decision real de ATT del usuario.
- El plugin de Meta tambien agrega `SKAdNetworkItems` para medicion agregada en iOS.
- El usuario solo vera el prompt una vez; despues iOS devuelve el estado ya decidido.

### Android

- No agregamos ningun permiso runtime nuevo para pedirle al usuario.
- `expo-tracking-transparency` agrega `com.google.android.gms.permission.AD_ID`.
- El plugin de Meta agrega `android.permission.INTERNET` y la configuracion del SDK en el manifest.
- A nivel de publicacion, revisa Data safety / advertising disclosures en Play Console.

### Meta App Review

Con esta implementacion no estas pidiendo permisos de Facebook Login ni scopes de Graph API, asi que no deje nada que requiera App Review de Meta. Si despues agregas Facebook Login o endpoints de Graph/Marketing API, revisalo de nuevo.

## Como verificar

1. Abre la app nativa compilada, no Expo Go.
2. Navega a un punto que abra el paywall.
3. En iOS, confirma que el prompt de ATT aparece la primera vez que se llega al paywall.
4. Abre una practica y revisa `luva_practice_start`.
5. Entra a una mision y revisa `luva_mission_start`.
6. Completa una mision y revisa `luva_mission_complete`.
7. Toca un plan y revisa `InitiatedCheckout`.
8. Completa una compra sandbox/test y revisa `Subscribe`.

## Notas operativas

- Si falta `META_APP_ID` o `META_CLIENT_TOKEN`, el SDK queda en modo no operativo y los helpers hacen no-op.
- Eso permite seguir desarrollando sin romper builds donde Meta todavia no esta configurado.
- Si cambias App ID, Client Token o permisos nativos, vuelve a reconstruir la app.

## Referencias utiles

- Meta SDK para React Native: https://github.com/thebergamo/react-native-fbsdk-next
- ATT en Expo: https://docs.expo.dev/versions/latest/sdk/tracking-transparency/
- ATT en Apple: https://developer.apple.com/documentation/apptrackingtransparency
