# Administración de series

La sección **Series** del portal administra el mismo catálogo de microdramas que consume la app, incluyendo la serie Mateo ya importada. Requiere una sesión con rol `admin`.

Disponible en Dev: [Series](https://d2y8wpnkj90e8w.cloudfront.net/series).

## Crear y publicar

1. Abre **Series → Nueva serie** y escribe el título. Se propone un identificador; puedes editarlo antes del primer guardado. Después es permanente.
2. Agrega sinopsis, portada (archivo o URL HTTPS), posición en el catálogo y hasta cinco personajes existentes. El número de orden menor aparece primero.
3. Agrega episodios. Cada uno tiene título, video, duración, estado y SRT opcional en inglés. El video puede subirse o indicarse por URL; la duración se obtiene de sus metadatos cuando el navegador puede leerlo y también puede corregirse manualmente en segundos.
4. Usa **Subir / Bajar** para ordenar los episodios. Se renumeran sin cambiar sus identificadores, conservando las referencias de progreso existentes.
5. Guarda como **Borrador** para continuar después. Un borrador puede no tener portada, personajes ni episodios, y permanece oculto en la app.
6. Para publicar, marca los episodios listos como **Publicado**, cambia la serie a **Publicada** y guarda. Se exige portada, sinopsis, al menos un personaje y un episodio publicado con video HTTPS y duración positiva. Los episodios publicados deben ser consecutivos desde el primero; puedes dejar episodios futuros en borrador.

Subidas: portada hasta 10 MB, video hasta 500 MB y SRT hasta 2 MB. Los límites de archivo y el formato SRT se comprueban en el editor; el backend valida los metadatos y los tipos permitidos para la carga firmada. Una serie admite hasta 99 episodios. No se generan videos ni subtítulos automáticamente en este editor.

## Editar y retirar

- **Editar serie** carga también los episodios importados anteriormente. Puedes reemplazar archivos, quitar SRT, renombrar episodios o cambiar su orden.
- Los archivos se suben al elegirlos; **Guardar serie** aplica sus referencias al catálogo. Salir sin guardar puede dejar archivos sin referencia, igual que los demás módulos de assets.
- Guardar la serie como **Borrador** la retira del catálogo, conservando los episodios y el progreso de los usuarios.
- Solo una serie guardada como borrador puede eliminarse, con confirmación. La eliminación borra sus metadatos y episodios, pero conserva los archivos S3 y el progreso del usuario.
- Si otra sesión guardó la serie, el servidor devuelve 409 y no sobrescribe sus cambios. Usa **Recargar** para obtener la versión actual.
- Cada guardado aplica metadatos, episodios y bajas en una transacción. Si eliminas y agregas tantos episodios que se supera el límite de operaciones de una transacción, guarda primero las eliminaciones y luego las altas.

## API administrativa

Todas las rutas están bajo `/v1/admin`, protegidas por Cognito y validación de rol en la Lambda.

| Método | Ruta | Operación |
| --- | --- | --- |
| GET | `/microdramas` | Listado de series publicadas y borradores |
| GET | `/microdramas/:seriesId` | Manifiesto editable, versión y fechas |
| POST | `/microdramas` | Crear con `{ manifest }` |
| PUT | `/microdramas/:seriesId` | Guardar con `{ manifest, expectedVersion }` |
| POST | `/microdramas/:seriesId/delete` | Eliminar borrador con `{ expectedVersion }` |
| POST | `/assets/upload` | Carga firmada: `microdramaCovers`, `microdramaVideos`, `microdramaSubtitles` |

La carga utiliza el endpoint de assets existente y una URL firmada de S3. No necesita cambios de tablas ni nuevos permisos: `AdminFunction` ya dispone de acceso a `MicrodramasTable`, `CharactersTable` y el bucket de assets.

## Verificación

- Backend: pruebas de borradores ocultos, publicación con episodios futuros en borrador, validación, eliminación, conflictos de versión, carreras, campos malformados, referencias a personajes, auth y tipos de archivos.
- Navegador con APIs simuladas: listado, edición de una serie de 21 episodios, reordenamiento, alta, carga de portada/video/SRT, duración, publicación, retiro, eliminación y bloqueo de acceso anónimo.
- Capturas inspeccionadas en escritorio y móvil; sin desbordamiento horizontal a 390 px.
- Build Dev del portal y lint de los nuevos componentes verificados.
- Suite completa del backend: 74 pasan y los mismos tres fallos preexistentes (dos de version-check y conteo antiguo de personajes).
