import { useEffect, useRef, useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ffmpegClassWorkerUrl from '../../../../node_modules/@ffmpeg/ffmpeg/dist/esm/worker.js?url'
import ffmpegCoreUrl from '@ffmpeg/core?url'
import ffmpegWasmUrl from '@ffmpeg/core/wasm?url'
import {
  completeAdminVideoReplace,
  createAdminVideoReplaceUpload,
  getAdminVideoPreview,
} from '@/features/admin/api/admin-client'
import { useAdminVideos } from '@/features/admin/model/use-admin-videos'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'
import { appPaths } from '@/app/router/paths'

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

function formatSeconds(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return '0:00'
  }

  const totalSeconds = Math.floor(value)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
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

export function AdminVideoEditPage() {
  const { storyId = '', videoId = '' } = useParams()
  const navigate = useNavigate()
  const { data, error, isLoading } = useAdminVideos()
  const video = data?.videos.find((item) => item.storyId === storyId && item.videoId === videoId)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [previewExpiresAt, setPreviewExpiresAt] = useState<string>()
  const [duration, setDuration] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [editorError, setEditorError] = useState<string>()
  const [editorMessage, setEditorMessage] = useState<string>()
  const [processingStage, setProcessingStage] = useState<string>()
  const [trimProgress, setTrimProgress] = useState<number>()
  const [ffmpegLog, setFfmpegLog] = useState<string>()
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isPreparingTrim, setIsPreparingTrim] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadPreview = async () => {
      if (!storyId || !videoId) {
        return
      }

      setIsLoadingPreview(true)
      setEditorError(undefined)

      try {
        const result = await getAdminVideoPreview(storyId, videoId)
        if (cancelled) {
          return
        }

        setPreviewUrl(result.previewUrl)
        setPreviewExpiresAt(result.expiresAt)
      } catch (loadError) {
        if (cancelled) {
          return
        }

        setEditorError(
          loadError instanceof Error ? loadError.message : 'No pudimos cargar el video para editar.',
        )
      } finally {
        if (!cancelled) {
          setIsLoadingPreview(false)
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
    }
  }, [storyId, videoId])

  useEffect(() => {
    if (!duration) {
      return
    }

    setTrimEnd((current) => (current > 0 ? clamp(current, 0, duration) : duration))
  }, [duration])

  const handleLoadedMetadata = () => {
    const nextDuration = videoRef.current?.duration || 0
    setDuration(nextDuration)
    setTrimStart(0)
    setTrimEnd(nextDuration)
  }

  const handleApplyCurrentTime = (target: 'start' | 'end') => {
    const currentTime = videoRef.current?.currentTime || 0

    if (target === 'start') {
      setTrimStart(clamp(currentTime, 0, Math.min(trimEnd || duration, duration)))
      return
    }

    setTrimEnd(clamp(currentTime, Math.max(trimStart, 0), duration))
  }

  const handleSaveTrim = async () => {
    if (!previewUrl || !video || !Number.isFinite(duration) || trimEnd <= trimStart) {
      setEditorError('Define un rango válido antes de guardar el trim.')
      return
    }

    setIsPreparingTrim(true)
    setIsSaving(true)
    setEditorError(undefined)
    setEditorMessage(undefined)
    setProcessingStage('Preparando editor de video...')
    setTrimProgress(undefined)
    setFfmpegLog(undefined)
    let ffmpeg: FFmpeg | null = null
    const handleProgress = ({ progress }: { progress: number }) => {
      const safeProgress = Number.isFinite(progress) ? Math.max(0, Math.min(progress, 1)) : 0
      setTrimProgress(safeProgress)
      setProcessingStage(`Procesando trim... ${Math.round(safeProgress * 100)}%`)
    }
    const handleLog = ({ message }: { message: string }) => {
      if (message && !message.startsWith('frame=')) {
        setFfmpegLog(message)
      }
    }

    try {
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg()
      }

      ffmpeg = ffmpegRef.current
      ffmpeg.on('progress', handleProgress)
      ffmpeg.on('log', handleLog)

      setProcessingStage('Cargando motor de recorte...')
      await ensureFfmpegLoaded(ffmpeg)

      const inputName = 'input.mp4'
      const outputName = 'output.mp4'
      setProcessingStage('Descargando video fuente...')
      const sourceFile = await fetchFile(previewUrl)
      await ffmpeg.writeFile(inputName, sourceFile)

      setProcessingStage('Procesando trim...')
      const exitCode = await ffmpeg.exec([
        '-ss',
        String(trimStart),
        '-to',
        String(trimEnd),
        '-i',
        inputName,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
        outputName,
      ])
      if (exitCode !== 0) {
        throw new Error(`FFmpeg terminó con código ${exitCode}. ${ffmpegLog || ''}`.trim())
      }

      setProcessingStage('Preparando archivo final...')
      const output = await ffmpeg.readFile(outputName)
      if (typeof output === 'string') {
        throw new Error('FFmpeg devolvió una salida inválida.')
      }
      const bytes = output instanceof Uint8Array ? output : new Uint8Array(output)
      const arrayBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer
      const blob = new Blob([arrayBuffer], { type: 'video/mp4' })

      setProcessingStage('Solicitando carga a S3...')
      const upload = await createAdminVideoReplaceUpload(video.storyId, video.videoId, 'video/mp4')
      setProcessingStage('Subiendo video recortado a S3...')
      const uploadResponse = await fetch(upload.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
        },
        body: blob,
      })

      if (!uploadResponse.ok) {
        throw new Error(`No pudimos subir el video recortado. HTTP ${uploadResponse.status}`)
      }

      setProcessingStage('Actualizando registro del video...')
      await completeAdminVideoReplace(video.storyId, video.videoId, 'video/mp4', blob.size)
      setTrimProgress(1)
      setProcessingStage('Trim guardado correctamente.')
      setEditorMessage('Guardamos el trim y reemplazamos el video en S3.')
      navigate(appPaths.videos)
    } catch (trimError) {
      console.error(trimError)
      setEditorError(
        trimError instanceof Error
          ? trimError.message
          : 'No pudimos procesar ni guardar el trim del video.',
      )
    } finally {
      if (ffmpeg) {
        ffmpeg.off('progress', handleProgress)
        ffmpeg.off('log', handleLog)
      }
      setIsPreparingTrim(false)
      setIsSaving(false)
    }
  }

  return (
    <AdminLayout
      title="Editar video"
      description="Recorta el video seleccionado y guarda el resultado reemplazando el objeto actual en S3."
      actions={
        <Link to={appPaths.videos} className="btn secondary">
          Volver a videos
        </Link>
      }
    >
      {error && (
        <section className="admin-inline-alert">
          <p>{error}</p>
        </section>
      )}

      {editorError && (
        <section className="admin-inline-alert">
          <p>{editorError}</p>
        </section>
      )}

      {editorMessage && (
        <section className="admin-inline-note admin-inline-note-success">
          <p>{editorMessage}</p>
        </section>
      )}

      <section className="admin-video-edit-grid">
        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Vista previa</p>
            <h3>{video?.title || 'Cargando video'}</h3>
          </div>

          {isLoading || isLoadingPreview ? (
            <div className="admin-empty-state admin-empty-state-compact">
              <strong>Preparando editor.</strong>
              <p>Estamos cargando la vista previa del video.</p>
            </div>
          ) : previewUrl ? (
            <div className="admin-video-preview-card">
              <div className="admin-video-player-wrap">
                <video
                  ref={videoRef}
                  className="admin-video-player"
                  controls
                  preload="metadata"
                  playsInline
                  src={previewUrl}
                  onLoadedMetadata={handleLoadedMetadata}
                />
              </div>
              <p className="admin-video-preview-meta">
                URL temporal vigente hasta {formatDateTime(previewExpiresAt)}.
              </p>
            </div>
          ) : (
            <div className="admin-empty-state admin-empty-state-compact">
              <strong>No pudimos abrir la vista previa.</strong>
              <p>Reintenta desde la pantalla de videos.</p>
            </div>
          )}
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Trim</p>
            <h3>Recorte básico</h3>
          </div>

          <div className="admin-video-action-card">
            <div className="admin-session-list">
              <div className="admin-session-item">
                <span>Duración</span>
                <strong>{formatSeconds(duration)}</strong>
              </div>
              <div className="admin-session-item">
                <span>Inicio</span>
                <strong>{formatSeconds(trimStart)}</strong>
              </div>
              <div className="admin-session-item">
                <span>Fin</span>
                <strong>{formatSeconds(trimEnd)}</strong>
              </div>
              <div className="admin-session-item">
                <span>Salida</span>
                <strong>{formatSeconds(Math.max(0, trimEnd - trimStart))}</strong>
              </div>
            </div>

            <div className="admin-video-edit-controls">
              <label className="admin-grant-field">
                <span>Inicio en segundos</span>
                <input
                  type="number"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={trimStart}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    setTrimStart(clamp(Number.isFinite(value) ? value : 0, 0, trimEnd || duration))
                  }}
                />
              </label>

              <label className="admin-grant-field">
                <span>Fin en segundos</span>
                <input
                  type="number"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={trimEnd}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    setTrimEnd(clamp(Number.isFinite(value) ? value : 0, trimStart, duration || 0))
                  }}
                />
              </label>
            </div>

            <div className="admin-action-row">
              <button type="button" className="btn secondary" onClick={() => handleApplyCurrentTime('start')}>
                Usar tiempo actual como inicio
              </button>
              <button type="button" className="btn secondary" onClick={() => handleApplyCurrentTime('end')}>
                Usar tiempo actual como fin
              </button>
            </div>

            <div className="admin-inline-note">
              <p>
                El recorte se procesa en tu navegador y luego reemplaza el archivo en S3 sin cambiar
                el registro del video.
              </p>
              {processingStage ? <p><strong>{processingStage}</strong></p> : null}
              {typeof trimProgress === 'number' ? (
                <p>Avance del recorte: {Math.round(trimProgress * 100)}%</p>
              ) : null}
              {ffmpegLog ? <p>FFmpeg: {ffmpegLog}</p> : null}
            </div>

            <div className="admin-action-row">
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  void handleSaveTrim()
                }}
                disabled={isSaving || !previewUrl || trimEnd <= trimStart}
              >
                {isPreparingTrim ? 'Procesando trim...' : isSaving ? 'Guardando...' : 'Guardar trim'}
              </button>
            </div>
          </div>
        </article>
      </section>
    </AdminLayout>
  )
}
