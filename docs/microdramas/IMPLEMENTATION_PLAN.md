# Microdramas en Luva: plan ejecutable y traspaso

Fecha: 2026-10-23. Estado: backend e infraestructura desplegados en Dev; 40 personajes migrados y verificados; portal admin publicado. Falta importar la serie Mateo (21 videos, uno sin SRT), publicar/instalar el cliente móvil Dev y hacer QA de dispositivo.

Este documento fija las decisiones para que otro modelo implemente tareas pequeñas, en orden, sin volver a diseñar el sistema. El requerimiento original queda preservado en `REQUIREMENTS.md`. Si el repositorio cambia, releer los archivos afectados antes de editar; los nombres nuevos de este plan son propuestas concretas, no archivos existentes.

## 1. Arquitectura comprobada

| Área | Implementación actual | Consecuencia |
| --- | --- | --- |
| Cliente principal | `app/`: Expo 54, React Native 0.81, React 19, TypeScript estricto | El MVP es móvil. `web/` es el sitio público y no requiere cambios. |
| Navegación | `app/src/navigation/AppNavigator.tsx`: native stack; entrada al terminar onboarding: `Feed` | Cambiar la entrada real, no solamente `HomeScreen`. |
| Barra inferior | `app/src/components/AppTabBar.tsx`: Feed, Friends, Settings; cambia con `StackActions.replace` | Extender este componente; no instalar otro navegador. |
| Educación | `HomeScreen`, `FeedScreen`, Deck, Lessons, Shadowing, MyJourney | Conservarlas accesibles. El feed mezcla contenido educativo y videos. |
| Video | `FeedScreen.tsx`: `CharacterVideoPage` y modal vertical; usa `expo-av` instalado | Reutilizar patrones de reproducción y subtítulos; evitar copiar el feed completo. |
| Subtítulos | `app/src/hooks/useLessons.ts`: `fetchSrtCaptions`, `findActiveSubtitle`; Feed usa traducción de segmentos | Usar SRT externo y overlay interactivo, no otro parser sin necesidad. |
| Traducción | `POST /v1/translate`, `api.post('/translate', {text, source:'en', target:supportLanguage})` | Reutilizar idioma de apoyo de `LanguageProvider`, caché por idioma y texto. |
| HTTP | `app/src/api/api.ts`: base URL, bearer, refresh, idiomas y reintentos GET | Todas las APIs móviles pasan por ese cliente; rutas sin `/v1` en el cliente. |
| Backend | `backend/src/handlers/api.ts`, `admin.ts`, `users.ts`; AWS SDK v3 y módulos por dominio | Crear módulos de dominio y agregar ramas a handlers existentes. |
| Persistencia | DynamoDB. `infra/lib/luva-stack.ts`: tabla Luva `pk/sk`, tablas por dominio, CDK, Cognito, S3/CloudFront | No agregar SQL, Prisma, otro backend o almacenamiento multimedia nuevo. |
| Personajes | `backend/src/data/characters.ts`: array TypeScript `CHARACTERS`, no JSON literal | Migrar esta fuente real. `CharacterDefinition` vive en `backend/src/types.ts`. |
| IDs | Ejemplos: `initials:meet_mateo_first_mission`, `Emma_Brooks` | Preservar exactamente mayúsculas, signos y contenido. URL-encode al construir rutas. |
| Chat | `FriendChatScreen`, `useFriends`, `localFriends`, `localFriendConversations`; `/friends` y `/public/friends` | `friendId === characterId`; mantener chat autenticado y anónimo. |
| Memoria | `backend/src/memory/*`; Pinecone por `characterId` y `friendshipId = userId#friendId` | No renombrar IDs, namespaces ni regenerar embeddings como parte de esta migración. |
| Biografía larga | `backend/src/admin/biography.ts`, `CharacterBiographiesTable`, editor existente | Ya está en DB; es diferente del tagline `characterBio`. Conservar este subsistema. |
| Progreso educativo | Cliente: cards/stories; backend: cards/characters, con compatibilidad legacy | No insertar reproducción en ese documento ni modificar sus normalizadores. |
| Pruebas | Backend: build TypeScript + `node --test`, tests JS que importan `dist` | Mantener ese patrón. App no tiene un runner de tests declarado. |

No se encontraron `AGENTS.md` dentro del repositorio durante la inspección. Hay cambios locales previos en `app/app.config.js`, `app/package.json`, `backend/src/handlers/api.ts`, biografías y memoria, además de archivos sin seguimiento. Son trabajo del usuario: no revertirlos, sobrescribirlos ni incluirlos indiscriminadamente en commits.

### Consumidores del catálogo de personajes que deben cambiar

- `backend/src/handlers/api.ts`: import de `CHARACTERS`; `findCharacter`, `publicCatalogFriend`, `listCatalogFriends`, `resolveCharacterFromBody`; feed de videos. Hacer asíncronos los helpers y todos sus callers, incluidos chat público, perfil, alta y resolución de amigo.
- `backend/src/handlers/admin.ts`: lista de personajes y validaciones de posts, edición y biografía.
- `backend/src/character-posts.ts`: funciones que reciben el array; conservar su firma cuando sea útil y suministrar datos desde el repositorio nuevo.
- `backend/test/characters-data.test.js`: actualmente espera 52 personajes, pero la fuente compilada contiene 40 y el test falla antes del feature. Mantener la prueba del snapshot de migración y agregar tests del repositorio persistente. Derivar el conteo del snapshot inspeccionado, no de esa expectativa obsoleta.
- `backend/scripts/optimize-story-media.js`: hoy puede reescribir el archivo TypeScript; convertir a lectura/escritura en DB con dry-run. No permitir que sea una segunda fuente de verdad.
- `admin/src/features/admin/ui/AdminStoryCharactersPage.tsx`: quitar instrucciones que indican editar `characters.ts`.
- `app/src/onboarding/step-1/onboardingAvatars.ts`: URLs decorativas copiadas; no es un catálogo de agentes. Puede conservarse como asset estático documentado.
- Las historias educativas de `app/src/data/stories.json` y `seed/` son otro dominio; no migrarlas como series ni derivar personajes de ellas.

## 2. Alcance y decisiones cerradas

1. Home nuevo: catálogo de series. Discovery: series en vertical. Ambos usan el mismo `MicrodramaPlayer`.
2. Conservar `Feed` con el rótulo educativo «Aprender». Barra: Inicio, Descubrir, Aprender, Personajes, Ajustes; usar las traducciones existentes ES/EN. Conservar accesos a Deck, Lessons, Shadowing, MyJourney y la antigua Home desde Aprender.
3. Preservar la Home educativa como ruta `LearningHome`, ajustando su tipo de navegación; `Home` pasa al catálogo. No borrar sus componentes, progreso o tours; el tour anterior solo aparece en LearningHome.
4. Todos los episodios publicados son gratuitos. Separar `publicationStatus` de `accessPolicy: 'free'`; no activar paywalls, anuncios ni gasto de monedas por reproducción. Chat conserva sus reglas actuales.
5. Elegir hasta 5 personajes conversables explícitos por serie. La relación existe únicamente en metadatos de serie.
6. Resolver datos de presentación por lotes al leer, en vez de duplicarlos permanentemente: una entidad Character canónica, `chatCharacterIds` en serie, `chatCharacters` embebidos en cada respuesta pública de serie. Así no se necesita sincronización de copias.
7. Catálogo MVP: hasta 200 series publicadas, páginas de 20. Leer el conjunto acotado con Query paginada y proyección liviana; búsqueda por título normalizado en servidor y barajado determinista por semilla para Discovery. Cursor contiene versión, semilla, offset y filtro; validarlo. Sin índice de recomendaciones ni búsqueda externa. Documentar límite; nunca truncar silenciosamente al rebasarlo.
8. SRT inglés externo por episodio en S3/CloudFront. Video MP4 vertical compatible con los dispositivos objetivo; no construir transcoding, DRM o HLS para este MVP. La entrega de archivos reales es un prerrequisito editorial del lanzamiento.
9. Seguir con el reproductor instalado en el repositorio para este cambio. Cualquier sustitución de librería se evalúa como trabajo separado con documentación oficial y prueba en dispositivos.
10. Contextualización audiovisual del chat: MVP envía título de serie, título de episodio y posición como datos separados del historial. No incluir resúmenes de trama. La contextualización por hechos temporales y filtrado de memorias narrativas queda como extensión explícita, no como garantía implícita.

## 3. Datos y acceso

### 3.1 CharactersTable nueva

Partition key `characterId`, on-demand, RETAIN y recuperación a un punto en el tiempo mediante CDK. Variables `CHARACTERS_TABLE_NAME` para API y admin; permisos mínimos de lectura/escritura respectivos.

El registro conserva **todos** los campos actuales de `CharacterDefinition` sin renombrarlos: `characterId`, `storyIsInitial`, `characterTags`, `aiRole`, `caracterName`, `caracterPrompt`, `characterBio`, `characterSheetImageUrl`, `avatarImageUrl`, `avatarImageXsUrl`, `avatarImageMdUrl`. Agregar `schemaVersion:1`, `version`, `createdAt`, `updatedAt`, `catalogOrder`. No corregir la grafía legacy durante la migración.

Repositorio nuevo `backend/src/characters.ts`:

- `getCharacter(id)`, `listCharacters()`, `getCharacterPresentations(ids)`, `updateCharacter(id, patch, expectedVersion)`.
- `listCharacters` puede usar Scan paginada del catálogo pequeño existente. Nunca hacer Scan por cada personaje ni usarla para el catálogo de series.
- `getCharacterPresentations` deduplica IDs y usa BatchGet con proyección explícita, incluyendo PK; divide en lotes de hasta 100 y reintenta UnprocessedKeys con backoff acotado. Mantener el orden explícito de la serie.
- Mapper público de serie: solo `{characterId, name, avatarUrl, avatarXsUrl?, avatarMdUrl?}`. Nunca propagar objetos con spread desde Character.
- En MVP no cachear personajes en Lambda: editar un personaje debe verse en la siguiente recarga. El cliente puede conservar snapshots mientras reproduce y recargar al volver a catálogo.
- Mantener contratos legacy `/characters` y `/friends` durante esta migración. Hoy exponen `aiRole`; corregir todo ese contrato es otro cambio. El nuevo catálogo audiovisual sí usa una allowlist estricta desde el primer día.

### 3.2 MicrodramasTable nueva

Partition key `pk`, sort key `sk`, on-demand, RETAIN y recuperación a un punto en el tiempo. Variable `MICRODRAMAS_TABLE_NAME`.

| Item | Claves | Atributos |
| --- | --- | --- |
| Serie | `pk=SERIES#<seriesId>`, `sk=META` | `seriesId`, `title`, `searchTitle`, `synopsis` breve sin spoilers, `coverUrl`, `publicationStatus:draft/published`, `chatCharacterIds:string[]`, `episodeCount`, `firstEpisodeId`, `catalogOrder`, `version`, timestamps |
| Episodio | misma pk; `sk=EPISODE#<episodeId>` | `episodeId`, `seriesId`, `episodeNumber`, `title`, `durationMs`, `videoUrl`, `posterUrl?`, `subtitlesUrl`, `subtitlesLanguage:'en'`, `publicationStatus:draft/published`, `accessPolicy:'free'`, `version`, timestamps |

GSI `CatalogIndex`: únicamente META publicado lleva `catalogPk=PUBLISHED`, `catalogSk=<catalogOrder rellenado>#<seriesId>`. Proyectar datos de catálogo, nunca biografías o instrucciones. `episodeNumber` es positivo y único dentro de serie; al obtener detalle ordenar por ese campo, no por episodeId. IDs inmutables; cambiar título no cambia claves. Episodios en draft no aparecen en respuestas públicas.

Validación de publicación mediante importador: portada y sinopsis válidas, al menos un episodio listo con video y SRT, 1–5 personajes existentes, duración positiva, números únicos y contiguos desde 1. Se calcula `episodeCount`/`firstEpisodeId` al publicar, no con queries por serie al listar. El importador crea series de forma idempotente y de solo alta: si los datos existentes difieren, informa conflicto sin sobrescribirlos. Actualizaciones y despublicación requieren una operación administrativa de versión explícita fuera del importador.

`getSeriesDetail` consulta una partición (paginando si DynamoDB corta por tamaño), toma META y episodios, y hace un BatchGet de presentaciones. La app conserva el resultado para cambiar capítulos. Si se agrega endpoint individual de episodio más adelante, no deberá consultar personajes por separado.

### 3.3 Progreso en LuvaTable existente

Reutilizar `TABLE_NAME` y la tabla `pk/sk` (`LuvaTable`, no `LuvaUsersTable`); confirmar los grants de lectura y escritura del API. No usar UsersTable ni `/users/me/progress` para playback.

Claves construidas con helpers que codifican IDs, nunca con splits ambiguos:

- `pk=USER#<userId>`, `sk=MICRODRAMA#<seriesId>#SUMMARY`: `resumeEpisodeId`, `resumePositionMs`, `revision`, `updatedAt` del servidor, `completedAt?`.
- Misma pk, `sk=MICRODRAMA#<seriesId>#EPISODE#<episodeId>`: `positionMs`, `completed`, `updatedAt`.

Usar exactamente la identidad de `getUserIdentity`: hoy email normalizado o sub como fallback. No cambiar identidad de usuario ni chat en este feature.

Reglas:

- Guardado local inmediato; envío remoto cada 5 segundos mientras reproduce, y flush en pause, seek terminado, cambio de episodio/serie, blur, background, final y apertura de chat. No confiar en terminar un fetch durante unmount/background.
- Una cola serial por serie, con coalescing; nunca enviar una escritura por cada callback de posición. Cada muestra captura IDs del episodio y generación del player antes de cualquier await.
- Endpoint de escritura recibe `{episodeId, positionMs, event:'position'|'ended', expectedRevision}`. Validar pertenencia, publicación, posición finita/no negativa y clamp a duración de servidor. `ended` se acepta cerca del final (tolerancia 2 s); un seek por sí solo no declara completado.
- Transacción actualiza resumen y episodio con condición `revision === expectedRevision` (o creación con revision 0). Una repetición de la misma revisión no produce dos avances: devolver 409 con estado canónico actual.
- Al 409 prevalece el estado remoto: descartar la muestra pendiente antigua, rehidratar revisión y progreso; la próxima interacción fresca puede escribir sobre la revisión nueva. No reintentar automáticamente un seek antiguo como si fuera nuevo.
- `completed` es monotónico. La posición de reanudación sí puede disminuir por seek o rewatch; no usar `max(position)` para resume.
- Al finalizar un capítulo, guardar completado y dejar en resumen el siguiente publicado a 0; si es el último, conservarlo al final y mostrar «Serie terminada» con acción explícita Repetir. La transacción y el callback `didJustFinish` deben compartir esta regla y ser idempotentes a nivel de estado.
- Anónimo: AsyncStorage con owner `anonymous`; con sesión, key por userId. No mezclar usuarios al cerrar sesión. En login importar progreso anónimo solo para series sin progreso remoto; el remoto gana si ya existe. Retener fallos de red como dirty y sincronizar al recuperar sesión/red o al volver a primer plano.
- Progreso por episodio conserva lo ya visto, mientras SUMMARY representa la última reproducción. No convertir el documento entero en un único item creciente.

## 4. Contratos HTTP

Todos los paths de esta tabla son del servidor, con `/v1`. Validar límites, IDs, cursor y errores 400/401/403/404/409/503 de forma consistente con handlers existentes.

| Método y ruta | Respuesta / propósito |
| --- | --- |
| `GET /v1/microdramas?q=&cursor=&limit=20` | `{items:SeriesSummary[], nextCursor?}`. Cada serie incluye `chatCharacters`, `episodeCount`, `firstEpisodeId`; sin episodios completos. |
| `GET /v1/microdramas/discovery?seed=&cursor=&limit=20` | Mismo DTO; orden aleatorio estable por sesión/semilla, sin repetir dentro del snapshot del cliente. |
| `GET /v1/microdramas/:seriesId` | `{series:SeriesSummary, episodes:EpisodePublic[]}`; personajes embebidos en `series`. |
| `POST /v1/microdramas/progress/batch` | Autenticado. Body `{seriesIds:string[]}` (máx. 20); BatchGet de SUMMARY, `{items:SeriesProgress[]}`. Es lectura por POST, sin cambiar progreso. |
| `GET /v1/microdramas/:seriesId/progress` | Autenticado. `{summary, episodes:EpisodeProgress[]}` mediante Query por prefijo de serie. |
| `PUT /v1/microdramas/:seriesId/progress` | Autenticado. Body de §3.3. `{summary, episode}`; 409 incluye canónico. |
| `PUT /v1/admin/characters/:characterId` | Admin existente; patch validado de campos editables + `expectedVersion`. ID inmutable; nunca toca historial o biografía larga. |

Ordenar rutas estáticas `discovery`, `progress/batch` antes de `:seriesId` en el handler.

**API Gateway:** el proxy `ANY /v1/{proxy+}` actual no aplica Cognito. Crear recursos explícitos de progreso con authorizer Cognito, integrados a `apiFn`, y comprobar identidad también en handler. Agregar todos los métodos al manifest de Deployment y actualizar su versión. Las lecturas de catálogo pueden seguir siendo públicas. Admin conserva su authorizer y control de grupo. Nunca confiar en userId recibido en body.

### Presupuesto verificable contra N+1

- Catálogo/Discovery: Query del índice público (páginas según tamaño, no por serie) + un BatchGet deduplicado de presentaciones de la página. Con máximo 20×5 IDs cabe en un lote de 100, salvo reintentos o límites de bytes. Cero Get de personaje en loop.
- Detalle: Query de una partición + BatchGet de personajes de esa serie. Cero query por episodio.
- Progreso de las 20 tarjetas: un BatchGet independiente de summaries. No llamar al progreso de detalle para cada tarjeta.
- Seleccionar otro capítulo ya cargado: cero peticiones de personajes y cero recarga del catálogo. Fetch de video/SRT y persistencia de progreso sí son esperados.
- En tests contar comandos y claves, además de verificar DTOs. Retries de AWS deben tener límite y no convertirse en bucles infinitos. Ante personajes referenciados faltantes, devolver error controlado y registrar inconsistencia; no servir una lista silenciosamente incompleta.

## 5. Migración de personajes y cambio de fuente

Crear `backend/scripts/migrate-characters.js`, que lee el snapshot compilado de `CHARACTERS` y usa AWS SDK instalado. Contrato CLI:

```text
node scripts/migrate-characters.js --table <name> --region <region> --stage dev --dry-run --report <path>
node scripts/migrate-characters.js --table <name> --region <region> --stage dev --apply --report <path>
node scripts/migrate-characters.js --table <name> --region <region> --stage dev --verify --report <path>
```

`--dry-run` por defecto; exigir tabla, región y stage explícitos, imprimir destino y cuenta sin secretos. Para apply en producción exigir además `--allow-production` y un ARN de respaldo verificado. Detectar destino por configuración de stage/stack, no por adivinar si el nombre de tabla incluye «prod». Nunca ejecutar apply desde tests.

1. Exportar snapshot exacto fuente, checksum SHA-256 canónico, conteo e IDs; validar duplicados, campos requeridos, optional y orden. El informe privado no debe subir biografías/prompts al git o logs públicos.
2. Respaldar tablas relevantes antes del corte (Characters si ya existe, Friendships y CharacterBiographies) y registrar ARN/estado del backup. No escribir ni migrar Pinecone, Friendships o biografías largas.
3. Insertar solo faltantes con `attribute_not_exists(characterId)`. Si ya existe y equivale al snapshot, skipped. Si difiere, informar conflicto y salir con código no cero; no pisar ediciones hechas en DB.
4. Relectura consistente y comparación campo por campo de todos los campos fuente, ausencia/presencia y `catalogOrder`; ignorar únicamente timestamps/version generados. Reportar migrated/skipped/conflicts/missing y checksums.
5. Ejecutar apply dos veces en dev: la segunda no cambia datos ni timestamps. `--verify` no escribe. Los conflictos se resuelven explícitamente, nunca con overwrite automático.
6. Primera entrega: tabla + script + repositorio probado; consumidores pueden permanecer en fuente vieja hasta preparar el corte. Ejecutar migración y verify en dev antes de cambiar consumidores.
7. Segunda entrega: pasar TODOS los consumidores a DB, levantar un chat existente y uno nuevo/anónimo, validar perfil, posts, biografía y memoria; luego desplegar cambio de fuente en el entorno autorizado.
8. Durante el corte no permitir edición simultánea de la fuente antigua. Tras validar, mover datos fuente a snapshot exclusivo del script/tests; eliminar imports de runtime. Una tabla vacía/error de DB debe producir error controlado, no fallback al archivo.
9. Rollback del código mediante artefacto anterior y backups conservados. Si ya hubo ediciones DB, exportarlas antes de revertir para evitar servir datos viejos sin advertirlo. No borrar tablas ni reescribir historial para rollback.

Actualizar `optimize-story-media.js` para aplicar cambios de URLs contra DB con control de versión y dry-run. La edición de personajes en admin debe usar el endpoint nuevo; conservar el panel de biografía independiente y el purge existente sin ampliar su alcance.

## 6. Implementación móvil y comportamiento

### Archivos nuevos propuestos

```text
app/src/microdramas/types.ts
app/src/microdramas/api.ts
app/src/microdramas/useMicrodramas.ts
app/src/microdramas/MicrodramaProgressProvider.tsx
app/src/microdramas/progressStorage.ts
app/src/microdramas/progressSync.ts
app/src/microdramas/player/MicrodramaPlayer.tsx
app/src/microdramas/player/useMicrodramaPlayback.ts
app/src/microdramas/player/MicrodramaSubtitles.tsx
app/src/microdramas/player/MicrodramaEpisodesSheet.tsx
app/src/microdramas/player/MicrodramaCharactersSheet.tsx
app/src/screens/MicrodramaCatalogScreen.tsx
app/src/screens/MicrodramaPlayerScreen.tsx
app/src/screens/MicrodramaDiscoveryScreen.tsx
```

El provider comparte progreso/caché local y se monta en `app/src/App.tsx` dentro de AuthProvider. Cada superficie posee su instancia de player; no crear un segundo reproductor global persistente. Revisar ShadowingPlayerProvider y coordinar pausa de su audio al iniciar video; no deben sonar dos fuentes.

### Navegación

- Rutas: `Home:undefined`, `LearningHome:undefined`, `Discovery:undefined`, `MicrodramaPlayer:{seriesId:string; episodeId?:string}`. En FriendChat agregar `microdramaContext?:{seriesId;episodeId;positionMs}`.
- Home busca por título con debounce de 300 ms, cancela/ignora respuestas de búsquedas previas, grid vertical de dos columnas con títulos y estado «Continuar». Loading, vacío, error/reintento y caché visible.
- Al seleccionar serie: cargar detalle y progreso en paralelo cuando hay sesión; resolver episodio válido guardado o primer publicado. No iniciar primero el episodio 1 para después saltar al guardado.
- Revisar `OnboardingScreen.tsx`, `AccountAccessScreen.tsx`, `PaywallScreen.tsx` y todas las referencias a `Feed`, `openReels` y `closeTarget`: el término del onboarding y retorno por defecto van a Home. Los accesos explícitos a Feed siguen abriendo Aprender. Retirar el salto automático a los reels viejos del final del onboarding, manteniendo sus rutas manuales.
- Aprender conserva el Feed y añade un acceso visible a LearningHome y a las áreas educativas que aún no lo tengan. Probar que todas se alcanzan con navegación real.

### Player compartido

- Entradas: detalle de serie, episodeId seleccionado, estado de progreso y `active` de la superficie. Salidas: progreso, episodio terminado, abrir personajes, error. Home y Discovery usan exactamente este componente y controlador.
- Adaptar los patrones de `CharacterVideoPage`, sin arrastrar likes, métricas de posts, promociones o `useFriends` a la reproducción. Reutilizar `fetchSrtCaptions`; extraer helpers pequeños a módulo compartido si hace falta.
- Estados explícitos: loading, ready, playing, paused, buffering, ended, error. Autoplay solo cuando pantalla enfocada + app activa + página visible + medios listos + sin pausa manual/modal/chat.
- Seek con barra Pressable/PanResponder de React Native, posición actual y duración; evitar dependencia nueva solo para slider. Hidratar posición cuando video esté listo antes de reproducir. Clamp ante duración diferente.
- Deshabilitar looping. `didJustFinish` avanza una sola vez al siguiente capítulo ordenado dentro de la MISMA serie. Un gesto vertical cambia de SERIE, no de capítulo.
- Cada cambio de source incrementa un token de generación; ignorar callbacks/subtítulos/errores de la generación anterior. Pausar y descargar fuente al salir/unmount; limpiar listeners y timers.
- Sheets con Modal/Animated + safe area, patrones ya instalados. Sinopsis pública y selector de capítulos; todos accesibles en MVP. Abrir sheet pausa; cerrar restaura solo si antes estaba reproduciendo y la pantalla sigue activa.
- Subtítulos ingleses con posición en milisegundos convertida a segundos para helpers existentes. Cues malformados no bloquean video; mostrar aviso/reintento de subtítulos. Tocar segmento traduce usando API actual y pausa; caché por texto + idioma de apoyo. Soportar selección de palabra con Text anidados, conservando espacios/puntuación y traducción de segmento como alternativa accesible.
- Error de media muestra retry del mismo episodio/posición; no saltar capítulos silenciosamente. No precargar videos de toda la serie.

### Discovery

- FlatList vertical, pagingEnabled, altura medida considerando safe areas/barra, keys por seriesId y viewability estable. Una sola página activa y audible; ventana limitada. Detalle/SRT se cargan para activa y, como máximo, una vecina sin autoplay.
- Semilla nueva por sesión de Discovery; estable mientras se pagina. Deduplicar seriesId al agregar páginas, y no barajar en cada render. Al agotar catálogo mostrar final o acción explícita para volver a descubrir, sin loop infinito de peticiones.
- Para cada serie retomar el episodio de su progreso; volver a una serie en la misma sesión mantiene la posición reciente. Guardar progreso antes de cambiar de página sin bloquear el scroll por una red lenta.

## 7. Integración con chat y límite de spoilers

1. Sheet de personajes se renderiza desde `series.chatCharacters`; no cargar `/characters`, perfiles o `useFriends` por tarjeta/episodio para dibujarlo.
2. Al elegir personaje, capturar posición y paused/playing, persistir local y encolar remoto, pausar video. `navigation.navigate('FriendChat', {friendId:characterId, microdramaContext})` mantiene el player debajo; volver con goBack.
3. El chat existente resuelve/crea amistad con el ID persistente. Una carga adicional del personaje al entrar al chat sí está permitida. No generar friendId por serie o episodio y no crear otro endpoint de conversación.
4. **No** usar `postId`, `postContext` o `sourcePost` para la serie. `buildLocalFriendConversationKey` hoy incluye postId y hash de contexto: hacer eso fragmentaría el historial. `microdramaContext` no forma parte de conversationKey, claves AsyncStorage o amistad; el chat conserva su historial libre habitual.
5. Pasar contexto tipado en `sendFriendChatMessage` y en la ruta pública equivalente. Servidor valida serie publicada, personaje relacionado y episodio perteneciente; resuelve títulos desde DB, limita posición y no confía en textos de trama del cliente. Incluir solo datos mínimos en prompt temporal.
6. Mantener `friendshipId=userId#friendId`, snapshot, mensajes, afinidad y memoria existentes. No resetear conversación al cambiar contexto audiovisual ni guardar una sinopsis completa como memoria permanente.
7. Regreso al player: misma serie, episodio y posición; reanudar solo si estaba reproduciendo y la app está activa. En Discovery conservar también índice y orden de páginas. Si el stack fue reemplazado, restaurar desde provider/local, no desde un segundo chat.

El MVP evita introducir spoilers desde sus nuevos metadatos porque no envía trama ni eventos futuros. **No garantiza** filtrar spoilers que ya existan en aiRole, biografía larga, chats previos o Pinecone. Para publicar personajes de microdramas, revisar editorialmente que sus instrucciones y biografía sean seguras para el inicio de la serie. No cargar el guion completo en esos campos. Si se exige contextualización de trama progresiva después, agregar hechos por tiempo + metadata de serie/episodio a las memorias y filtro de recuperación; un simple prompt «no spoilers» no sustituye ese trabajo.

## 8. Carga de contenido

Crear `backend/scripts/import-microdramas.js` con `--manifest`, `--table`, `--characters-table`, `--region`, `--dry-run` por defecto, `--apply`, `--verify`. Usa repositorios/validadores compartidos compilados. Lectura de personajes por lote, validación completa antes de escribir y control de versión. Generar informe; no borrar series o episodios ausentes del manifest.

El manifest de contenido es una herramienta de importación, no fuente de verdad del runtime. Mantener fixture local de dos series, dos episodios por serie y un personaje compartido para pruebas. Referenciar IDs reales de personajes; no crear un segundo Mateo con ID `mateo` para imitar el ejemplo del requerimiento.

Usar las utilidades actuales de presigned uploads/S3/CloudFront. Ampliar whitelist de carpetas y tipos si hace falta para `microdramas` y SRT; no reutilizar rutas de audios de Shadowing con nombres engañosos. Documentar comandos de carga y formato del manifest. Panel visual completo para administrar series queda fuera del MVP; el script debe permitir operarlo sin cambiar código. No generar ni subir contenido editorial real sin archivos y destino autorizados.

## 9. Paquetes de trabajo para el modelo implementador

Ejecutar en orden. Cada paquete termina con pruebas y actualización de `HANDOFF.md`: archivos tocados, decisiones, comandos/resultados, limitaciones y siguiente paquete. Dividir commits cuando el usuario lo solicite; no incluir cambios ajenos. No declarar completado un paquete cuya aceptación no se comprobó.

| ID | Trabajo y archivos principales | Dependencia | Aceptación |
| --- | --- | --- | --- |
| P0 | Releer plan, git status y verificar baseline; conservar cambios del usuario | — | Registro reproducible de errores previos; sin modificar feature |
| P1 | CharactersTable en CDK, `backend/src/characters.ts`, migrador y tests | Local listo | Repositorio/migrador idempotente y tests; dry-run por defecto; falta ejecución AWS |
| P2 | Consumers async en api/admin; edición admin | Código listo | API y portal usan DB, alta/edición con control de versión; falta probar migración real y flujos contra entorno |
| P3 | MicrodramasTable/GSI, modelos y importador | Local listo | Manifiesto y validador/importador seguros; falta fixture editorial y carga de contenido |
| P4 | APIs de catálogo/detalle/Discovery | Local listo | DTO público, búsqueda, paginación, seed estable, consultas por lote y pruebas |
| P5 | Progreso, rutas Cognito y almacenamiento móvil | Local listo | Progreso por cuenta/anónimo, lotes, transacción y conflicto; pruebas para aislamiento, clamp y stale revision |
| P6 | Player, subtítulos, traducción, sheets y pantalla | Implementado | Compilación móvil; falta prueba en iOS/Android y ciclo real de video/subtítulos |
| P7 | Home, LearningHome, rutas, barra, onboarding/account/paywall e i18n | Implementado | Compilación móvil; Home apunta al catálogo y las pantallas educativas siguen accesibles |
| P8 | Discovery virtualizado, seed/cursor/detalle cacheado | Implementado | Vista vertical usa la misma reproducción y carga anticipada; falta QA visual y de rendimiento |
| P9 | Sheet personajes y contexto tipado en chat | Implementado | Contexto validado por servidor y no se guarda en el historial; falta probar navegación con chat vivo |
| P10 | Regresión, QA dispositivos, documentación operativa y reporte final | En curso | Builds pasan y 11 tests dirigidos pasan; suite completa conserva tres fallos previos; falta QA/distribución |

Para evitar que P2 requiera despliegue durante una sesión puramente local, completar código/tests de P1–P2 con repositorios simulados y dejar el corte de entorno como pendiente explícito. Se puede seguir con P3–P10 localmente; no presentar una migración simulada como validación real de dev/producción.

## 10. Pruebas y comprobaciones

Backend: seguir `backend/test/*.test.js` y `node:test`, mockear AWS con los patrones existentes; no llamar OpenAI/Pinecone/AWS reales en unit tests. Nuevos tests sugeridos: `characters-repository`, `characters-migration`, `microdramas`, `microdramas-progress`, `microdramas-api`.

Mínimos automatizados:

- Migración: todos los registros del snapshot actual (40 durante esta inspección; volver a contar al ejecutar), IDs exactos (incluido `Emma_Brooks`), todos los campos, orden, duplicados, segunda ejecución sin cambios, conflicto sin overwrite, verify sin escrituras; nunca escribe Friendships/biografías/Pinecone.
- Compatibility: await en todos los caminos antes síncronos, perfil/chat público y autenticado, alta de amistad existente sin perder snapshot/afinidad/memoria, `/characters` conserva contrato.
- Series: personajes compartidos deduplicados, response allowlist, draft no visible, cursor inválido, búsquedas con acentos/mayúsculas, orden de episodios y rechazo de personajes inexistentes.
- N+1: comparar página de 1 y 20 series; número de comandos depende de lotes/páginas, nunca número de series. UnprocessedKeys incompletos se reintentan y el agotamiento falla de forma controlada.
- Progress: auth real en gateway y handler, aislamiento usuario A/B, pertenencia episodio, NaN/negativos/duración, escritura concurrente y 409, final duplicado, capítulos vistos, seek atrás, reinicio, flush y muestras antiguas al cambiar episodio.
- Chat: no cambia clave local al introducir contexto, no sobrescribe conversación con otra por episodio, rechaza personaje no relacionado y contexto ajeno; títulos canónicos desde DB.

App: no instalar un framework grande de tests solo por este cambio. Extraer lógica pura de progreso, resolución de episodio y selección/cambios en módulos sin RN; probar con `node:test` + compilación TypeScript a carpeta temporal y runner documentado. Para UI y APIs nativas hacer QA en iOS y Android; una compilación exitosa no valida autoplay, audio, teclado o background.

| Escenario manual | Resultado esperado |
| --- | --- |
| Arranque con onboarding completado / terminar onboarding / cerrar oferta | Home catálogo en las tres rutas |
| Home → player → seek → cerrar/reabrir app | Mismo episodio y posición guardada, tolerancia acorde al guardado de 5 s |
| Fin capítulo / último capítulo | Siguiente dentro de serie / estado final sin bucle |
| Discovery scroll rápido arriba/abajo | Una fuente audible, sin saltos por callbacks antiguos |
| Selector de capítulos y personajes | Pausa reversible, relación de serie constante |
| Chat existente desde Home y Discovery → volver | Mismo historial/memoria y posición, mismo índice en Discovery |
| Traducción palabra/segmento; cambiar idioma de apoyo | Texto traducido correcto o error recuperable; no caché cruzada de idiomas |
| Background, auriculares/interrupción, shadowing activo | Audio coordinado; no autoplay fuera de foco |
| Sin red / red vuelve / API 401 / media/SRT 404 | Progreso local retenido, login/errores recuperables, sin pérdida silenciosa |
| Logout A → login B | No aparece ni se sincroniza progreso de A en B |
| Aprender, Deck, Lessons, Shadowing, MyJourney, Personajes, Ajustes | Funciones existentes alcanzables y progreso preservado |

Comandos de verificación (usar Node 20/22 compatible; el entorno tiene varias versiones):

```sh
export PATH=/Users/cardenas/.nvm/versions/node/v22.12.0/bin:$PATH
cd /Users/cardenas/luva/backend
npm test
cd /Users/cardenas/luva/app
./node_modules/.bin/tsc --noEmit
cd /Users/cardenas/luva/infra
npm run build
cd /Users/cardenas/luva/admin
npm run build
```

Agregar CDK synth/diff en dev cuando estén disponibles la configuración y credenciales, revisando que no sustituya recursos existentes, rutas Cognito y grants. Build de infra no sustituye synth/diff. No ejecutar deploy ni migración de producción como efecto de estos comandos.

## 11. Despliegue, límites y entrega

Orden operativo: respaldo → tablas/permisos nuevos → migrar/verificar personajes → backend DB y APIs → importar/verificar contenido → smoke test dev → app con entrada nueva → rollout al entorno autorizado. Antes de cambiar Home en una distribución, comprobar que existe al menos una serie válida reproducible. El catálogo vacío tiene UX, pero no constituye un lanzamiento del feature.

El MVP prepara `accessPolicy` y separa publicación de acceso; **no implementa** compras de episodios, ads, Premium audiovisual, recomendaciones, gestión visual completa de series ni protección completa contra spoilers de memorias históricas. No meter esos temas en el camino crítico.

El reporte final debe separar: código implementado y probado; migraciones realmente ejecutadas y destino; contenido disponible; comprobaciones manuales; compilaciones y fallos previos/nuevos; pendiente de despliegue o assets. No afirmar que hay series reales si solo se usaron fixtures.

## 12. Prompt de inicio para el siguiente modelo

> Implementa el feature descrito en `docs/microdramas/IMPLEMENTATION_PLAN.md` y `docs/microdramas/REQUIREMENTS.md`. Lee primero `docs/microdramas/HANDOFF.md` y `git status`; conserva los cambios ajenos. Ejecuta desde el primer paquete pendiente, una tarea pequeña a la vez, reutilizando navegación, chat, DynamoDB, S3 y componentes existentes. Las decisiones y contratos ya están fijados: evita rediseñar o ampliar el alcance. Verifica cada paquete, actualiza HANDOFF con comandos y resultados, y continúa mientras puedas avanzar localmente. No ejecutes migraciones/despliegues de producción sin destino, respaldo y autorización correspondientes. No confundas código preparado con infraestructura migrada ni QA de dispositivo ejecutado. Prioriza IDs/historial intactos, ausencia de N+1, una sola fuente audible y progreso consistente.
