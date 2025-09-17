# Prompt Development Notes

Esta guía resume la arquitectura actual y los puntos de extensión más frecuentes para que trabajar la app mediante prompts siga siendo ordenado a medida que crece.

## Panorama general
- **Cliente**: Expo + React Native (TypeScript) ubicado en `app/`.
- **Estado global**: Providers ligeros (`AuthProvider`, `CardProgressProvider`) envuelven a `AppNavigator` en `app/src/App.tsx`.
- **API**: cliente HTTP sencillo (`app/src/api/api.ts`) configurable vía `expoConfig.extra`.
- **Datos locales**: vocabulario estático en `app/src/data/learning_items.json` y progreso persistido en AsyncStorage (`CardProgressProvider`).

## Navegación y pantallas
- Las rutas están tipadas en `app/src/navigation/AppNavigator.tsx`. Al agregar una pantalla:
  1. Extiende `RootStackParamList`.
  2. Importa la nueva pantalla y registra `Stack.Screen` en el orden deseado.
  3. Actualiza los lugares que navegan hacia ella para respetar el nuevo tipo.
- Pantallas principales:
  - `HomeScreen`: entrada para elegir práctica/ historias.
  - `DeckScreen`: lista de cards + resumen gráfico de progreso; usa `useLearningItems` y `useCardProgress`.
  - `CardDetailScreen`: ficha de una card con CTA hacia práctica.
  - `PracticeScreen`: flujo guiado de práctica, grabación/evaluación y actualización de progreso.
  - `StoriesScreen` / `StorySceneScreen`: narrativa (verificar hooks asociados antes de modificar).
  - `ProfileScreen`: ajustes/perfil.

## Estado y helpers clave
- `CardProgressProvider` (`app/src/progress/CardProgressProvider.tsx`):
  - Persiste estados `todo | learning | learned` por `cardId` en AsyncStorage (`@luva/card-progress`).
  - Expo a `useCardProgress()` con `statusFor` y `setStatus`. Al cambiar la estructura de progreso, recuerda migrar/normalizar datos antes de sobrescribir AsyncStorage.
- `CardStatusSelector` (`app/src/components/CardStatusSelector.tsx`):
  - Chips reutilizables para cambiar estado de una card.
  - Props útiles: `allowedStatuses` para limitar opciones y `onStatusChange` para reaccionar (p.ej., navegar).
- `useLearningItems` (`app/src/hooks/useLearningItems.ts`):
  - Actualmente devuelve JSON estático; preparada para migrar a fetch remoto manteniendo la misma interfaz.
- `AuthProvider` controla login Cognito; provee `useAuth()` con `signIn/signOut`. Antes de expandir scopes o tipos de token, ajusta las keys almacenadas con cuidado.

## Flujo de práctica (resumen)
1. El usuario selecciona opción y graba audio (`useAudioRecorder` + `useUploadToS3`).
2. `PracticeScreen` inicia sesión (`/sessions/start`), sube audio, transcribe (`/transcribe`) y evalúa (`/evaluate`).
3. Al finalizar se envía `/cards/:id/complete` para streak/puntos.
4. Con resultado `correct`, se muestra un bloque de éxito: `CardStatusSelector` permite marcar la card como "En aprendizaje" o "Aprendida" y vuelve al deck.

Al extender el flujo:
- Aísla nueva lógica en helpers/hooks para mantener `PracticeScreen` legible.
- Si agregas pasos async, respeta el `state` (`'idle'|'recording'|…`) para que el UI siga consistente.

## API y configuración
- El cliente API usa `fetch`. Para nuevas rutas, expón helpers en `api.ts` o crea wrappers específicos en `/hooks`.
- Variables de entorno para el cliente se definen en `app/app.json` (`expo.extra`). Añade nuevas claves ahí y accede mediante `Constants.expoConfig?.extra`.

## Convenciones de estilo
- Componentes funcionales con hooks; no se usa Redux/MobX.
- Estilos inline simples. Para patrones más complejos, crea componentes en `app/src/components`.
- Comentarios breves y sólo donde aclaren conocimiento no obvio.
- Tipos: usa `type`/`interface` locales; reexporta si lo usan varios módulos.

## Guía rápida para prompts futuros
1. **Identifica el módulo** relevante revisando este archivo y la estructura en `app/src/` antes de solicitar cambios.
2. Al pedir ajustes:
   - Incluye ruta + contexto del archivo.
   - Menciona impacto esperado (UI, lógica, API) para evitar inconsistencias.
3. Para nuevas pantallas o providers, describe cómo deben integrarse con navegación y contexto.
4. Después de cambios grandes:
   - Verifica si es necesario documentar en este archivo.
   - Considera actualizar el resumen en `DeckScreen` / `PracticeScreen` si afectan tracking o experiencia.

Mantener esta guía actualizada conforme surjan nuevos módulos ayudará a que los próximos prompts sean más precisos y eviten regresiones.
