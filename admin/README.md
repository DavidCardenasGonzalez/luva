# Portal Admin de Luva

Aplicación React + Vite separada de `web`, protegida con Cognito Hosted UI y acceso por rol `admin`.

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
- `VITE_ADMIN_API_BASE_URL`: base URL del backend admin, por ejemplo `https://.../prod/v1/admin`.
- `VITE_COGNITO_DOMAIN`: Hosted UI domain de Cognito.
- `VITE_COGNITO_CLIENT_ID`: client id del user pool client.
- `VITE_REDIRECT_URI`: opcional. Si no se define, usa la raíz actual del admin.

## Cognito
El app client debe incluir la URL del admin dentro de callback y logout URLs. Ejemplo local:

```bash
http://localhost:5174/
```

El usuario necesita traer el grupo o rol `admin` en el token para poder entrar.

## Estructura
- `src/app`: arranque, providers, router y estilos globales del portal.
- `src/features/auth`: login con Cognito, sesión y guardas por rol.
- `src/features/admin/api`: cliente del backend administrativo.
- `src/features/admin/model`: tipos y hooks del dashboard admin.
- `src/features/admin/ui`: pantalla base y estilos del portal.
- `src/shared/api`: cliente HTTP compartido del admin.
