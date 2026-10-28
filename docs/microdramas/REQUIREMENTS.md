# Implementar microdramas en Luva

Necesitamos incorporar los microdramas como una nueva experiencia principal de Luva, reutilizando la arquitectura y funcionalidades existentes.

Antes de modificar código, inspecciona el repositorio, identifica cómo están implementadas la navegación, los personajes, los chats, la persistencia y los servicios backend. Adapta la implementación a las convenciones del proyecto. Evita crear arquitecturas paralelas cuando ya existan componentes reutilizables.

## 1. Home — Catálogo de microdramas

Convertir la pantalla principal en un catálogo de series, inspirado en DramaBox.

MVP:
- Grid de portadas verticales.
- Título de la serie.
- Búsqueda.
- Acceso directo al reproductor al seleccionar una serie.
- Retomar automáticamente el episodio y la posición donde el usuario se quedó.
- Mantener accesibles las funciones originales de Luva mediante la navegación.

No implementar todavía sistemas complejos de rankings o recomendaciones.

## 2. Discovery — Feed vertical

Crear una experiencia de reproducción a pantalla completa con navegación vertical entre contenidos.

- Reproducción inmediata al entrar.
- Mostrar series de manera inicialmente aleatoria.
- Comenzar en el primer episodio o continuar desde el progreso guardado.
- Scroll vertical para descubrir otras series.
- Reproducción automática del siguiente capítulo dentro de una serie al terminar el actual.
- Mantener y persistir el progreso de reproducción.
- Reutilizar el mismo reproductor que utiliza Home.

## 3. Reproductor y capítulos

Implementar un reproductor compartido que permita:

- Reproducir videos verticales.
- Pausar, reanudar y controlar el progreso.
- Subtítulos en inglés sincronizados.
- Tocar palabras o segmentos de subtítulos para consultar traducciones, aprovechando la infraestructura educativa existente cuando sea posible.
- Abrir un bottom sheet con sinopsis y selector de episodios, inspirado en las referencias de DramaBox.
- Cambiar de episodio sin salir de la experiencia.
- Preparar la estructura para futuros episodios bloqueados, anuncios y Premium, pero inicialmente mantener todos los episodios disponibles gratuitamente.

## 4. Migración de personajes JSON → base de datos

Actualmente los personajes se administran mediante un JSON que ha crecido en complejidad.

Migrar este sistema a persistencia en base de datos.

Requisitos:

- Inspeccionar el esquema actual del JSON y todos los lugares donde se utiliza.
- Diseñar una representación persistente compatible con la arquitectura existente.
- Conservar los identificadores de personajes siempre que sea posible.
- Preservar biografías, personalidad, instrucciones de conversación, imágenes y demás propiedades utilizadas por el sistema actual.
- No romper los chats existentes, su historial ni las referencias que utiliza el sistema de memoria.
- Crear un script de migración idempotente y verificable.
- Eliminar la dependencia del JSON como fuente de verdad una vez validada la migración.
- No realizar migraciones destructivas en producción sin una estrategia de respaldo y validación.

## 5. Relación entre series y personajes

Los personajes conversables pertenecen a la SERIE, no a cada episodio.

Ejemplo:

Serie: Mateo & Emma

Personajes disponibles para conversar:
- Mateo
- Emma

No todos los personajes secundarios necesitan estar disponibles. Cada serie tendrá una selección explícita de uno o varios personajes conversables.

### Requisito crítico: evitar N+1

Se permite expresamente la desnormalización de información para optimizar lecturas.

La respuesta del backend que devuelve los metadatos de una serie debe incluir los datos de presentación necesarios de sus personajes conversables.

Ejemplo conceptual:

```json
{
  "id": "mateo-emma",
  "title": "Mateo & Emma",
  "coverUrl": "...",
  "chatCharacters": [
    {
      "characterId": "mateo",
      "name": "Mateo",
      "avatarUrl": "..."
    },
    {
      "characterId": "emma",
      "name": "Emma",
      "avatarUrl": "..."
    }
  ]
}
```

Esta estructura es ilustrativa; adáptala al modelo real del proyecto.

Condiciones:

- No efectuar consultas individuales de personajes al listar series, cargar un episodio o cambiar entre episodios.
- La información necesaria para renderizar los accesos al chat debe estar disponible desde los metadatos de la serie.
- Los personajes conservarán una entidad persistente independiente como fuente de verdad.
- Si se duplican datos de presentación, implementar o documentar cómo se sincronizan cuando se modifica el personaje original.
- No duplicar biografías completas, instrucciones internas o configuraciones sensibles dentro de respuestas públicas del catálogo.
- Cargar información adicional únicamente cuando una funcionalidad de conversación realmente la necesite.

## 6. Conversar con personajes durante un microdrama

Mientras el usuario ve una serie, debe poder abrir un panel con los personajes disponibles para conversar.

Ejemplo:
- Hablar con Mateo.
- Hablar con Emma.

Al seleccionar uno:

1. Conservar el estado actual de reproducción.
2. Pausar el video si corresponde.
3. Abrir la experiencia de chat existente de Luva.
4. Utilizar el ID persistente del personaje.
5. Mantener el historial y la memoria asociados a la conversación existente.
6. Permitir regresar a la reproducción desde la posición anterior.

No construir un segundo sistema de chat.

Preferentemente, transmitir el contexto mínimo de la serie y del episodio visualizado para permitir conversaciones contextualizadas sin revelar acontecimientos posteriores al progreso del usuario.

No es necesario que cada episodio defina individualmente los personajes conversables.

## 7. Modelo de datos y APIs

Diseñar las estructuras necesarias para:

- Series.
- Episodios.
- Personajes persistentes.
- Relación serie-personajes conversables.
- Progreso del usuario por serie y episodio.
- Subtítulos sincronizados.
- Campos de disponibilidad o bloqueo para monetización futura.

Reutilizar los servicios, patrones de acceso y base de datos existentes cuando resulte apropiado.

Priorizar respuestas preparadas para las pantallas y evitar N+1 en los endpoints de catálogo, detalle, episodios y Discovery.

Mantener separados los metadatos audiovisuales de la configuración privada del agente conversacional.

## 8. Compatibilidad y alcance

- Mantener las funcionalidades educativas existentes de Luva.
- Reutilizar el diseño, tema visual, componentes y navegación actuales.
- Evitar dependencias innecesarias.
- No introducir una infraestructura de recomendaciones compleja en este MVP.
- Evitar implementar desde ahora un sistema completo de pagos o anuncios.
- Preparar una arquitectura extensible sin sobreingeniería.

## 9. Validación

Implementar pruebas razonables para:

- Migración de personajes y preservación de identificadores.
- Compatibilidad con conversaciones existentes.
- Consulta de series con personajes embebidos.
- Ausencia de N+1 en operaciones principales.
- Persistencia de progreso.
- Navegación Home → Reproductor → Chat → Reproductor.
- Reproducción y cambio de episodios.

## 10. Ejecución

Trabaja de manera autónoma, por etapas, inspeccionando primero la implementación real.

1. Analiza la arquitectura existente.
2. Define los cambios necesarios.
3. Implementa la migración y los modelos de datos.
4. Implementa los cambios backend.
5. Implementa Home, Discovery y el reproductor.
6. Integra los accesos a conversaciones.
7. Ejecuta pruebas y corrige problemas.

No te detengas a solicitar confirmación después de cada paso rutinario. Toma decisiones técnicas razonables conforme a las convenciones existentes del proyecto.

Al terminar, entrega un resumen de los cambios, migraciones, pruebas ejecutadas y pendientes. Distingue claramente lo implementado de aquello que solo haya quedado preparado para futuras fases.
