# Plan: Aprender con palabras y frases guardadas de videos

Estado: implementación local terminada; validaciones de compilación completadas.
Fecha: 24 de octubre de 2026.

## Objetivo y alcance

Mantener el nombre **Aprender** en el menú y convertir esa sección en la biblioteca personal de palabras y frases que el usuario guarda después de traducir un subtítulo de video. Desde cada elemento se podrá consultar su significado, hacer preguntas a un tutor de IA y marcarlo como finalizado.

Este documento conserva el alcance y los criterios acordados para la implementación.

Primera versión: app móvil (`app/`), backend y rutas de infraestructura necesarias. Incluir el reproductor de microdramas y los videos del feed. No ampliar esta entrega a traducciones de chats, onboarding, lecciones, shadowing, web, ejercicios, notificaciones ni repetición espaciada.

## Hallazgos del código actual

- `app/src/components/AppTabBar.tsx`: el tab con clave `feed` muestra `tabs.learn` (Aprender), pero navega a `Feed`. No confundirlo con `LearningHome`.
- `app/src/navigation/AppNavigator.tsx`: `Home` es el catálogo de microdramas; `LearningHome` es el vocabulario anterior (`screens/HomeScreen.tsx`); `Feed` sigue siendo una pantalla independiente. El cambio debe añadir rutas sin reutilizar por accidente estas pantallas.
- `app/src/microdramas/player/MicrodramaPlayer.tsx`: muestra subtítulos, permite tocar palabras y traducir la frase completa.
- `app/src/microdramas/player/useSubtitleTranslation.ts`: ya fija la selección durante la traducción, pausa el video e invalida respuestas al cambiar episodio o idioma. Provee `selectedText`, `displayedSubtitle` y `translatedText`.
- `app/src/screens/FeedScreen.tsx`: el componente de videos tiene su propia traducción de subtítulos, con `activeSubtitle`, `activeSubtitleKey`, `activeTranslation` y `handleTranslateSubtitle`.
- `POST /v1/translate` en `backend/src/handlers/api.ts` devuelve la traducción. No guarda vocabulario.
- `backend/src/microdramas-progress.ts`: referencia útil para repositorios DynamoDB con partición por usuario e inyección del cliente para pruebas.
- La asistencia de `PracticeScreen.tsx` y `/practice/assist` depende de historias y misiones. Sirve de referencia visual/técnica, pero no es el contrato adecuado para un tutor de frases.
- `app/src/api/api.ts` ya soporta GET, POST y PUT. Usar PUT para actualizar estado evita ampliar el cliente con PATCH.
- `infra/lib/luva-stack.ts` registra rutas explícitas con Cognito y un proxy genérico. Registrar explícitamente las nuevas rutas privadas.

El checkout tiene numerosos cambios previos, incluidos archivos de navegación y microdramas todavía sin seguimiento. Trabajar sobre el estado presente; no restaurar, descartar, reformatear masivamente ni reemplazar esos cambios.

## Experiencia propuesta

### 1. Guardar desde un video

1. El usuario traduce una palabra o un subtítulo.
2. Cuando hay una traducción válida, aparece debajo el botón **Agregar a repaso**.
3. Al tocarlo: **Guardando…**, luego **Agregado a repaso**. El video permanece pausado y no cambia de pantalla.
4. Guardar exactamente el texto traducido y su traducción, junto con la frase completa como contexto si se seleccionó una palabra.
5. El botón no aparece durante la traducción ni ante errores. Si falla el guardado, conservar la traducción y permitir reintentar con un error breve.
6. Un doble toque, una respuesta perdida o guardar lo mismo desde otro video no crea duplicados. Si ya está finalizado, mostrar **Ya finalizada**; reabrirlo desde su detalle.

Capturar una instantánea inmutable de selección, idioma, resultado y origen antes de enviar el guardado. Nunca mezclar texto de un subtítulo con la traducción del siguiente. En el feed, fijar la selección al pausar y proteger cambios de idioma, video y respuestas tardías, como ya hace el hook de microdramas.

### 2. Nueva pantalla Aprender

- Encabezado **Aprender**, con filtros **Por repasar** (predeterminado) y **Finalizadas**.
- Cada fila muestra palabra/frase en inglés y significado en el idioma en que se guardó. Mostrar el idioma cuando ayude a distinguir traducciones.
- Orden: guardadas más recientemente primero; terminar un elemento no cambia su fecha de guardado.
- Tocar la fila abre el detalle pasando solamente `itemId`.
- Contemplar carga, paginación, error con reintento y actualización al volver del detalle.
- Vacío inicial: **Guarda palabras o frases al traducir un video y aparecerán aquí.** Con botón **Ver videos** hacia `Discovery`.
- Conservar acceso al feed anterior mediante una entrada visible **Explorar publicaciones** hacia `Feed`, también cuando ya hay elementos. No eliminar su ruta ni sus entradas actuales.
- Cambiar el tab a una clave propia `learn` y ruta `ReviewList`, conservando el texto `tabs.learn` y el icono. En `Feed` no presentar ese tab como activo: permitir `active="feed"` sin coincidencia o un estado neutral. La biblioteca usa `active="learn"`.

### 3. Detalle y preguntas

- Mostrar texto original, significado guardado y contexto de origen disponible (título del video y frase completa).
- La traducción es el significado inicial. No generar una definición adicional con IA al guardar o abrir: el usuario puede pedir una explicación más precisa en el tutor.
- Botón **Marcar como finalizada**; cambia estado sin borrar el registro y actualiza lista/detalle. En finalizadas, **Volver a repasar**.
- Sección **Pregúntale a la IA**, con campo de texto, enviar y sugerencias: **¿Cómo se usa?**, **Dame ejemplos**, **¿Por qué se dice así?**.
- Tutor enfocado en significado contextual, uso, gramática cuando corresponda y ejemplos breves en inglés. Explicaciones en el `supportLanguage` actual; la traducción guardada conserva su idioma original.
- Conversación de varias preguntas durante la visita, aislada por elemento. Primera versión: historial de chat en memoria; no se promete conservarlo al cerrar la pantalla. El estado de repaso sí se conserva en servidor entre sesiones/dispositivos.
- Mostrar envío y errores; retener la pregunta para reintento. No inventar una respuesta si falla el proveedor. Se puede finalizar sin usar el tutor.

## Modelo de datos propuesto

Crear tipos de dominio de repaso separados del catálogo estático de cartas:

```ts
type ReviewItem = {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string; // en en esta entrega
  targetLanguage: string; // supportLanguage al guardar
  contextText?: string;   // subtítulo completo, especialmente para palabras
  source: {
    type: 'microdrama' | 'feed_video';
    seriesId?: string;
    episodeId?: string;
    characterId?: string;
    postId?: string;
    positionMs?: number;
    title?: string;
  };
  status: 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};
```

- Fuente de verdad: DynamoDB existente `TABLE_NAME`, partición de usuario siguiendo la convención actual `USER#<usuario codificado>`. Obtener identidad exclusivamente de Cognito con el helper actual; no aceptar `userId` del body ni inventar identidad anónima.
- Identidad del elemento: hash calculado en servidor de texto normalizado + idioma origen + idioma destino. Normalizar Unicode, espacios y capitalización; conservar puntuación, apóstrofes y el texto original mostrado. El contexto no forma parte de la identidad en esta versión. Conservar el primer origen y traducción al guardar repetidos.
- Propuesta sin nueva tabla/GSI: un registro de lookup `REVIEW_LOOKUP#<hash>` y un registro de contenido `REVIEW_ITEM#<createdAt>#<hash>`. Crearlos atómicamente con escritura condicional; un duplicado devuelve el elemento existente. La lista consulta solo el prefijo `REVIEW_ITEM#`, en orden descendente. El lookup permite buscar por `id` sin escanear.
- Aplicar `status` como filtro de consulta, devolver cursor y continuar aunque una página resulte vacía con cursor. El cliente mantiene **Cargar más** hasta agotar cursor; no interpretar una página vacía como fin.
- Estado actualizado únicamente sobre el registro de contenido, con condición de existencia. Timestamps del servidor; `completedAt` se agrega al completar y se elimina al reabrir. Es suficiente que el último cambio aceptado por el servidor determine el estado.
- Sin mezclar estos elementos con `CardProgressProvider`, ni alterar puntos, monedas o progreso de cartas.

## Contratos API nuevos

Todos bajo `/v1`, autenticados con Cognito y comprobación de identidad dentro del handler:

| Método y ruta | Entrada | Respuesta |
| --- | --- | --- |
| POST `/review-items` | Texto, traducción, idiomas, contexto y origen | `{ item, created: boolean }`; 201 nuevo, 200 existente |
| GET `/review-items?status=pending&limit=30&cursor=…` | Estado opcional, límite máximo 100 y cursor opaco | `{ items, nextCursor? }` |
| GET `/review-items/{itemId}` | Identificador | `{ item }`, 404 si no pertenece al usuario o no existe |
| PUT `/review-items/{itemId}/status` | `{ status: 'pending' \| 'completed' }` | `{ item }` |
| POST `/review-items/{itemId}/ask` | `{ question, history?: [{ role, content }], supportLanguage }` | `{ answer }` |

Validar campos, enum de origen y códigos de idiomas; texto/contexto/traducción no vacíos cuando obligatorios, máximo 5,000 caracteres cada uno; pregunta máximo 2,000; historial máximo 12 mensajes y 12,000 caracteres totales; roles solo user/assistant. Limitar IDs/títulos y rechazar valores inválidos. Validar que el cursor corresponda a la partición del usuario y al prefijo correcto antes de usarlo.

El tutor carga el elemento desde la cuenta autenticada; el cliente no sustituye el texto guardado. Enviar al modelo texto, significado, idiomas y contexto, junto con historial acotado. Contenido e historial son datos, nunca instrucciones de sistema. Reutilizar el patrón actual de credenciales, llamadas al proveedor y modelo configurado en backend; no introducir un SDK ni cambiar el modelo global. Encapsular el tutor en un módulo propio. Respetar límites existentes de solicitudes/timeout; errores explícitos 400/401/404 y 502/503 para fallos del proveedor.

No reutilizar la conversación social con amigos, memorias, generación de imágenes ni cobros de esos flujos. Propuesta de alcance: sin nueva regla de monetización para esta función; cualquier política transversal ya existente sigue aplicando.

## Archivos y orden de implementación

1. **Backend y contratos.** Crear `backend/src/review-items.ts`, `backend/src/review-tutor.ts` y tipos en `backend/src/types.ts`. Repositorio con cliente inyectable. Registrar handlers en `backend/src/handlers/api.ts`; rutas Cognito en `infra/lib/luva-stack.ts`, incluyendo recursos intermedios y CORS. Reutilizar permisos existentes de la tabla y SSM; verificar que sean suficientes.
2. **Estado compartido de app.** Crear `app/src/review/types.ts`, `api.ts` y `ReviewProvider.tsx`; montar bajo `AuthProvider` en `app/src/App.tsx`. Centralizar guardado, estado de solicitudes y actualización de entidades para que lista, detalle y botones coincidan. Vaciar estado al cambiar cuenta; descartar respuestas de una sesión anterior. Sin cola offline en esta versión: un fallo de red no se anuncia como guardado.
3. **Guardar desde video.** Crear componente reutilizable `app/src/review/SaveReviewButton.tsx`. Integrarlo en `MicrodramaPlayer.tsx` y el componente de videos de `FeedScreen.tsx`. Revisar contexto/timestamps disponibles en cada reproductor. Usar identidad normalizada consistente para deduplicar solicitudes locales; el servidor es la autoridad. Si no se conoce aún si existe, el primer guardado puede resolverlo sin precargar toda la biblioteca.
4. **Lista y detalle.** Crear `app/src/screens/ReviewListScreen.tsx` y `ReviewDetailScreen.tsx`; añadir `ReviewList: undefined` y `ReviewDetail: { itemId: string }` al stack. Actualizar `AppTabBar.tsx` según la decisión de navegación. Mantener el acceso visible al feed. Reutilizar estilo, safe areas y espacio para mini reproductor/tab bar existentes.
5. **Tutor.** Integrar preguntas en el detalle con historial por elemento y manejo de respuestas tardías al salir/cambiar elemento. Separar el estado de envío del estado de finalización; preguntar no debe bloquear marcar finalizada.
6. **Textos.** Añadir claves en `app/src/i18n/translations.ts` para español e inglés. Diferenciar idioma de interfaz del idioma de apoyo. No extender ternarios dispersos ni forzar español para todos.
7. **Validación.** Añadir pruebas de comportamiento, ejecutar comprobaciones y revisar el flujo completo. Registrar resultados y fallos preexistentes. No desplegar ni publicar como parte de este plan; cuando comience la implementación, entregar el cambio local verificable salvo instrucciones adicionales.

## Criterios de aceptación y pruebas

- Traducir y guardar una frase desde microdramas y otra desde feed; ambas aparecen con el par texto/traducción correcto en Aprender.
- Guardar una palabra conserva esa palabra, su traducción y la frase completa como contexto.
- Doble toque, dos solicitudes simultáneas y reintento tras respuesta perdida producen un solo elemento. Repetir guardado no revierte `completed` ni cambia `createdAt`.
- Cambiar rápidamente episodio, subtítulo, selección o idioma no guarda combinaciones equivocadas ni muestra traducciones antiguas. Probar también idiomas con caracteres no latinos y `supportLanguage=en`.
- Lista paginada y filtros funcionan con páginas vacías intermedias; completar/reabrir actualiza el detalle y ambas listas sin reiniciar la app.
- Reiniciar sesión/app conserva el vocabulario; cambiar de cuenta limpia la caché y no deja que respuestas anteriores contaminen la cuenta nueva.
- Otra cuenta no puede consultar, cambiar estado ni preguntar sobre un ID ajeno; un cursor manipulado tampoco permite consultar otra partición.
- El tutor recibe el contexto de la frase, responde en el idioma de apoyo y permite preguntas sucesivas. No exige historia/misión/amigo. Fallos y reintentos no pierden la pregunta ni duplican turnos visibles.
- Aprender abre la biblioteca; Inicio y Descubrir conservan su navegación; el feed sigue accesible desde Aprender. Subtítulos, pausas, swipe de episodios y mini reproductor siguen funcionando.
- Pruebas backend propuestas: `backend/test/review-items.test.js` para repositorio/deduplicación/estado/paginación y ampliar `backend/test/api.test.js` para identidad, validación y tutor con proveedor simulado. Seguir el patrón de pruebas existente; no llamar a IA real desde tests.
- Comprobaciones al implementar: `npm run build` y pruebas pertinentes en `backend/`, TypeScript de la app (`npx tsc --noEmit`, anotando errores previos si los hay), compilación/síntesis de infraestructura según scripts existentes y revisión manual en simulador de los dos reproductores, lista y detalle.

## Instrucción de traspaso

Implementar este documento cuando el usuario pase a implementación. Empezar leyendo el estado actual y los diffs relevantes, porque navegación y microdramas ya tienen trabajo en curso. Completar backend, persistencia, ambas entradas de guardado, nueva sección Aprender y tutor; no entregar solamente pantallas con datos simulados. Preservar los cambios existentes y comunicar cualquier desviación necesaria del plan.
