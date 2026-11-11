# Producción y publicación de microdramas de Luba

Esta guía conserva el flujo usado para **It's a Date!** y sus siguientes capítulos. Al recibir una solicitud de capítulo nuevo, primero identificar los archivos de origen que el usuario adjunte o indique; después montar y revisar el video. Publicar por Post for Me solo cuando el usuario lo pida y usar el horario que indique.

## Archivos por capítulo

- Video original del capítulo (`episode_NN.mp4`).
- Subtítulos SRT en inglés (`episode_NN_en.srt`). No agregar subtítulos en español salvo que el usuario cambie esa instrucción.
- Clip final/cierre que corresponda a la serie.
  Si la serie no tiene cierre y se pide omitirlo, deja `CLOSING` sin definir; el montaje conserva el audio original del capítulo.
- Logo Luva y arte original de portada. Reutilizar el arte existente; no generar una portada nueva.

Los medios y entregables generados se guardan en `output/its_a_date_episode_01/` (ignorado por Git). Las herramientas reutilizables están en `scripts/` y la guía en este archivo.

## Montaje del video

Desde la raíz del repo, pasa los archivos del nuevo capítulo y reutiliza el logo y el clip de cierre locales:

```sh
EPISODE="/ruta/episode_03.mp4" \
CLOSING="/ruta/closing.mp4" \
EN_SRT="/ruta/episode_03_en.srt" \
ASSET_DIR="output/its_a_date_episode_01" \
OUTPUT_NAME="its_a_date_episode_03.mp4" \
./scripts/assemble_microdrama.sh
```

El formato predeterminado vigente desde el capítulo 13 es un par de pills flotantes y centradas con “Learn English with Stories” y el logo Luva, ubicadas con margen superior de 78 px, 54 px de alto, padding horizontal de 22 px y separación de 14 px. El montaje quema solo subtítulos ingleses blancos con contorno negro opaco y 48 px de margen lateral por lado; concatena el cierre al final conservando su audio. Exporta video vertical 480 × 854 a 30 fps, H.264 CRF 20 y AAC. El estilo anterior de banda superior se puede pedir explícitamente con `BRAND_STYLE=bar`; para ocultar el mensaje y dejar solo el logo, pasar `TAGLINE=''`. Si se usa otro FFmpeg, definir `FFMPEG=/ruta/a/ffmpeg`.

`scripts/make_brand_overlay.py` crea las pills y requiere Pillow. Ejemplo:

```sh
EPISODE="/ruta/episode_11.mp4" \
EN_SRT="/ruta/episode_11_en.srt" \
OUTPUT_NAME="its_a_date_episode_11.mp4" \
ASSET_DIR="output/its_a_date_episode_01" \
./scripts/assemble_microdrama.sh
```

## Portada

Usa el archivo gráfico original y añade el número con código:

```sh
python3 scripts/make_microdrama_cover.py \
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

También admite `--at "YYYY-MM-DDTHH:MM:SS-05:00"` para una hora exacta de Cancún, `--now` para publicar tan pronto como Post for Me lo procese, y `--platforms youtube` para un solo destino. Si el usuario no da hora, preguntarle antes de programar/publicar. El caption predeterminado usa el número del capítulo seguido de “A love story in two languages. ❤️”, el mensaje fijo “Learn English with stories you’ll love!”, la invitación a descargar Luva y los hashtags `#LearnEnglish #EnglishWithStories #LearnEnglishWithLuva`. Se puede reemplazar con `--caption` si el usuario da otro texto.

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
- **It's a Date! — Chapter 11:** post `sp_6u8Wd7vMb2JmyXVcAQc`, creado el 28 de octubre de 2026 con estado `processing`. En la última revisión Instagram, TikTok y YouTube seguían pendientes; no repetir ni crear otro post hasta consultar resultados por plataforma.
- **It's a Date! — Chapter 12:** post `sp_iHptMaBF2Y6ek7W5uXl`, aceptado como `scheduled` para el 28 de octubre de 2026 a las 9:00 p. m. hora de Cancún.
- **It's a Date! — Chapter 13:** post `sp_A8qAboRz8w1Zh2WyX2YEZ`, aceptado como `scheduled` para el 29 de octubre de 2026 a las 12:00 p. m. hora de Cancún.
- **It's a Date! — Chapter 14:** post `sp_dDKvhpltGby2druBkoMS`, aceptado como `scheduled` para el 29 de octubre de 2026 a las 6:00 p. m. hora de Cancún.
- **It's a Date! — Chapter 15:** post `sp_wmRK0gyMqDZnuK7XBuYDS`, aceptado como `scheduled` para el 30 de octubre de 2026 a las 12:00 p. m. hora de Cancún.

Los capítulos 3–15 están programados en las tres cuentas conectadas. No se programó un capítulo 16 porque aún no hay video ni SRT disponible. Revisar el resultado por plataforma después de cada hora; `scheduled` confirma la programación, no que cada red terminó publicando correctamente.

- **Nobody’s Children — Chapters 1–15:** accepted as `scheduled` for November 4–6, 2026, five chapters per day, on Instagram `luva.ingles`, TikTok `luva`, and YouTube `luva ingles`. Chapters 1–5 are November 4 at 2:00, 4:00, 6:00, 8:00, and 10:00 p.m.; chapters 6–10 are November 5 at 9:00 a.m., noon, 3:00, 6:00, and 9:00 p.m.; chapters 11–15 are November 6 at the same times. All times are America/Cancun (EST). Post IDs by chapter: 1 `sp_YqUrIp8MJArY0LAFtgi`, 2 `sp_INe2FEXonppBiJZjcZdCI`, 3 `sp_vG9BgiY1v83NacT94OWVJ`, 4 `sp_vuGUjxv7XxiK40tVPtnHj`, 5 `sp_ASXhTENG13R4HQ3zDjP`, 6 `sp_1J4KyEsPFW4V7oBoYfd`, 7 `sp_BoEwZfCHM4HCDRb3FDYyK`, 8 `sp_PbdoLZgb1ZA8k7ewW5xT`, 9 `sp_Ic2OuNwm10zBnLRvabXi`, 10 `sp_rIrdSMfCvzvqXMoZocxhC`, 11 `sp_YilRr0emmjZLkFOEpDf`, 12 `sp_3vhtcnPjq9yDf6buk2RTM`, 13 `sp_FyIp88PVgpu5oIywukQwH`, 14 `sp_TVq4UYRRhGDiljDvyNyU5`, and 15 `sp_AuXZFACVaUjLDeC4eujVA`. The user requested no closing clip; check each platform’s result after its scheduled time before considering any retry.
- **My Wedding Day - Chapters 1-15:** all accepted as `scheduled` on Instagram `luva.ingles`, TikTok `luva`, and YouTube `luva ingles`, with covers and the fixed caption. Ch. 1-5: Nov 7, 2026 at 12:00, 14:00, 16:00, 18:00, 20:00; ch. 6-10: Nov 8 at 09:00, 12:00, 15:00, 18:00, 21:00; ch. 11-15: Nov 9 at the same times. America/Cancun (EST). IDs: 1 sp_2MDUvsWz5OjgffGqhFWO; 2 sp_9IhA1xJuecod5037eoGqM; 3 sp_6c8LwY0qizGxVluyTb6Lw; 4 sp_1DVmbTz15wTixVWdPNPY; 5 sp_DZyt0gUlXJKxjF2t155m3; 6 sp_76nCiF53kmKC4Fhi108H; 7 sp_w06lsb9QNTKbDUY0v0rz; 8 sp_A5KnZ57nCKxELEvNYn0I1; 9 sp_bvG2kvOXHCQ0facTomDdb; 10 sp_S4gdMSi8paTvyIzktAyqO; 11 sp_ZrVJIrFwufwRYoAsl1Plh; 12 sp_1yuXLYvRvdDWNPhKOjR2I; 13 sp_jczjOSGi2GDnZ3YMOXg7; 14 sp_OCLJq5gw46V5knwBmMrHB; 15 sp_AJzGtwlJ590eFm9M3ZIx. Check platform delivery after each time; `scheduled` does not confirm publication.
- **I Married a Vampire - Chapters 1-24:** all videos were edited with the centered floating Luva pills, English-only subtitles with opaque black outlines, and their original audio; no closing clip was available or added. Covers use the official `I Married a Vampire - Cover.png` art with the English chapter label. All 24 posts were accepted as `scheduled` on Instagram `luva.ingles`, TikTok `luva`, and YouTube `luva ingles`, using the fixed promotional caption. Chapters 3-24 were updated with the official cover while still scheduled; chapters 1-2 had already reached `processed` and retain the earlier frame thumbnail. Chapter 1-3: Nov 10, 2026 at 20:00, 21:00, 22:00; ch. 4-8: Nov 11 at 09:00, 12:00, 15:00, 18:00, 21:00; ch. 9-13: Nov 12 at the same times; ch. 14-18: Nov 13 at the same times; ch. 19-23: Nov 14 at the same times; ch. 24: Nov 15 at 09:00. All times America/Cancun (EST). Post IDs by chapter:
- 1 `sp_RgZ2dhokVTrYwRXe8wTS`; 2 `sp_vKiwau0L3IPvvlqJMDrFm`; 3 `sp_Gocsm0A2vYqsHPzaZS3Dt`; 4 `sp_P2nCebPQOisY7pvvUU0PN`; 5 `sp_UEiNgpERihNPjTYheSB`; 6 `sp_mO9vPIiSFxP10th7Ak2AH`; 7 `sp_ohS0CO3HZL83Ix1ckcrw8`; 8 `sp_ckwRtGQRxWx3240Fwbzp4`.
- 9 `sp_29ptzHNozgb87ENDlawkp`; 10 `sp_8nXq6zkyCFplnjODIUUwK`; 11 `sp_EDWLGV7q5Prh4qlibksVe`; 12 `sp_qaHHZWOBpLGtVF51AXxJn`; 13 `sp_k9DnxmCheVmgowNfUCsB`; 14 `sp_G7VMLV8QSWiZ0qaWCEnxD`; 15 `sp_xtw3TRAfNoWs6t6UVnAYE`; 16 `sp_IuEUYQn5MVlRFwEFpIBVw`.
- 17 `sp_bbDA2dbjG9tSHwgxiwFy`; 18 `sp_mMwH81XKDbXQgdZwLCZ`; 19 `sp_L0XiR4KJoELQW89NPI1`; 20 `sp_bChSXZHFUKJ4PrH3RO7Rj`; 21 `sp_typJGCT4nup7s9XYMAf9`; 22 `sp_Lqysm7JB18OntiJTy81X`; 23 `sp_IxqGwwzvH5rHVhDl9oq8`; 24 `sp_2Xh7ReuYYjqgmaF9bPSJ`. Check delivery result on each platform after the scheduled time; `scheduled` is not confirmation of successful publication.
