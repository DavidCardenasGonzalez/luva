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
- `VITE_COGNITO_DOMAIN`: Hosted UI domain de Cognito.
- `VITE_COGNITO_CLIENT_ID`: client id del user pool client.
- `VITE_REDIRECT_URI`: opcional. Si no se define, usa la raíz actual del admin.

## Cognito
El app client debe incluir la URL del admin dentro de callback y logout URLs. Ejemplo local:

```bash
http://localhost:5174/
```

El usuario necesita traer el grupo o rol `admin` en el token para poder entrar.
