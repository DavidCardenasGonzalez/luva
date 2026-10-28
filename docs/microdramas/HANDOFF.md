# Traspaso de microdramas

Actualizado: 2026-10-23.

## Portal de series

La sección **Series** y su editor están implementados. Ver `ADMIN.md` para uso, publicación, cargas, API y validación. Incluye edición de Mateo existente, borradores sin episodios, portada/video/SRT, personajes, orden, publicación por episodio y transacciones con control de versión. Backend desplegado en Dev y verificado mediante alta/edición/eliminación de un borrador temporal, conflicto 409 y validación 400; el borrador se eliminó al terminar y Mateo conserva sus 21 episodios. Portal publicado en `https://d2y8wpnkj90e8w.cloudfront.net/series`. Las pruebas dirigidas pasan (28); suite completa: 74 pasan y los tres fallos del baseline. QA en navegador de escritorio y móvil con APIs simuladas completado; lint de componentes nuevos y build Dev pasan.

## Estado

- Planeación y reconocimiento del repositorio completados.
- P1–P9 implementados localmente y backend/portal publicados en `LuvaDevStack` (`863186504931`, `us-west-2`). Los 40 personajes se migraron y verificaron; la serie `mateo` ya está publicada con 21 episodios. El cliente móvil aún requiere build/QA en iOS y Android.
- Leer `IMPLEMENTATION_PLAN.md` como guía técnica y `REQUIREMENTS.md` como requerimiento original.
- Primer paquete de implementación: P1. P0 tiene baseline registrado aquí; verificar git status y releer el código antes de empezar.

## Documentos entregados

- `IMPLEMENTATION_PLAN.md`: arquitectura real, decisiones, modelos DynamoDB, contratos HTTP, migración segura, reproductor, navegación, chat, pruebas y paquetes P0–P10.
- `REQUIREMENTS.md`: copia exacta del texto adjunto del usuario, preservada en el repo para no depender del attachment.
- `HANDOFF.md`: punto de continuación; actualizar después de cada paquete.

## Baseline verificado

| Comprobación | Resultado antes del feature |
| --- | --- |
| Backend TypeScript | Compila con `npm run build` (parte de npm test) |
| Backend suite con Node v22.12.0 | 55 tests: 52 pasan, 3 fallan |
| App `./node_modules/.bin/tsc --noEmit` | Pasa |
| Infra `npm run build` | Pasa |
| Admin `npm run build` | Pasa; warning informativo de Browserslist desactualizado |
| `git diff --check` | Pasa para los cambios tracked presentes |
| CDK synth/diff, AWS, reproducción iOS/Android | No ejecutados |

## Estado después de la primera implementación

- Backend TypeScript compila; app TypeScript compila; infra y portal admin compilan.
- 11 pruebas dirigidas de migración, catálogo y progreso pasan.
- Suite completa: 63 pasan y 3 fallan, los mismos tres fallos del baseline (dos version-check y el conteo obsoleto de personajes 40 vs 52).
- Las pruebas no sustituyen la migración real ni la verificación del comportamiento en dispositivos.
- Deploy Dev completado el 2026-10-23; creó `CharactersTable` y `MicrodramasTable`, actualizó las Lambdas/API Gateway y conservó los recursos existentes. El portal admin se publicó en `https://d2y8wpnkj90e8w.cloudfront.net`.
- Migración Dev de personajes: `migrated=40`, después `verify skipped=40`, sin conflictos ni faltantes. Informes temporales en `/tmp/luva-dev-character-migration-{dry-run,apply,verify}.json`.
- Smoke checks: `GET /v1/characters` devolvió 40; `GET /v1/microdramas` devolvió HTTP 200 con `items: []`; CloudFront admin devolvió HTTP 200.
- No se publicaron actualizaciones OTA ni builds móviles; el proyecto no tiene una configuración EAS Update activa.
- En `CharacterPostsTable` de Dev había 21 videos; todos fueron importados como episodios de `mateo` (“Mateo”), con `initials:meet_mateo_first_mission` como personaje único. 20 episodios tienen SRT y uno se reproduce sin subtítulos, según aprobación del usuario. Simulación indicó `wouldInsert=22`; aplicación creó 22 registros y verificación confirmó `alreadyPresent=22`. Smoke HTTP: catálogo 200 con una serie; detalle 200 con 21 episodios y uno sin `subtitlesUrl`.
- Las tablas nuevas están protegidas con RETAIN y PITR. El contenido de microdramas no se migra automáticamente desde posts: requiere manifiesto validado y escritura idempotente.

Fallos previos de backend:

1. `backend/test/api.test.js:47`: version-check para versión antigua espera `optional_update`; recibe `required_update`.
2. `backend/test/api.test.js:61`: version-check iOS espera URL de búsqueda de App Store; recibe URL concreta de Luva.
3. `backend/test/characters-data.test.js:5`: espera 52 personajes; el array actual contiene 40.

El log de esta ejecución quedó temporalmente en `/tmp/luva-microdramas-baseline-backend.log`. No depender de que exista en otra sesión; volver a ejecutar los comandos del plan. La primera invocación de npm test tomó un Node no compatible con `--test`; se repitió con PATH explícito de Node v22.12.0. Usar ese PATH para reproducir el baseline y capturar el exit code real de npm test.

No corregir expectativas de tests a ciegas: confirmar la política vigente de versiones y el snapshot de personajes. Esos fallos preceden a microdramas; no ocultar fallos nuevos comparándolos solo con un conteo global.

## Cambios ajenos presentes al iniciar

Tracked modificados:

```text
app/app.config.js
app/package.json
backend/src/admin/biography.ts
backend/src/handlers/api.ts
backend/src/memory/README.md
backend/src/memory/memory-service.ts
backend/src/memory/pinecone.ts
```

Untracked preexistentes:

```text
backend/src/admin/biography-split.ts
docs/remitly-project-deep-dive.md
```

La planificación agrega únicamente esta carpeta documental. Los builds regeneraron salidas de compilación locales, sin cambios tracked adicionales. No usar reset/checkout para limpiar el trabajo del usuario.

## Riesgos ya resueltos en el diseño

- Fuente de personajes real = array TypeScript, no historias JSON educativas.
- Biografía larga ya vive en DynamoDB/Pinecone: preservarla; no confundir con `characterBio`.
- Entrada real = Feed; cambiar Home sin onboarding/barra/paywall no cambia la experiencia principal.
- El proxy público de API Gateway no autentica progreso: crear recursos Cognito explícitos.
- La conversación local depende de postId/contexto: no introducir el episodio en esa clave.
- No ampliar `/users/me/progress`: cliente y backend ya tienen formatos educativos distintos.
- `chatCharacters` se construye en backend por BatchGet con allowlist; no consultas individuales ni duplicación permanente de prompts.
- Los nuevos metadatos no contienen trama. Filtrar spoilers de memorias/biografías ya existentes es una extensión; publicación requiere biografía editorialmente segura.

## Prerrequisitos del lanzamiento

Assets reales de video, portadas y SRT; selección editorial de personajes; destino dev/prod confirmado y credenciales disponibles para migrar/desplegar; backups verificados; QA iOS y Android. Esto no impide implementar y probar localmente con fixtures.

## Registro de paquetes

| Paquete | Estado | Evidencia / siguiente acción |
| --- | --- | --- |
| Planificación / P0 | Completado | Inspección y baseline arriba; verificar diferencias nuevas al retomar |
| P1–P2 | Desplegados en Dev | 40 personajes migrados y verificados; API/admin usan DB |
| P3–P5 | Backend desplegado en Dev | Tablas y rutas listas; serie Mateo y 21 episodios importados; probar progreso autenticado con cliente real |
| P6–P9 | Código y portal admin publicados | App móvil requiere build; QA visual y flujos en iOS/Android pendientes |
| P10 | Implementado y publicado en Dev | Suite completa: 64 pasan y los mismos 3 fallos baseline; el episodio sin SRT ahora es opcional y está publicado. QA de reproducción y progreso autenticado en dispositivos sigue pendiente |
