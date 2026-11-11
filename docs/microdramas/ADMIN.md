# Administración de series

La sección **Series** del portal administra el mismo catálogo de microdramas que consume la app, incluyendo la serie Mateo ya importada. Requiere una sesión con rol `admin`.

Disponible en Dev: [Series](https://d2y8wpnkj90e8w.cloudfront.net/series).

## Consola

Desde la raíz del repositorio, usa Node 22.12 o posterior. Instala las dependencias del backend con `npm --prefix backend ci` y compila con `npm --prefix backend run build`.

El comando toma la URL y el cliente Cognito de `admin/.env` para `--stage prod` y de `admin/.env.development` para `--stage dev`. Configura esos archivos a partir de `admin/.env.example` y los outputs del stack correspondiente. Puedes proporcionar `LUVA_ADMIN_API_BASE_URL`, `LUVA_ADMIN_COGNITO_CLIENT_ID` y `LUVA_ADMIN_COGNITO_REGION` en el entorno.

La consola lee credenciales locales de `backend/scripts/environment.local.json`, si existe, sin imprimirlas. El ID token `LUVA_ADMIN_ID_TOKEN` sirve hasta que vence, una hora después de emitirse. Cuando venza, la terminal solicita la contraseña una vez y en macOS guarda el refresh token rotativo en el Llavero. Después renueva la sesión automáticamente. El refresh token tiene una validez máxima configurada de 1460 días. Usa `--email` o `LUVA_ADMIN_EMAIL` para fijar el correo durante el inicio de sesión. Para cuentas federadas, MFA o ejecución sin terminal interactiva, proporciona credenciales de sesión mediante el entorno del proceso. Mantén los tokens fuera del chat, comandos y logs. El archivo local está excluido de Git.

### Agregar episodios a una serie existente

Localiza la serie con `list` y consulta sus números, estados y versión con `show`:

```sh
npm --prefix backend run microdramas:admin -- list --stage prod
npm --prefix backend run microdramas:admin -- show --stage prod --series mi-serie
```

Pasa los videos en orden. `--first` debe coincidir con el siguiente número disponible. Cada video usa su duración medida con FFmpeg y, si existe, su SRT hermano en inglés. Por ejemplo, `episode_06.mp4` usa `episode_06_en.srt`. Para un solo video puedes indicar `--title` y `--subtitles` de forma explícita.

```sh
npm --prefix backend run microdramas:admin -- append --stage prod \
  --series mi-serie --first 6 --publish \
  /ruta/episode_06.mp4 /ruta/episode_07.mp4
```

Repite con `--apply` cuando corresponda aplicar la solicitud del usuario. `--publish` marca los nuevos episodios como publicados si la serie ya está publicada y los episodios visibles siguen siendo consecutivos. Si omites la opción, se guardan como borradores. El comando conserva los identificadores, archivos y estados de los episodios existentes.

### Instalar una serie completa

Prepara un JSON con los datos de catálogo y los archivos originales de la app. Las rutas de archivo son relativas al manifiesto. El orden del arreglo determina la numeración predeterminada.

```json
{
  "series": {
    "seriesId": "mi-serie",
    "title": "Mi serie",
    "synopsis": "Sinopsis de la serie.",
    "coverFile": "portada.png",
    "catalogOrder": 20,
    "chatCharacterIds": []
  },
  "episodes": [
    {
      "title": "El primer episodio",
      "videoFile": "episode_01.mp4",
      "subtitlesFile": "episode_01_en.srt"
    },
    {
      "videoFile": "episode_02.mp4"
    }
  ]
}
```

También puedes usar `coverUrl`, `videoUrl` o `subtitlesUrl` HTTPS en lugar del archivo correspondiente. Incluye `durationMs` si proporcionas `videoUrl`. Los subtítulos son opcionales y solo en inglés. `install` admite `episodeId` y `episodeNumber` explícitos. La portada local se ajusta a 480 × 682 y se sube en WebP.

```sh
npm --prefix backend run microdramas:admin -- install --stage prod \
  --manifest /ruta/serie.json --publish
```

El plan de `install` valida los archivos y metadatos localmente. Repite con `--apply` para subir los archivos, validar los personajes contra el ambiente y guardar la serie en una sola operación de catálogo. Si el identificador ya existe, consulta `show`. Si la solicitud es instalar como borrador, omite `--publish`.

Para publicar una serie guardada y sus episodios, usa `publish`. `--through N` publica hasta el episodio N y conserva los estados de los episodios posteriores.

```sh
npm --prefix backend run microdramas:admin -- publish --stage prod \
  --series mi-serie --through 5 --apply
```

Después de guardar, la consola vuelve a leer la serie y, si está publicada, comprueba el detalle que consume la app. Si la verificación falla o se corta la conexión, usa `show` antes de repetir. Una carga interrumpida puede dejar archivos sin referencia. Si otra sesión guarda primero, revisa la nueva versión y vuelve a preparar el plan.

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
