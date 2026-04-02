# Sitio web de Luva (React + Vite)

Landing pública + primera versión web con login usando el mismo Cognito del app móvil.

## Requisitos
- Node 20.19+ (compatible con Vite 7)
- npm

## Desarrollo local
```bash
npm install
cp .env.example .env
npm run dev
```

## Variables de entorno
- `VITE_COGNITO_DOMAIN`: Hosted UI domain de Cognito.
- `VITE_COGNITO_CLIENT_ID`: client id del mismo user pool client que usa el app.
- `VITE_API_BASE_URL`: API base para sincronizar `/users/me`.
- `VITE_REDIRECT_URI`: opcional. Si no se define, se usa la raíz actual de la web.

## Cognito
Para que el login web funcione, el app client de Cognito debe incluir también las URLs web dentro de:
- `COGNITO_CALLBACK_URLS`
- `COGNITO_LOGOUT_URLS`

Ejemplo local:
```bash
COGNITO_CALLBACK_URLS=myapp://callback,http://localhost:5173/
COGNITO_LOGOUT_URLS=myapp://callback,http://localhost:5173/
```

En producción agrega además tu dominio web real.

## Estructura
- `src/app`: shell de la aplicación, providers, routing y estilos globales.
- `src/features/auth`: flujo web de Cognito Hosted UI, callback, sesión y pantallas protegidas.
- `src/features/marketing`: landing, links públicos y contenido estático.
- `src/shared`: cliente HTTP, config de entorno y assets compartidos.
- `index.html`: metadatos del sitio.

## Rutas
- `/`: landing principal.
- `/links`: links de descarga y redirección smart a tiendas.
- `/login`: acceso con Cognito Hosted UI.
- `/welcome`: primera pantalla protegida.

También se mantiene compatibilidad con URLs legacy como `?screen=login` y `?view=links`.

## App links
- iOS usa `/.well-known/apple-app-site-association` con `appID` `RHZ94C9F36.com.cardi7.luva`.
- Android usa `/.well-known/assetlinks.json` con package `com.cardi7.luva`.
- Antes de publicar, reemplaza `REPLACE_WITH_ANDROID_SIGNING_SHA256` por el SHA-256 real del certificado que firma la app instalada.
- El script `npm run publish` vuelve a subir ambos archivos con `Content-Type: application/json`, porque `apple-app-site-association` no tiene extensión.
