# Luva — estructura para el Project Deep Dive de Remitly

## La historia que conviene contar

No presentes Luva como una lista de features ni como “una app que usa IA”. La historia con más señal para Remitly es:

> **Construí y desplegué una experiencia móvil de práctica de inglés que permite al usuario obtener valor antes de crear una cuenta, conserva continuidad local entre sesiones, sincroniza progreso al autenticar y protege la complejidad de autenticación, IA, audio, almacenamiento y monetización detrás de contratos simples para el cliente.**

La tesis técnica es que optimizaste tres cosas que también importan en una experiencia financiera regional:

1. **Fricción:** el usuario puede comenzar como invitado y autenticarse cuando ya entendió el valor.
2. **Confiabilidad móvil:** borradores y conversaciones sobreviven cierres de la app en el mismo dispositivo; el progreso autenticado se reconcilia además entre dispositivos.
3. **Límites claros de confianza:** secretos, modelos y persistencia remota viven en AWS; la app conserva sólo el estado que necesita para responder rápido.

El feature principal para recorrer de extremo a extremo debe ser **una conversación por texto o voz con un personaje**, desde el feed/onboarding hasta la respuesta de IA y la persistencia del progreso. Es el flujo que mejor conecta producto, React Native, TypeScript, APIs, AWS y decisiones de confiabilidad.

---

## Estructura sugerida de la presentación

Diseñada para una exposición inicial de 20–25 minutos y luego preguntas.

### 1. Apertura: problema, usuario y resultado — 2 minutos

Cuenta:

- Usuario: alguien que entiende inglés, pero evita hablar por miedo a equivocarse o por falta de práctica real.
- Problema: las lecciones aisladas no crean la confianza de sostener una conversación.
- Propuesta: un feed móvil conduce a conversaciones contextualizadas con personajes, usando texto, voz e imágenes, con feedback y continuidad.
- Tu alcance: especifica con precisión qué diseñaste, implementaste, desplegaste y operaste personalmente.
- Estado real: plataformas publicadas, número de versiones y fechas. Añade sólo cifras verificables.

Frase posible en inglés:

> “I’ll focus on the mobile conversation journey because it forced me to make the most interesting tradeoffs across product friction, native lifecycle management, authentication, local persistence, and a serverless AWS backend.”

### 2. Restricciones que guiaron el diseño — 2 minutos

No empieces por tecnologías. Empieza por las restricciones:

- La primera sesión debía entregar valor sin exigir una cuenta.
- La experiencia tenía que funcionar en iOS y Android con un equipo muy pequeño.
- Audio, deep links, notificaciones y compras introducían ciclos de vida nativos.
- Una respuesta de IA puede tardar o fallar; el mensaje del usuario no debía desaparecer.
- Claves de IA y lógica de prompts no podían estar en el dispositivo.
- El contenido y el progreso debían evolucionar sin romper instalaciones anteriores.

### 3. Arquitectura de alto nivel — 3 minutos

Recorre el sistema de izquierda a derecha y detente. No expliques cada tabla ni cada Lambda.

```text
React Native + Expo + TypeScript
  ├─ React Navigation + deep links/push routes
  ├─ Contexts de sesión, progreso, compras e idioma
  ├─ AsyncStorage para caché, borradores y progreso local
  └─ SecureStore para tokens
             │
             ▼
      API Gateway REST /v1
        ├─ rutas públicas de onboarding/catálogo
        ├─ rutas Cognito para usuario/progreso/amigos
        └─ Lambda asíncrona para generación de imágenes
             │
             ▼
  Lambda (Node/TypeScript) ─ DynamoDB
             ├──────────── S3 + CloudFront
             ├──────────── SSM Parameter Store
             └──────────── servicios de IA

Servicios laterales del cliente:
RevenueCat · Mixpanel · Meta · Expo Notifications
```

Decisión resumida: **Expo aceleró el producto multiplataforma; servicios administrados redujeron carga operativa; TypeScript compartió el modelo mental entre app, backend e infraestructura, aunque no se compartan todos los tipos en un paquete común.**

### 4. Tres decisiones principales — 10–12 minutos

Dedica 3–4 minutos a cada una. Para cada decisión usa siempre el mismo patrón:

1. problema y restricción;
2. opciones consideradas;
3. decisión;
4. implementación concreta;
5. tradeoff o fallo encontrado;
6. resultado y qué harías a mayor escala.

Las tres decisiones que debes priorizar son:

1. **Guest-first y local-first, con reconciliación al autenticar.**
2. **Una frontera de red centralizada que absorbe autenticación y fallos transitorios.**
3. **El chat de voz como flujo explícito de estados y no como una secuencia feliz de callbacks.**

Las tarjetas completas aparecen en la siguiente sección.

### 5. Una iteración difícil o incidente — 3 minutos

Elige sólo uno que hayas vivido realmente. Los mejores candidatos que deja ver el historial del proyecto son:

- grabación iniciada mientras la app pasa a background;
- identidad anónima que después se convierte en una identidad Cognito/RevenueCat;
- migración de progreso basado en historias a progreso basado en personajes;
- generación de imágenes que excedía el tiempo razonable de una petición síncrona;
- pérdida o duplicación de contexto al reintentar el último intercambio del chat.

Usa formato: **síntoma → causa raíz → corrección → prevención**. Incluye cómo lo observaste y por qué la primera solución no bastaba.

### 6. Impacto y evidencia — 2 minutos

No inventes números. Prepara antes de la entrevista:

- instalaciones o usuarios activos;
- tasa de finalización del onboarding;
- porcentaje que inicia la primera conversación;
- latencia p50/p95 de respuesta del chat;
- tasa de error o retry;
- conversión del paywall por `source`;
- retención D1/D7, si existe;
- versiones publicadas y frecuencia de releases.

Si no tienes volumen suficiente, reporta evidencia operativa:

> “The sample size is still small, so I did not treat conversion changes as statistically significant. I used funnel instrumentation and qualitative failures to decide what to fix next.”

### 7. Deuda consciente y siguiente escala — 2 minutos

Termina mostrando criterio, no perfección:

- separar `FriendChatScreen` en un reducer/controlador de flujo, hooks nativos y componentes visuales;
- dividir `AuthProvider` y reducir el árbol de Context providers para limitar renders y acoplamiento;
- agregar pruebas de integración y E2E móviles; hoy la cobertura automatizada está concentrada en backend;
- añadir PKCE al Authorization Code Flow móvil;
- mover cualquier economía con valor real a un ledger remoto idempotente;
- introducir trazas y métricas de latencia/error de extremo a extremo, no sólo eventos de producto.

Frase de cierre:

> “The project taught me to distinguish fast local UX from authoritative state. That distinction is useful in any mobile product, and it becomes non-negotiable when the state represents money.”

---

## Decisiones técnicas que vale la pena defender

### Decisión 1 — Permitir valor antes del login y reconciliar después

**Prioridad:** máxima. Es la decisión que mejor une producto, mobile y la misión de Regional Experiences.

**Problema**

Pedir registro antes de que el usuario experimente una conversación aumenta abandono. Pero permitir uso anónimo crea dos fuentes temporales de estado: el dispositivo y la cuenta remota.

**Opciones**

- Exigir cuenta antes de cualquier uso: consistencia simple, mayor fricción.
- Mantener todo anónimo y local: onboarding rápido, sin continuidad multi-dispositivo.
- Guest-first con promoción de datos al autenticar: más complejidad de merge, mejor journey.

**Decisión**

Luva permite onboarding, catálogo, amigos y conversaciones anónimas con persistencia local. Al autenticar, sincroniza amigos/progreso compatibles y combina listas locales/remotas. El borrador y el snapshot anónimo de una conversación siguen siendo locales: no presentes esa parte como una migración completa de la conversación a la cuenta.

**Implementación que puedes señalar**

- `useFriends` elige rutas públicas o autenticadas según la sesión.
- `localFriends.ts` sanea registros de versiones anteriores, combina por ID, conserva máximos de contadores y usa el timestamp más reciente.
- `AuthProvider` ejecuta la sincronización de datos locales después de completar o restaurar la sesión.
- Onboarding y borradores se guardan en AsyncStorage para reanudarse.

**Tradeoff**

Los merges por timestamp o por máximo son reglas de dominio, no una solución universal. Funcionan para progreso monotónico y contadores aproximados, pero no para dinero ni para operaciones no conmutativas. Los relojes de los dispositivos también pueden divergir.

**Qué harías a escala Remitly**

- Mantener borradores y caché local para velocidad.
- Hacer que el servidor sea autoritativo para cualquier transición financiera.
- Enviar comandos con idempotency key y versión esperada.
- Modelar conflictos explícitos en lugar de “last write wins” para beneficiarios, compliance o desembolsos.

**Frase posible en inglés**

> “I deliberately separated fast local continuity from authoritative remote state. For learning progress, timestamp-based merge semantics were acceptable; for financial state I would keep the same responsive client but use server-owned, versioned and idempotent transitions.”

### Decisión 2 — Centralizar red, idioma y renovación de sesión

**Prioridad:** máxima.

**Problema**

Si cada screen maneja `fetch`, tokens y errores, aparecen respuestas inconsistentes, refresh simultáneos y lógica duplicada. En móvil, una conexión intermitente es normal, no excepcional.

**Opciones**

- `fetch` directo en cada feature: rápido al principio, difícil de hacer consistente.
- Adoptar una librería completa de data fetching y caché.
- Crear primero un cliente pequeño y controlado, adecuado al tamaño actual.

**Decisión**

Se creó un cliente API único que añade headers de idioma, resuelve el bearer token, normaliza errores, reintenta una vez después de un `401` renovando la sesión y aplica backoff corto sólo a `GET` retryables.

**Por qué sólo se reintenta GET automáticamente**

Un GET es seguro de repetir. Reintentar un POST sin una idempotency key puede duplicar mensajes, cargos o mutaciones. Esta es una decisión especialmente relevante para Remitly.

**Detalles defendibles**

- La renovación de tokens usa una promesa compartida para que varias peticiones no disparen múltiples refreshes.
- Los tokens se almacenan en SecureStore, no en AsyncStorage.
- El cliente distingue errores de red, 5xx y errores funcionales.
- La app envía idioma de interfaz y de soporte como parte del contrato regional.

**Tradeoff**

Es un cliente global y pequeño; todavía no ofrece cancelación uniforme, deduplicación de queries, cache invalidation sofisticada ni observabilidad distribuida.

**Qué harías después**

- TanStack Query para cache/deduplicación y estados de servidor.
- `AbortController` ligado al ciclo de vida de la screen.
- idempotency keys para writes reintentables;
- request/correlation IDs propagados a API Gateway y Lambda.

**Frase posible en inglés**

> “I made retries depend on HTTP semantics. Read operations get bounded retries; writes do not get blind retries because duplicate mutations are worse than an explicit recoverable error.”

### Decisión 3 — Modelar audio y chat como un flujo de estados

**Prioridad:** máxima y la mejor para demostrar React Native real.

**Problema**

Grabar parece una llamada a `start` y otra a `stop`, pero en móvil intervienen permisos, audio session de iOS, rutas de reproducción, app background, unmounts y carreras cuando el usuario toca rápido.

**Opciones**

- Manejar grabación dentro de cada screen.
- Encapsular la máquina de ciclo de vida nativo en un hook.
- Usar un SDK de voz end-to-end, cediendo control y aumentando costo/acoplamiento.

**Decisión**

`useAudioRecorder` es dueño de permisos y transiciones de audio. Usa refs para estado mutable, un token de ciclo de vida para cancelar inicios en curso, escucha `AppState`, limpia al entrar en background/unmount y restablece el modo de reproducción en `finally`.

En el chat, la UI pasa por estados explícitos como idle, recording, uploading/transcribing y evaluating. El mensaje del usuario se agrega y persiste localmente antes de esperar la respuesta, de modo que una falla no borra su intención.

**Carga de medios**

El backend entrega un presigned PUT de S3. El dispositivo sube audio directamente a S3 y luego envía sólo el `sessionId` para transcripción/evaluación. Eso evita pasar binarios por API Gateway/Lambda y reduce memoria, costo y latencia del backend.

**Tradeoff**

- El flujo actual tiene complejidad distribuida entre screen y hooks.
- La UI optimista necesita una política clara de retry, deduplicación y reembolso de monedas.
- La grabación usa una API de Expo que deberá mantenerse al migrar SDKs.

**Qué harías después**

- Reducer o state machine formal para transiciones válidas.
- IDs estables generados antes de enviar y usados como idempotency keys.
- Métricas por etapa: permiso, upload, transcripción, evaluación y render.
- Pruebas E2E de background/foreground, permiso denegado y red interrumpida.

**Frase posible en inglés**

> “The hardest part was not recording audio; it was making cancellation and cleanup correct when the app lifecycle changed halfway through an asynchronous start.”

### Decisión 4 — Serverless administrado para un producto pequeño

**Prioridad:** alta, pero mantenla como soporte de las tres principales.

**Problema**

Se necesitaban APIs, auth, almacenamiento de medios, contenido y procesos asíncronos sin dedicar un equipo a operar servidores.

**Decisión**

AWS CDK define API Gateway, Lambdas separadas por responsabilidad, Cognito, DynamoDB, S3/CloudFront y SSM. DynamoDB usa on-demand billing y los recursos persistentes tienen `RETAIN`.

**Por qué fue razonable**

- bajo costo y poca operación durante tráfico irregular;
- infraestructura reproducible por ambiente;
- permisos IAM explícitos por función;
- funciones separadas para API general, usuarios, onboarding, admin y trabajo asíncrono.

**Tradeoff**

- cold starts y límites de tiempo;
- una Lambda/API general muy grande puede convertirse en un monolito serverless;
- DynamoDB exige diseñar accesos por adelantado;
- REST y tipos de cliente/backend todavía pueden desviarse.

**Siguiente escala**

Extraer dominios con límites claros, generar clientes/tipos desde OpenAPI, añadir DLQ para trabajos asíncronos y definir SLOs por journey.

### Decisión 5 — Autenticación gestionada, sesión segura en el dispositivo

**Prioridad:** alta si preguntan por onboarding, seguridad o ownership.

**Decisión**

Cognito concentra email y proveedores sociales. La app usa deep-link callback, valida `state`, intercambia el authorization code, guarda tokens en SecureStore, renueva la sesión con margen antes del vencimiento y limpia identidad de RevenueCat, push y analytics al cerrar sesión.

**Lo que no debes sobreafirmar**

El flujo móvil actual valida `state`, pero no implementa PKCE en el código revisado. No lo llames “financial-grade OAuth”. La respuesta madura es:

> “State protects the request/response binding, but a public mobile client should also use PKCE. That is one of the security changes I would require before treating this as a financial application.”

**Otro tradeoff**

El provider central simplificó la coordinación inicial, pero creció demasiado. Separar sesión, perfil y sincronización post-login mejoraría testabilidad y ownership.

### Decisión 6 — Persistencia con esquema, saneamiento y compatibilidad hacia atrás

**Prioridad:** alta para demostrar que mantuviste versiones reales.

**Problema**

AsyncStorage persiste entre releases. Cambiar una forma de datos sin migración puede bloquear el arranque o perder progreso. Además, el dominio pasó de historias/misiones a personajes.

**Decisión**

- Validar y normalizar todo lo leído de storage/API.
- Aceptar campos legacy y convertirlos a la forma actual.
- Usar timestamps y tombstones (`deletedAt`, `resetAt`) para que un reset no sea revivido por otro dispositivo.
- Mantener temporalmente una representación legacy desde el backend para clientes anteriores.

**Tradeoff**

Las migraciones “on read” reducen pasos de despliegue, pero acumulan ramas de compatibilidad. Deben tener versión, telemetría y fecha de retiro.

### Decisión 7 — Fallback local para contenido remoto

**Prioridad:** media; excelente conexión con Regional Experiences.

**Decisión**

El onboarding se puede servir desde backend y localizar, pero la app lleva defaults tipados. La respuesta remota se sanea y se combina con esos defaults. Si red o contenido fallan, la primera experiencia todavía funciona.

**Valor de producto**

Permite iterar copy y experiencia regional sin esperar siempre una release, evitando que un error de CMS/backend deje el onboarding vacío.

**Tradeoff**

Hay dos fuentes de contenido. El contrato necesita versionado y observabilidad para saber cuándo se activó el fallback.

### Decisión 8 — Monetización desacoplada de la UI

**Prioridad:** media. Úsala si preguntan por pagos o product mindset, no como analogía directa a una transferencia.

**Decisión**

RevenueCat abstrae StoreKit/Google Play y expone entitlement. La identidad anónima se enlaza con `cognitoSub` al autenticar. El paywall recibe un `source`, por lo que la conversión se puede atribuir al punto real de fricción. La UI consume `isPro` y balances desde providers, no desde llamadas dispersas al SDK.

**Límite importante**

Las monedas gratuitas actuales son estado local y sirven para una economía de engagement, no para valor financiero. En Remitly, balance, fees, promociones y transferencias serían estados remotos auditables; nunca AsyncStorage.

### Decisión 9 — Telemetría fuera del camino crítico

**Prioridad:** media-alta para Product Interview; breve en Project Deep Dive.

**Decisión**

La navegación registra cambios de screen. El chat distingue `submitted` de `sent`, lo que permite separar intención de éxito técnico. Likes, analytics y varios contadores se ejecutan best-effort para no bloquear la conversación. Analytics de desarrollo puede desactivarse para no contaminar producción.

**Tradeoff**

Los eventos no sustituyen observabilidad técnica. También se debe revisar minimización de PII y gobernanza de propiedades antes de escalar.

### Decisión 10 — Version gate y ambientes separados

**Prioridad:** media, útil para ownership operativo.

**Decisión**

La configuración Expo distingue identificadores, schemes, Cognito y API por ambiente. El contrato del version check y la UI soportan recomendar o exigir actualización, protegiendo contratos incompatibles.

**Estado actual que debes conocer**

En la política revisada, `recommendedMinimumVersion` y `minimumSupportedVersion` tienen el mismo valor, por lo que el estado optional no es alcanzable. La suite conserva una expectativa anterior y por eso falla ese test. Corrige política o test antes de mostrar este mecanismo como un rollout gradual.

**Tradeoff**

Un required update debe ser una herramienta de emergencia, no la estrategia normal de compatibilidad. Si el endpoint falla, el código actual deja continuar al usuario: disponibilidad sobre enforcement.

---

## Cómo conectar Luva con Remitly sin forzar la comparación

| Luva | Señal transferible a Remitly | Diferencia que debes reconocer |
|---|---|---|
| Guest-first onboarding | Reducir fricción antes de pedir compromiso | KYC/compliance puede obligar a bloquear pasos concretos |
| Borradores y caché local | Continuidad en conectividad móvil irregular | Un estado de transferencia nunca puede tener al cliente como source of truth |
| GET retries acotados | Resiliencia consciente de semántica HTTP | Writes financieros requieren idempotency key y reconciliación |
| Cognito + SecureStore | Gestión de identidad y sesión móvil | Faltan PKCE, controles de riesgo y device binding de nivel financiero |
| Presigned upload a S3 | Evitar binarios pesados en el API | Documentos sensibles requieren retención, cifrado y acceso más estrictos |
| Idioma de app + idioma de soporte | Experiencias regionales explícitas en el contrato | Dinero exige además moneda, corredor, regulación y formato local |
| RevenueCat entitlement | Integración de pagos y estado de acceso | Suscripción no equivale a ledger, settlement o disbursement |
| `submitted` vs `sent` | Medir fricción separada de confiabilidad | Remitly necesitaría estados end-to-end de funding y disbursement |
| Version gate | Proteger usuarios de clientes incompatibles | APIs financieras deben mantener compatibilidad y rollouts graduales |

La mejor conexión verbal es:

> “I would not claim that a subscription or virtual-coin flow is equivalent to moving money. What transfers directly is how I reason about mobile friction, retries, authoritative state, session security, and making failures recoverable.”

---

## Preguntas técnicas probables y estructura de respuesta

### “Why Expo instead of bare React Native?”

- Equipo pequeño y necesidad de iterar iOS/Android rápido.
- Expo cubría audio, notificaciones, linking, filesystem y builds.
- Aceptaste dependencia del SDK y necesidad de development builds por módulos nativos.
- Bare RN sería razonable si necesitaras una integración nativa no soportada o control fino de startup/binary size.

### “Why Context instead of Redux/Zustand/TanStack Query?”

- Al inicio había pocos dominios globales y Context minimizaba dependencias.
- Providers encapsularon contratos estables: auth, progreso, compra, idioma.
- El crecimiento revela el límite: árbol profundo, providers grandes y renders amplios.
- Próximo paso: servidor en TanStack Query; reducer/store por flujos complejos; Context sólo para dependencias estables.

### “How do you handle two devices updating progress?”

- Cada entrada lleva `updatedAt`.
- Se hace merge por ítem, no se reemplaza todo el documento.
- `resetAt`/`deletedAt` actúan como tombstones para que datos viejos no reaparezcan.
- Una cola serializa pushes desde el dispositivo.
- Reconoce clock skew: para más riesgo usarías versión del servidor/conditional writes y server timestamps.

### “What happens when the network fails after the user sends?”

- El mensaje se inserta y persiste localmente antes de esperar IA.
- La UI sale de evaluating y muestra error sin borrar el mensaje.
- El usuario puede conservar el borrador o reintentar el intercambio.
- Mejora pendiente: outbox explícita con estados `pending/sent/failed`, idempotency key y retry seguro.

### “How do you prevent duplicate requests?”

- GETs pueden repetirse; writes no se reintentan automáticamente.
- Algunas métricas se deduplican en memoria por clave.
- La respuesta honesta: el chat aún necesita idempotencia end-to-end persistente para cubrir double taps, timeouts y reinicios.

### “How do you protect secrets?”

- La app no contiene claves privadas de IA.
- Lambdas leen SecureString desde SSM con IAM limitado.
- El cliente usa presigned URLs de vida corta para medios.
- Tokens de usuario se guardan en SecureStore.
- Reconoce que claves públicas de SDK/config móvil no se tratan como secretos.

### “How do you make the app regional?”

- Idioma de interfaz y soporte son conceptos separados.
- Viajan en headers, no dependen sólo del locale del dispositivo.
- Copy de onboarding tiene fallback local por idioma.
- A mayor escala: locale/moneda/zona horaria/corredor como tipos explícitos; formatos con `Intl`; pruebas pseudo-localizadas y RTL.

### “How did you test it?”

Respuesta exacta y honesta:

- TypeScript strict en app, backend e infraestructura.
- Tests automatizados del backend cubren rutas y lógica de dominio.
- Validación manual/dispositivo para ciclos nativos.
- La app no tiene hoy una suite automatizada equivalente; es deuda prioritaria.
- Siguiente capa: unit tests de merges/reducers, React Native Testing Library y Maestro/Detox para journeys críticos.

### “What would break first at 100x scale?”

- Latencia/costo de llamadas de IA y límites de concurrencia antes que React Native.
- Lambda general y handler de API demasiado grandes para ownership independiente.
- Hot partitions o patrones de acceso DynamoDB si cambian los journeys.
- Polling de jobs de imagen debería evolucionar a push/event notification.
- Falta observabilidad distribuida y presupuestos de latencia por etapa.

### “Why TypeScript on the backend if our stack is Go/Java/Kotlin?”

> “TypeScript let a small team move across mobile and backend with one language and strict contracts. The backend choices I would carry over are domain boundaries, idempotency, auth, observability, and failure semantics; I’m comfortable expressing those in a strongly typed Go, Java, or Kotlin service.”

### “What was your biggest mistake?”

Una buena respuesta basada en el código:

> “I optimized for iteration speed and allowed the chat screen and auth provider to accumulate too many responsibilities. It helped me validate the product, but it made state transitions harder to test. I would now extract a typed reducer/state machine and split session, profile, and post-login synchronization before adding more features.”

---

## Evidencia en el repositorio para tener abierta

No muestres archivos gigantes de principio a fin. Prepara bookmarks en fragmentos concretos:

1. `app/src/App.tsx` — composición de capacidades globales.
2. `app/src/navigation/AppNavigator.tsx` — rutas tipadas, onboarding inicial, deep links y push routing.
3. `app/src/api/api.ts` — headers regionales, refresh tras 401 y retry de GET.
4. `app/src/auth/AuthProvider.tsx` — SecureStore, single-flight refresh y sincronización post-login.
5. `app/src/shared/useAudioRecorder.ts` — permisos, `AppState`, cancelación y cleanup.
6. `app/src/screens/FriendChatScreen.tsx` — sólo el bloque de envío optimista/persistencia; no abras las 3,000 líneas completas.
7. `app/src/friends/localFriendConversations.ts` — esquema/saneamiento de snapshots.
8. `app/src/friends/localFriends.ts` — merge de identidad anónima/remota y compatibilidad legacy.
9. `app/src/progress/CardProgressProvider.tsx` y `app/src/progress/sync.ts` — cola, merge por entrada y tombstones.
10. `app/src/hooks/useFeedPosts.ts` — stale cache usable mientras se revalida red.
11. `infra/lib/luva-stack.ts` — límites AWS, IAM, Cognito authorizer y rutas; enseña una sección pequeña.
12. `backend/src/handlers/api.ts` — presigned audio upload o job asíncrono de imagen, no el router completo.

---

## Checklist de preparación

- [ ] Define en una frase el usuario y el problema, sin mencionar tecnología.
- [ ] Escribe tu ownership exacto: diseño, app, backend, infra, release y operación.
- [ ] Confirma qué versión está realmente en App Store/Play Store y qué features están desplegados.
- [ ] Reúne 3–5 métricas reales; si no hay muestra suficiente, dilo.
- [ ] Dibuja la arquitectura en una sola lámina.
- [ ] Prepara tres decisiones con alternativas y tradeoffs, no diez features.
- [ ] Ensaya el recorrido texto/voz con datos ya cargados.
- [ ] Graba un video de respaldo por si falla red, IA o simulador.
- [ ] Oculta `.env`, tokens, correos y dashboards con PII.
- [ ] Ten listas las respuestas sobre PKCE, idempotencia, clock skew y ausencia de tests móviles.
- [ ] Practica una versión de 5 minutos por si te interrumpen pronto.
- [ ] Detente después de cada decisión para invitar preguntas.

### Estado de verificación del repositorio al preparar esta guía

- La app pasa `tsc --noEmit` con TypeScript strict.
- El backend compila.
- La suite del backend ejecuta 55 tests: 52 pasan y 3 fallan por expectativas que hoy no coinciden con la política de versiones/URL de App Store y con el número actual de personajes. Reconcílialas antes de decir que la suite está verde.
- El `node` por defecto de la máquina es 16.14 y no soporta el runner usado por `node --test`; el proyecto de app declara Node 20 o 22. Ejecuta la verificación final con una de esas versiones.

## Versión de 60 segundos

> “Luva is a React Native application that helps English learners build speaking confidence through contextual conversations with AI characters. I owned the mobile journey and the supporting AWS serverless backend. The core design challenge was letting users experience value before signing up without losing continuity later. I kept drafts and conversations local for fast recovery, then reconciled compatible progress and friend state after Cognito authentication. I centralized token refresh, regional headers and bounded read retries in the API layer, while keeping writes non-retryable until they have idempotency. For voice, I treated app lifecycle and cancellation as first-class states, and uploaded audio directly to S3 with presigned URLs. I’ll walk through those decisions, their tradeoffs, and what I would change when the state represents real money rather than learning progress.”

## Regla final

La entrevista no evalúa cuántas tecnologías logras nombrar. Evalúa si puedes demostrar:

- que una restricción real produjo una decisión;
- que consideraste alternativas;
- que entiendes el costo de lo que elegiste;
- que viste el sistema fallar y lo mejoraste;
- que sabes qué parte de la solución deja de ser válida cuando aumenta el riesgo o la escala.
