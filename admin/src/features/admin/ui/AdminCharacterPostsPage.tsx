import { useMemo, useRef, useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { useNavigate, useParams } from 'react-router-dom'
import ffmpegClassWorkerUrl from '../../../../node_modules/@ffmpeg/ffmpeg/dist/esm/worker.js?worker&url'
import ffmpegCoreUrl from '@ffmpeg/core?url'
import ffmpegWasmUrl from '@ffmpeg/core/wasm?url'
import { appPaths } from '@/app/router/paths'
import {
  createAdminAssetUpload,
  createAdminCharacterPost,
  deleteAdminCharacterPost,
  updateAdminCharacterPost,
} from '@/features/admin/api/admin-client'
import type { AdminCharacterPostWritePayload } from '@/features/admin/api/admin-client'
import { useAdminCharacterPosts } from '@/features/admin/model/use-admin-character-posts'
import type { AdminCharacterPost } from '@/features/admin/model/types'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'

type CharacterPostFormState = {
  mediaMode: 'image' | 'video'
  caption: string
  context: string
  conversationNarration: string
  initialMessage: string
  suggestedReplies: string[]
  imageUrl: string
  thumbnailUrl: string
  thumbnailMdUrl: string
  videoUrl: string
  order: string
}

const DEFAULT_REEL_SUGGESTED_REPLIES = [
  'Hi there!',
  'That’s funny 😂',
  'Tell me more',
]

function decodeParam(value?: string) {
  if (!value) {
    return undefined
  }

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function formatDateTime(value?: string) {
  if (!value) {
    return 'Sin fecha'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 KB'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function getNextOrder(posts: AdminCharacterPost[]) {
  const maxOrder = posts.reduce((max, post) => Math.max(max, post.order), 0)
  return maxOrder + 1
}

function buildEmptyForm(nextOrder: number): CharacterPostFormState {
  return {
    mediaMode: 'image',
    caption: '',
    context: '',
    conversationNarration: '',
    initialMessage: '',
    suggestedReplies: DEFAULT_REEL_SUGGESTED_REPLIES,
    imageUrl: '',
    thumbnailUrl: '',
    thumbnailMdUrl: '',
    videoUrl: '',
    order: String(Math.max(1, nextOrder)),
  }
}

function formFromPost(post: AdminCharacterPost): CharacterPostFormState {
  return {
    mediaMode: post.videoUrl ? 'video' : 'image',
    caption: post.caption,
    context: post.context || '',
    conversationNarration: post.conversationNarration || '',
    initialMessage: post.initialMessage || '',
    suggestedReplies: normalizeSuggestedRepliesForForm(post.suggestedReplies),
    imageUrl: post.imageUrl,
    thumbnailUrl: post.thumbnailUrl || (post.videoUrl ? post.imageUrl : ''),
    thumbnailMdUrl: post.thumbnailMdUrl || '',
    videoUrl: post.videoUrl || '',
    order: String(post.order),
  }
}

function trimOptional(value: string) {
  return value.trim() || undefined
}

function normalizeSuggestedRepliesForForm(value: unknown): string[] {
  const fromPost = Array.isArray(value)
    ? value.map((entry) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean)
    : []
  return [...fromPost, ...DEFAULT_REEL_SUGGESTED_REPLIES].slice(0, 3)
}

function buildPayload(form: CharacterPostFormState): AdminCharacterPostWritePayload {
  const order = Number(form.order)
  const videoUrl = form.mediaMode === 'video' ? trimOptional(form.videoUrl) : undefined
  const thumbnailUrl = form.mediaMode === 'video'
    ? trimOptional(form.thumbnailUrl) || trimOptional(form.imageUrl)
    : undefined
  const thumbnailMdUrl = form.mediaMode === 'video' ? trimOptional(form.thumbnailMdUrl) : undefined
  const imageUrl = form.mediaMode === 'video'
    ? thumbnailUrl || ''
    : form.imageUrl.trim()

  return {
    caption: form.caption.trim(),
    context: form.context.trim(),
    conversationNarration: form.conversationNarration.trim(),
    initialMessage: form.initialMessage.trim(),
    imageUrl,
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
    ...(thumbnailMdUrl ? { thumbnailMdUrl } : {}),
    ...(videoUrl ? { videoUrl } : {}),
    ...(Number.isFinite(order) && order >= 1 ? { order: Math.floor(order) } : {}),
    suggestedReplies: normalizeSuggestedRepliesForForm(form.suggestedReplies),
  }
}

function getFileStem(fileName: string) {
  const normalized = fileName.trim() || 'avatar-post'
  const dotIndex = normalized.lastIndexOf('.')
  return (dotIndex > 0 ? normalized.slice(0, dotIndex) : normalized)
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'avatar-post'
}

function getFileExtension(file: File) {
  const extension = file.name.trim().toLowerCase().split('.').pop()
  if (extension && extension !== file.name.trim().toLowerCase()) {
    return extension
  }

  if (file.type === 'video/quicktime') return 'mov'
  if (file.type === 'video/webm') return 'webm'
  if (file.type === 'video/x-m4v') return 'm4v'
  return 'mp4'
}

function makeOutputName(file: File, suffix: string, extension: string) {
  return `${getFileStem(file.name)}-${suffix}.${extension}`
}

async function ensureFfmpegLoaded(ffmpeg: FFmpeg) {
  if (ffmpeg.loaded) {
    return
  }

  await ffmpeg.load({
    classWorkerURL: ffmpegClassWorkerUrl,
    coreURL: ffmpegCoreUrl,
    wasmURL: ffmpegWasmUrl,
  })
}

async function uploadAvatarPostAsset(blob: Blob, fileName: string) {
  const contentType = blob.type
  const upload = await createAdminAssetUpload('avatarPosts', contentType, fileName)
  const uploadResponse = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': upload.contentType,
      ...(upload.cacheControl ? { 'Cache-Control': upload.cacheControl } : {}),
    },
    body: blob,
  })

  if (!uploadResponse.ok) {
    throw new Error(`No pudimos subir ${fileName}. HTTP ${uploadResponse.status}`)
  }

  return upload.url
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('No pudimos comprimir la imagen.'))
        return
      }
      resolve(blob)
    }, type, quality)
  })
}

function getContainedSize(width: number, height: number, maxWidth: number, maxHeight: number) {
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)
  const scale = Math.min(1, maxWidth / safeWidth, maxHeight / safeHeight)
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  }
}

type WebpVariant = { blob: Blob; width: number; height: number }

async function drawSourceToWebpVariant(
  draw: (context: CanvasRenderingContext2D, size: { width: number; height: number }) => void,
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
  quality: number,
): Promise<WebpVariant> {
  const size = getContainedSize(sourceWidth, sourceHeight, maxWidth, maxHeight)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('No pudimos preparar el compresor de imagen.')
  }
  draw(context, size)
  const blob = await canvasToBlob(canvas, 'image/webp', quality)
  return { blob, width: size.width, height: size.height }
}

async function compressImageToWebpVariants(file: File) {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('No pudimos leer la imagen seleccionada.'))
      element.src = objectUrl
    })
    const sourceWidth = image.naturalWidth
    const sourceHeight = image.naturalHeight
    const draw = (context: CanvasRenderingContext2D, size: { width: number; height: number }) => {
      context.drawImage(image, 0, 0, size.width, size.height)
    }
    const full = await drawSourceToWebpVariant(draw, sourceWidth, sourceHeight, 720, 1280, 0.82)
    const md = await drawSourceToWebpVariant(draw, sourceWidth, sourceHeight, 360, 640, 0.78)
    return { full, md }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function compressImageToWebp(file: File) {
  const variants = await compressImageToWebpVariants(file)
  return variants.full.blob
}

async function captureVideoThumbnailVariants(videoBlob: Blob) {
  const objectUrl = URL.createObjectURL(videoBlob)
  try {
    const video = document.createElement('video')
    video.src = objectUrl
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('No pudimos leer el video para generar thumbnail.'))
    })

    const duration = Number.isFinite(video.duration) ? video.duration : 0
    const captureAt = duration > 1.2 ? 1 : Math.max(0, duration * 0.5)
    if (captureAt > 0.05) {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve()
        video.onerror = () => reject(new Error('No pudimos capturar el thumbnail del video.'))
        video.currentTime = captureAt
      })
    } else if (video.readyState < 2) {
      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve()
        video.onerror = () => reject(new Error('No pudimos cargar el primer frame del video.'))
      })
    }

    const sourceWidth = video.videoWidth || 720
    const sourceHeight = video.videoHeight || 1280
    const draw = (context: CanvasRenderingContext2D, size: { width: number; height: number }) => {
      context.drawImage(video, 0, 0, size.width, size.height)
    }
    const full = await drawSourceToWebpVariant(draw, sourceWidth, sourceHeight, 720, 1280, 0.82)
    const md = await drawSourceToWebpVariant(draw, sourceWidth, sourceHeight, 360, 640, 0.78)
    return { full, md }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function optimizeVideoForMobile(
  ffmpeg: FFmpeg,
  file: File,
) {
  const inputName = `input.${getFileExtension(file)}`
  const outputName = 'avatar-post-mobile.mp4'
  await ffmpeg.writeFile(inputName, await fetchFile(file))
  const exitCode = await ffmpeg.exec([
    '-y',
    '-i',
    inputName,
    '-map',
    '0:v:0',
    '-map',
    '0:a?',
    '-vf',
    "scale=w='min(720,iw)':h='min(1280,ih)':force_original_aspect_ratio=decrease,scale=w='trunc(iw/2)*2':h='trunc(ih/2)*2',setsar=1",
    '-r',
    '30',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '28',
    '-maxrate',
    '1600k',
    '-bufsize',
    '3200k',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '96k',
    '-ac',
    '2',
    '-movflags',
    '+faststart',
    outputName,
  ])
  if (exitCode !== 0) {
    throw new Error(`FFmpeg termino con codigo ${exitCode}.`)
  }

  const output = await ffmpeg.readFile(outputName)
  if (typeof output === 'string') {
    throw new Error('FFmpeg devolvio una salida invalida.')
  }
  const bytes = output instanceof Uint8Array ? output : new Uint8Array(output)
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
  return new Blob([arrayBuffer], { type: 'video/mp4' })
}

export function AdminCharacterPostsPage() {
  const navigate = useNavigate()
  const params = useParams()
  const characterId = decodeParam(params.characterId)
  const { data, error, isLoading, reload } = useAdminCharacterPosts(characterId)
  const posts = useMemo(() => data?.posts || [], [data?.posts])
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [editingPostId, setEditingPostId] = useState<string>()
  const [form, setForm] = useState<CharacterPostFormState>(() => buildEmptyForm(1))
  const [imageFile, setImageFile] = useState<File>()
  const [videoFile, setVideoFile] = useState<File>()
  const [thumbnailFile, setThumbnailFile] = useState<File>()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingPostId, setIsDeletingPostId] = useState<string>()
  const [stage, setStage] = useState<string>()
  const [mediaProgress, setMediaProgress] = useState<number>()
  const [ffmpegLog, setFfmpegLog] = useState<string>()
  const [actionError, setActionError] = useState<string>()
  const [actionMessage, setActionMessage] = useState<string>()

  const character = data?.character
  const nextOrder = getNextOrder(posts)
  const hasImages = posts.filter((post) => post.imageUrl).length
  const videoPosts = posts.filter((post) => post.videoUrl).length

  const resetForm = () => {
    setEditingPostId(undefined)
    setForm(buildEmptyForm(nextOrder))
    setImageFile(undefined)
    setVideoFile(undefined)
    setThumbnailFile(undefined)
    setStage(undefined)
    setMediaProgress(undefined)
    setFfmpegLog(undefined)
  }

  const handleEdit = (post: AdminCharacterPost) => {
    setEditingPostId(post.postId)
    setForm(formFromPost(post))
    setImageFile(undefined)
    setVideoFile(undefined)
    setThumbnailFile(undefined)
    setStage(undefined)
    setMediaProgress(undefined)
    setFfmpegLog(undefined)
    setActionError(undefined)
    setActionMessage(undefined)
  }

  const handleSubmit = async () => {
    if (isSaving || !characterId) {
      return
    }

    setIsSaving(true)
    setActionError(undefined)
    setActionMessage(undefined)
    setMediaProgress(undefined)
    setFfmpegLog(undefined)

    try {
      let nextForm = form

      if (form.mediaMode === 'image') {
        if (imageFile) {
          setStage('Comprimiendo imagen para mobile...')
          const imageBlob = await compressImageToWebp(imageFile)
          setStage(`Subiendo imagen optimizada (${formatBytes(imageBlob.size)})...`)
          const imageUrl = await uploadAvatarPostAsset(
            imageBlob,
            makeOutputName(imageFile, 'mobile', 'webp'),
          )
          nextForm = {
            ...nextForm,
            imageUrl,
            thumbnailUrl: '',
            thumbnailMdUrl: '',
            videoUrl: '',
          }
        }

        if (!nextForm.imageUrl.trim()) {
          throw new Error('Selecciona una imagen para guardar el post.')
        }
      } else {
        let optimizedVideoBlob: Blob | undefined

        if (videoFile) {
          if (!ffmpegRef.current) {
            ffmpegRef.current = new FFmpeg()
          }
          const ffmpeg = ffmpegRef.current
          const handleProgress = ({ progress }: { progress: number }) => {
            const safeProgress = Number.isFinite(progress) ? Math.max(0, Math.min(progress, 1)) : 0
            setMediaProgress(safeProgress)
            setStage(`Comprimiendo video para mobile... ${Math.round(safeProgress * 100)}%`)
          }
          const handleLog = ({ message }: { message: string }) => {
            if (message && !message.startsWith('frame=')) {
              setFfmpegLog(message)
            }
          }

          ffmpeg.on('progress', handleProgress)
          ffmpeg.on('log', handleLog)
          try {
            setStage('Cargando motor de compresion de video...')
            await ensureFfmpegLoaded(ffmpeg)
            setStage('Comprimiendo video para mobile...')
            optimizedVideoBlob = await optimizeVideoForMobile(ffmpeg, videoFile)
          } finally {
            ffmpeg.off('progress', handleProgress)
            ffmpeg.off('log', handleLog)
          }

          setMediaProgress(1)
          setStage(`Subiendo video optimizado (${formatBytes(optimizedVideoBlob.size)})...`)
          const videoUrl = await uploadAvatarPostAsset(
            optimizedVideoBlob,
            makeOutputName(videoFile, 'mobile', 'mp4'),
          )
          nextForm = { ...nextForm, videoUrl }
        }

        if (thumbnailFile) {
          setStage('Comprimiendo thumbnail (full + md)...')
          const variants = await compressImageToWebpVariants(thumbnailFile)
          setStage(
            `Subiendo thumbnail full (${formatBytes(variants.full.blob.size)}) y md (${formatBytes(variants.md.blob.size)})...`,
          )
          const [thumbnailUrl, thumbnailMdUrl] = await Promise.all([
            uploadAvatarPostAsset(variants.full.blob, makeOutputName(thumbnailFile, 'thumbnail', 'webp')),
            uploadAvatarPostAsset(variants.md.blob, makeOutputName(thumbnailFile, 'thumbnail-md', 'webp')),
          ])
          nextForm = { ...nextForm, imageUrl: thumbnailUrl, thumbnailUrl, thumbnailMdUrl }
        } else if (optimizedVideoBlob) {
          setStage('Generando thumbnail desde el segundo 1 (full + md)...')
          const variants = await captureVideoThumbnailVariants(optimizedVideoBlob)
          setStage(
            `Subiendo thumbnail full (${formatBytes(variants.full.blob.size)}) y md (${formatBytes(variants.md.blob.size)})...`,
          )
          const thumbnailFileName = videoFile
            ? makeOutputName(videoFile, 'thumbnail', 'webp')
            : 'avatar-post-thumbnail.webp'
          const thumbnailMdFileName = videoFile
            ? makeOutputName(videoFile, 'thumbnail-md', 'webp')
            : 'avatar-post-thumbnail-md.webp'
          const [thumbnailUrl, thumbnailMdUrl] = await Promise.all([
            uploadAvatarPostAsset(variants.full.blob, thumbnailFileName),
            uploadAvatarPostAsset(variants.md.blob, thumbnailMdFileName),
          ])
          nextForm = { ...nextForm, imageUrl: thumbnailUrl, thumbnailUrl, thumbnailMdUrl }
        } else if (nextForm.thumbnailUrl && !nextForm.imageUrl) {
          nextForm = { ...nextForm, imageUrl: nextForm.thumbnailUrl }
        }

        if (!nextForm.videoUrl.trim()) {
          throw new Error('Selecciona un video para guardar el post.')
        }

        const thumbnailUrl = nextForm.thumbnailUrl.trim() || nextForm.imageUrl.trim()
        if (!thumbnailUrl) {
          throw new Error('Sube un thumbnail o deja que el portal lo genere desde el video.')
        }
        nextForm = { ...nextForm, imageUrl: thumbnailUrl, thumbnailUrl }
      }

      const payload = buildPayload(nextForm)
      setStage(
        payload.videoUrl
          ? 'Guardando post y generando subtitulos con Whisper...'
          : editingPostId
            ? 'Actualizando post del perfil...'
            : 'Guardando post del perfil...'
      )

      if (editingPostId) {
        await updateAdminCharacterPost(characterId, { ...payload, postId: editingPostId })
        setActionMessage('Post actualizado en el perfil.')
      } else {
        await createAdminCharacterPost(characterId, payload)
        setActionMessage('Post creado en el perfil.')
      }

      setEditingPostId(undefined)
      setForm(buildEmptyForm(Math.max(nextOrder, (payload.order || nextOrder) + 1)))
      setImageFile(undefined)
      setVideoFile(undefined)
      setThumbnailFile(undefined)
      setStage(undefined)
      setMediaProgress(undefined)
      setFfmpegLog(undefined)
      reload()
    } catch (saveError) {
      setActionError(
        saveError instanceof Error
          ? saveError.message
          : 'No pudimos guardar el post del perfil.',
      )
      setStage(undefined)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (post: AdminCharacterPost) => {
    if (!characterId || !window.confirm(`Borrar el post #${post.order} de ${post.characterName}?`)) {
      return
    }

    setIsDeletingPostId(post.postId)
    setActionError(undefined)
    setActionMessage(undefined)

    try {
      await deleteAdminCharacterPost(characterId, post.postId)
      if (editingPostId === post.postId) {
        resetForm()
      }
      setActionMessage('Post borrado del perfil.')
      reload()
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No pudimos borrar el post del perfil.',
      )
    } finally {
      setIsDeletingPostId(undefined)
    }
  }

  return (
    <AdminLayout
      title={character?.characterName || 'Perfil de personaje'}
      description={character ? character.characterId : 'Carga posts con imagen y caption para este personaje.'}
      actions={
        <>
          <button type="button" className="btn secondary" onClick={() => navigate(appPaths.characters)}>
            Volver a personajes
          </button>
          <button type="button" className="btn ghost" onClick={reload} disabled={isLoading}>
            {isLoading ? 'Actualizando...' : 'Recargar'}
          </button>
        </>
      }
    >
      <section className="admin-video-summary-grid">
        <article className="admin-stat-card">
          <span className="eyebrow">Posts</span>
          <strong>{posts.length}</strong>
          <p>Media guardada en el perfil del personaje.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Videos</span>
          <strong>{videoPosts}</strong>
          <p>Posts con video optimizado para mobile.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Siguiente orden</span>
          <strong>{nextOrder}</strong>
          <p>Orden sugerido para el nuevo post.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Carpeta</span>
          <strong>avatarPosts</strong>
          <p>{hasImages} thumbnails o imagenes con URL publica.</p>
        </article>
      </section>

      {error && (
        <section className="admin-inline-alert">
          <p>{error}</p>
        </section>
      )}

      {actionError && (
        <section className="admin-inline-alert">
          <p>{actionError}</p>
        </section>
      )}

      {actionMessage && (
        <section className="admin-inline-note admin-inline-note-success">
          <p>{actionMessage}</p>
        </section>
      )}

      <section className="admin-character-posts-grid">
        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">{editingPostId ? 'Editar post' : 'Nuevo post'}</p>
            <h3>{editingPostId ? 'Actualizar perfil' : 'Agregar post'}</h3>
          </div>

          {character && (
            <div className="admin-story-character-detail-card">
              <span className="admin-story-character-avatar admin-story-character-avatar-large">
                {character.avatarImageUrl ? <img src={character.avatarImageUrl} alt="" /> : character.characterName.charAt(0)}
              </span>
              <div>
                <strong>{character.characterName}</strong>
                <p>{character.characterId}</p>
              </div>
            </div>
          )}

          <div className="admin-feed-post-form">
            <div className="admin-character-media-toggle" role="group" aria-label="Tipo de media del post">
              <button
                type="button"
                className={form.mediaMode === 'image' ? 'btn primary' : 'btn secondary'}
                onClick={() => {
                  setForm((current) => ({
                    ...current,
                    mediaMode: 'image',
                    thumbnailUrl: '',
                    videoUrl: '',
                  }))
                  setVideoFile(undefined)
                  setThumbnailFile(undefined)
                }}
                disabled={isSaving}
              >
                Imagen
              </button>
              <button
                type="button"
                className={form.mediaMode === 'video' ? 'btn primary' : 'btn secondary'}
                onClick={() => {
                  setForm((current) => ({
                    ...current,
                    mediaMode: 'video',
                    thumbnailUrl: current.thumbnailUrl || current.imageUrl,
                  }))
                  setImageFile(undefined)
                }}
                disabled={isSaving}
              >
                Video vertical
              </button>
            </div>

            <label className="admin-grant-field">
              <span>Caption</span>
              <textarea
                value={form.caption}
                onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))}
                placeholder="Escribe el caption que vera el usuario."
                disabled={isSaving}
              />
            </label>

            <label className="admin-grant-field">
              <span>Contexto para chat</span>
              <textarea
                value={form.context}
                onChange={(event) => setForm((current) => ({ ...current, context: event.target.value }))}
                placeholder="Describe lo que el avatar debe saber cuando alguien responda este post. Si queda vacio se usara el caption."
                disabled={isSaving}
              />
            </label>

            <label className="admin-grant-field">
              <span>Narracion inicial</span>
              <textarea
                value={form.conversationNarration}
                onChange={(event) => setForm((current) => ({ ...current, conversationNarration: event.target.value }))}
                placeholder="Accion breve antes del primer mensaje, por ejemplo: Zoe looks up from her phone."
                disabled={isSaving}
              />
            </label>

            <label className="admin-grant-field">
              <span>Primer mensaje</span>
              <textarea
                value={form.initialMessage}
                onChange={(event) => setForm((current) => ({ ...current, initialMessage: event.target.value }))}
                placeholder="Mensaje en ingles que vera el usuario al abrir Conversar."
                disabled={isSaving}
              />
            </label>

            <div className="admin-feed-post-form-row">
              {form.suggestedReplies.map((reply, index) => (
                <label className="admin-grant-field" key={`suggested-reply-${index}`}>
                  <span>Respuesta sugerida {index + 1}</span>
                  <input
                    type="text"
                    maxLength={120}
                    value={reply}
                    onChange={(event) => {
                      const value = event.target.value
                      setForm((current) => {
                        const suggestedReplies = normalizeSuggestedRepliesForForm(current.suggestedReplies)
                        suggestedReplies[index] = value
                        return { ...current, suggestedReplies }
                      })
                    }}
                    placeholder={DEFAULT_REEL_SUGGESTED_REPLIES[index]}
                    disabled={isSaving}
                  />
                </label>
              ))}
            </div>

            <div className="admin-feed-post-form-row">
              <label className="admin-grant-field">
                <span>Orden</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.order}
                  onChange={(event) => setForm((current) => ({ ...current, order: event.target.value }))}
                  disabled={isSaving}
                />
              </label>

              {form.mediaMode === 'image' ? (
                <label className="admin-grant-field">
                  <span>Imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isSaving}
                    onChange={(event) => {
                      setImageFile(event.target.files?.[0])
                    }}
                  />
                </label>
              ) : (
                <label className="admin-grant-field">
                  <span>Video vertical</span>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/mpeg"
                    disabled={isSaving}
                    onChange={(event) => {
                      setVideoFile(event.target.files?.[0])
                    }}
                  />
                </label>
              )}
            </div>

            {form.mediaMode === 'video' && (
              <label className="admin-grant-field">
                <span>Thumbnail opcional</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isSaving}
                  onChange={(event) => {
                    setThumbnailFile(event.target.files?.[0])
                  }}
                />
              </label>
            )}

            {(imageFile || videoFile || thumbnailFile || form.imageUrl || form.thumbnailUrl || form.videoUrl) && (
              <div className="admin-session-list admin-asset-meta-list">
                {imageFile && (
                  <div className="admin-session-item">
                    <span>Imagen nueva</span>
                    <strong>{imageFile.name}</strong>
                    <p>{formatBytes(imageFile.size)}</p>
                  </div>
                )}
                {videoFile && (
                  <div className="admin-session-item">
                    <span>Video nuevo</span>
                    <strong>{videoFile.name}</strong>
                    <p>{formatBytes(videoFile.size)}</p>
                  </div>
                )}
                {thumbnailFile && (
                  <div className="admin-session-item">
                    <span>Thumbnail nuevo</span>
                    <strong>{thumbnailFile.name}</strong>
                    <p>{formatBytes(thumbnailFile.size)}</p>
                  </div>
                )}
                {form.videoUrl && (
                  <div className="admin-session-item">
                    <span>Video guardado</span>
                    <strong>
                      <a href={form.videoUrl} target="_blank" rel="noreferrer">
                        Abrir video
                      </a>
                    </strong>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setForm((current) => ({ ...current, videoUrl: '' }))}
                      disabled={isSaving}
                    >
                      Quitar video
                    </button>
                  </div>
                )}
                {(form.thumbnailUrl || form.imageUrl) && (
                  <div className="admin-session-item">
                    <span>{form.mediaMode === 'video' ? 'Thumbnail guardado' : 'Imagen guardada'}</span>
                    <strong>
                      <a href={form.thumbnailUrl || form.imageUrl} target="_blank" rel="noreferrer">
                        Abrir imagen
                      </a>
                    </strong>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setForm((current) => ({ ...current, imageUrl: '', thumbnailUrl: '' }))}
                      disabled={isSaving}
                    >
                      Quitar {form.mediaMode === 'video' ? 'thumbnail' : 'imagen'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {stage && (
              <div className="admin-inline-note">
                <p><strong>{stage}</strong></p>
                {mediaProgress !== undefined ? <p>Progreso: {Math.round(mediaProgress * 100)}%</p> : null}
                {ffmpegLog ? <p>FFmpeg: {ffmpegLog}</p> : null}
              </div>
            )}

            <div className="admin-action-row">
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  void handleSubmit()
                }}
                disabled={isSaving || !characterId}
              >
                {isSaving ? 'Guardando...' : editingPostId ? 'Actualizar post' : 'Crear post'}
              </button>
              {editingPostId && (
                <button type="button" className="btn ghost" onClick={resetForm} disabled={isSaving}>
                  Cancelar edicion
                </button>
              )}
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Perfil</p>
            <h3>Posts publicados</h3>
          </div>

          <div className="admin-character-post-grid">
            {posts.map((post) => (
              <article
                key={post.postId}
                className={editingPostId === post.postId ? 'admin-character-post-card admin-character-post-card-active' : 'admin-character-post-card'}
              >
                <a
                  href={post.videoUrl || post.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-character-post-image"
                >
                  <img src={post.imageUrl} alt="" />
                  {post.videoUrl ? (
                    <span className="admin-character-post-video-badge">Video</span>
                  ) : null}
                </a>
                <div className="admin-character-post-copy">
                  <div className="admin-video-row-headline">
                    <strong>#{post.order}</strong>
                    <span className="tag tag-muted">{post.videoUrl ? 'Video' : 'Imagen'}</span>
                  </div>
                  <p>{post.caption}</p>
                  {post.videoUrl && (
                    <p className="admin-video-row-time">
                      Video:{' '}
                      <a href={post.videoUrl} target="_blank" rel="noreferrer">
                        abrir
                      </a>
                    </p>
                  )}
                  {post.subtitlesUrl && (
                    <p className="admin-video-row-time">
                      Subtitulos:{' '}
                      <a href={post.subtitlesUrl} target="_blank" rel="noreferrer">
                        abrir
                      </a>
                    </p>
                  )}
                  {post.context && <p className="admin-video-row-time">Contexto: {post.context}</p>}
                  {post.conversationNarration && (
                    <p className="admin-video-row-time">Narracion: {post.conversationNarration}</p>
                  )}
                  {post.initialMessage && (
                    <p className="admin-video-row-time">Primer mensaje: {post.initialMessage}</p>
                  )}
                  {post.suggestedReplies?.length ? (
                    <p className="admin-video-row-time">
                      Respuestas: {post.suggestedReplies.join(' / ')}
                    </p>
                  ) : null}
                  <span className="admin-video-row-time">Actualizado {formatDateTime(post.updatedAt)}</span>
                </div>
                <div className="admin-feed-post-actions">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => handleEdit(post)}
                    disabled={isSaving || isDeletingPostId === post.postId}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      void handleDelete(post)
                    }}
                    disabled={isSaving || isDeletingPostId === post.postId}
                  >
                    {isDeletingPostId === post.postId ? 'Borrando...' : 'Borrar'}
                  </button>
                </div>
              </article>
            ))}

            {!posts.length && (
              <div className="admin-empty-state admin-empty-state-compact">
                <strong>No hay posts para este perfil.</strong>
                <p>Sube la primera imagen o video y agrega su caption.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </AdminLayout>
  )
}
