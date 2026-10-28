# Producción y publicación de microdramas de Luba

Esta guía conserva el flujo usado para **It's a Date!** y sus siguientes capítulos. Al recibir una solicitud de capítulo nuevo, primero identificar los archivos de origen que el usuario adjunte o indique; después montar y revisar el video. Publicar por Post for Me solo cuando el usuario lo pida y usar el horario que indique.

## Archivos por capítulo

- Video original del capítulo (`episode_NN.mp4`).
- Subtítulos SRT en inglés (`episode_NN_en.srt`). No agregar subtítulos en español salvo que el usuario cambie esa instrucción.
- Clip final/cierre que corresponda a la serie.
- Logo Luva y arte original de portada. Reutilizar el arte existente; no generar una portada nueva.

Los entregables de **It's a Date!** están en `output/its_a_date_episode_01/`. Ese directorio también contiene el logo, los scripts y los entregables de los capítulos 1 y 2.

## Montaje del video

Desde la raíz del repo, pasa explícitamente los archivos del nuevo capítulo al script:

```sh
EPISODE="/ruta/episode_03.mp4" \
CLOSING="/ruta/closing.mp4" \
EN_SRT="/ruta/episode_03_en.srt" \
OUTPUT_NAME="its_a_date_episode_03.mp4" \
./output/its_a_date_episode_01/assemble.sh
```

El montaje deja el logo Luva pequeño en la esquina superior derecha durante el episodio, quema solo subtítulos ingleses blancos con contorno oscuro (48 px de margen lateral por lado para librar los botones de redes), y concatena el cierre al final conservando su audio. Exporta video vertical 480 × 854 a 30 fps, H.264 CRF 20 y AAC. Si se usa otro FFmpeg, definir `FFMPEG=/ruta/a/ffmpeg`.

`TAGLINE` es opcional. Si se define, agrega una banda superior de 42 px con fondo negro al 78 % de opacidad, texto blanco de 16 px a la izquierda y el logo a la derecha; aparece solo durante el capítulo y no en el cierre. El usuario aprobó `TAGLINE="Learn English with Stories"` para los capítulos 6–10; conservar este formato en esos entregables.

## Portada

Usa el archivo gráfico original y añade el número con código:

```sh
python3 output/its_a_date_episode_01/make_cover.py \
  --input "/ruta/¡Es una cita! Romance bilingüe.png" \
  --output "output/its_a_date_episode_01/cover_chapter_03.png" \
  --chapter 3
```

La etiqueta aparece grande como **Chapter N** en inglés, sobre una caja rosa de alto contraste. FFmpeg genera el rótulo; no hace falta Pillow ni un generador de imágenes.

## Programación en Post for Me

La credencial de proyecto está en `scripts/environment.local.json` bajo `POST_FOR_ME_API_KEY`. El archivo es local/ignorado por Git: no copiar su valor a chats, logs, código ni capturas. El script consulta las conexiones actuales y selecciona solamente las cuentas conectadas de Instagram `luva.ingles`, TikTok `Luva` y YouTube `Luva Ingles`; no selecciona otras cuentas. Por defecto programa las tres, con Instagram en Reels, y adjunta la portada como thumbnail donde la plataforma la admite.

Ejemplo para programar a una hora de iniciar la operación:

```sh
python3 scripts/publish_microdrama.py \
  --video output/its_a_date_episode_01/its_a_date_episode_03.mp4 \
  --cover output/its_a_date_episode_01/cover_chapter_03.png \
  --chapter 3 \
  --in-minutes 60
```

También admite `--at "2026-10-26T08:00:00-05:00"` para una hora exacta de Cancún, `--now` para publicar tan pronto como Post for Me lo procese, y `--platforms youtube` para un solo destino. Si el usuario no da hora, preguntarle antes de programar/publicar. Caption por defecto: `It's a Date! — Chapter N 💕 A love story in two languages.`; pasar `--caption` si el usuario da otro texto.

El script sube ambos assets mediante URLs temporales y crea el post con `scheduled_at` ISO 8601. Solo imprime el ID, el estado y los destinos, nunca la API key, URLs firmadas ni respuestas completas. La respuesta de detalle `GET /v1/social-posts/{id}` puede contener tokens OAuth: no imprimirla, guardarla ni pegarla en una respuesta. Para confirmar el resultado por plataforma, abrir el post en Post for Me o consultar un endpoint de resultados limitando explícitamente los campos impresos.

## Revisión y problemas conocidos

Antes de programar, revisar un fotograma con subtítulo largo y uno del cierre. Confirmar inglés únicamente, margen lateral, logo en el episodio y que el cierre tenga audio.

La API puede aceptar un post como `scheduled` aunque la publicación futura falle en una plataforma. En el primer capítulo YouTube rechazó la subida con HTTP 429 por su cuota de **Video Uploads per day**; esa cuota puede volver a afectar la cuenta de YouTube. Después de la hora programada, revisar el resultado de cada plataforma. Si fallan Instagram o TikTok no volver a publicar las tres juntas sin comprobar cuáles sí salieron, para evitar duplicados; si solo falla YouTube por cuota, subirlo por YouTube Studio cuando sea necesario.

La portada personalizada de YouTube no es fiable para Shorts. La portada sí se adjunta en el payload porque está disponible para otros destinos y puede funcionar donde cada plataforma lo permita. [Documentación de thumbnails de Post for Me](https://www.postforme.dev/resources/customizing-video-thumbnails).

**Seguimiento de seguridad:** al consultar el detalle del capítulo 1, Post for Me incluyó tokens OAuth en la respuesta. No están copiados en los archivos del proyecto. Después de que termine la programación del capítulo 2, volver a autorizar las tres cuentas de Luba para renovar sus tokens. No consultar ni imprimir respuestas completas del endpoint de detalle.

## Publicación registrada

- **It's a Date! — Chapter 1:** el registro de Post for Me tiene el caption `It's a Date! — Chapter 1 💕 A love story in two languages.`. Instagram y TikTok se publicaron; YouTube devolvió el error de cuota y se subió manualmente a YouTube Studio.
- **It's a Date! — Chapter 2:** post `sp_3EQY4f6ztNdX730Q787y`, aceptado como `scheduled` para el 25 de octubre de 2026 a las 12:10 p. m. hora de Cancún. Está dirigido a las tres cuentas conectadas y lleva `cover_chapter_02.png`. Hay que revisar el resultado por plataforma después de la hora programada.
- **It's a Date! — Chapter 3:** post `sp_iriLbJtXezZpRqOxjqkm`, aceptado como `scheduled` para el 25 de octubre de 2026 a las 3:00 p. m. hora de Cancún.
- **It's a Date! — Chapter 4:** post `sp_6HKo8PthATDVoyq9ZfOk`, aceptado como `scheduled` para el 25 de octubre de 2026 a las 6:00 p. m. hora de Cancún.
- **It's a Date! — Chapter 5:** post `sp_PJzaOPVk62Xkpvyh8wFjg`, aceptado como `scheduled` para el 25 de octubre de 2026 a las 9:00 p. m. hora de Cancún.
- **It's a Date! — Chapter 6:** post `sp_CV5Q5EYl6SipM833BI`, aceptado como `scheduled` para el 26 de octubre de 2026 a las 12:00 p. m. hora de Cancún.
- **It's a Date! — Chapter 7:** post `sp_aqH455au36WE8yd4cTLo0`, aceptado como `scheduled` para el 26 de octubre de 2026 a las 2:30 p. m. hora de Cancún.
- **It's a Date! — Chapter 8:** post `sp_cJXKM8hGOl7PZNCC2uinD`, aceptado como `scheduled` para el 26 de octubre de 2026 a las 5:00 p. m. hora de Cancún.
- **It's a Date! — Chapter 9:** post `sp_h1RXGlfWPeC0L0j4QYEL`, aceptado como `scheduled` para el 26 de octubre de 2026 a las 7:30 p. m. hora de Cancún.
- **It's a Date! — Chapter 10:** post `sp_bq7oPT8YxP56eFMbeCM0`, aceptado como `scheduled` para el 26 de octubre de 2026 a las 10:00 p. m. hora de Cancún.

Los capítulos 3–10 están programados en las tres cuentas conectadas. Revisar el resultado por plataforma después de cada hora; `scheduled` confirma la programación, no que cada red terminó publicando correctamente.
