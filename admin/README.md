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

## Publicación
```bash
npm run publish
```

El publish del admin compila `dist/`, sincroniza contra un bucket S3 propio del portal e invalida su distribución CloudFront. Por defecto resuelve ambos recursos desde los outputs del stack `LuvaStack`.

El portal quedó preparado como PWA instalable. Para instalarlo en celular debe estar publicado por HTTPS:
- Android/Chrome: debería ofrecer `Instalar app` automáticamente.
- iPhone/Safari: usa `Compartir` -> `Agregar a pantalla de inicio`.

Variables opcionales para el script:
- `LUVA_INFRA_STACK_NAME`: nombre del stack CloudFormation/CDK. Default: `LuvaStack`.
- `LUVA_AWS_PROFILE`: perfil AWS CLI a usar. Default: `david`.
- `LUVA_ADMIN_PORTAL_BUCKET`: override manual del bucket S3.
- `LUVA_ADMIN_PORTAL_DISTRIBUTION_ID`: override manual de la distribución CloudFront.
- `LUVA_ADMIN_PORTAL_URL`: URL final para imprimir al terminar.

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

En infraestructura, el stack ahora crea un hosting estático separado para el admin y expone:
- `AdminPortalBucketName`
- `AdminPortalDistributionId`
- `AdminPortalUrl`

## Estructura
- `src/app`: arranque, providers, router y estilos globales del portal.
- `src/features/auth`: login con Cognito, sesión y guardas por rol.
- `src/features/admin/api`: cliente del backend administrativo.
- `src/features/admin/model`: tipos y hooks del dashboard admin.
- `src/features/admin/ui`: pantalla base y estilos del portal.
- `src/shared/api`: cliente HTTP compartido del admin.
