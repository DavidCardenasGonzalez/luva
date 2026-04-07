import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { getAdminVideoPreview, updateAdminVideo } from '@/features/admin/api/admin-client'
import { useAdminVideos } from '@/features/admin/model/use-admin-videos'
import type { AdminVideoStatus, AdminVideoSummary } from '@/features/admin/model/types'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']

function formatDateTime(value?: string) {
  if (!value || value.startsWith('1970-01-01')) {
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

function formatDateLabel(value?: string) {
  if (!value) {
    return 'Sin fecha'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatScheduleLabel(value?: string) {
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

function formatMonthLabel(value: Date) {
  return value.toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  })
}

function formatFileSize(value?: number) {
  if (!value || value <= 0) {
    return 'Sin tamaño'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  const formatted = size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)
  return `${formatted} ${units[unitIndex]}`
}

function getVideoStatusLabel(status: AdminVideoStatus) {
  switch (status) {
    case 'por_programar':
      return 'Por programar'
    case 'programado':
      return 'Programado'
    case 'subido':
      return 'Subido'
    case 'descartado':
      return 'Descartado'
    default:
      return status
  }
}

function getVideoKey(video: Pick<AdminVideoSummary, 'storyId' | 'videoId'>) {
  return `${video.storyId}::${video.videoId}`
}

function getTodayKey() {
  return toDateKey(new Date())
}

function toDateTimeLocalValue(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function getDefaultPublishOnLocal() {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)
  return toDateTimeLocalValue(now)
}

function toDateKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonthStart(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

function shiftMonth(value: Date, delta: number) {
  return new Date(value.getFullYear(), value.getMonth() + delta, 1)
}

function dateFromKey(value: string) {
  const [year, month] = value.split('-').map((part) => Number(part))
  if (!year || !month) {
    return new Date()
  }

  return new Date(year, month - 1, 1)
}

function getDateKeyFromPublishOn(value?: string) {
  return value ? value.slice(0, 10) : undefined
}

function toIsoFromDateTimeLocal(value: string): string | undefined {
  if (!value) {
    return undefined
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }

  return parsed.toISOString()
}

function toDateTimeLocalInputValue(value?: string) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return toDateTimeLocalValue(date)
}

function buildCalendarCells(month: Date) {
  const start = getMonthStart(month)
  const year = start.getFullYear()
  const monthIndex = start.getMonth()
  const leadingDays = start.getDay()
  const totalDays = new Date(year, monthIndex + 1, 0).getDate()
  const cells: Array<string | undefined> = []

  for (let index = 0; index < leadingDays; index += 1) {
    cells.push(undefined)
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(toDateKey(new Date(year, monthIndex, day)))
  }

  while (cells.length % 7 !== 0) {
    cells.push(undefined)
  }

  return cells
}

function buildActionMessage(video: AdminVideoSummary) {
  const base = `Actualizamos "${video.title}" a ${getVideoStatusLabel(video.status).toLowerCase()}.`
  if (video.status === 'programado' && video.publishOn) {
    return `${base} Publicación para ${formatScheduleLabel(video.publishOn)}.`
  }

  return base
}

function formatTimeLabel(value?: string) {
  if (!value) {
    return 'Sin hora'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminVideosPage() {
  const { data, error, isLoading, reload } = useAdminVideos()
  const [selectedVideoId, setSelectedVideoId] = useState<string>()
  const [selectedPublishOn, setSelectedPublishOn] = useState(getDefaultPublishOnLocal())
  const [calendarMonth, setCalendarMonth] = useState(getMonthStart(new Date()))
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false)
  const [actionError, setActionError] = useState<string>()
  const [actionMessage, setActionMessage] = useState<string>()
  const [previewError, setPreviewError] = useState<string>()
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [previewExpiresAt, setPreviewExpiresAt] = useState<string>()

  const videos = data?.videos || []
  const pendingVideos = videos.filter((video) => video.status === 'por_programar')
  const selectedVideo = videos.find((video) => getVideoKey(video) === selectedVideoId)
  const scheduledCountMap = new Map(
    (data?.stats.scheduledByDay || []).map((entry) => [entry.date, entry.count]),
  )
  const selectedPublishIso = toIsoFromDateTimeLocal(selectedPublishOn)
  const selectedPublishDay = getDateKeyFromPublishOn(selectedPublishIso) || getTodayKey()
  const videosOnSelectedDay = videos
    .filter(
      (video) => video.status === 'programado' && getDateKeyFromPublishOn(video.publishOn) === selectedPublishDay,
    )
    .sort((left, right) => {
      const leftValue = left.publishOn || ''
      const rightValue = right.publishOn || ''
      return (
        leftValue.localeCompare(rightValue) ||
        left.title.localeCompare(right.title) ||
        left.videoId.localeCompare(right.videoId)
      )
    })
  const calendarCells = buildCalendarCells(calendarMonth)
  const selectedDayCount = scheduledCountMap.get(selectedPublishDay) || 0

  useEffect(() => {
    if (!videos.length) {
      setSelectedVideoId(undefined)
      return
    }

    if (!selectedVideoId || !videos.some((video) => getVideoKey(video) === selectedVideoId)) {
      const fallback = pendingVideos[0] || videos[0]
      setSelectedVideoId(getVideoKey(fallback))

      if (fallback.publishOn) {
        setSelectedPublishOn(toDateTimeLocalInputValue(fallback.publishOn) || getDefaultPublishOnLocal())
        setCalendarMonth(dateFromKey(getDateKeyFromPublishOn(fallback.publishOn) || getTodayKey()))
      }
    }
  }, [pendingVideos, selectedVideoId, videos])

  const handleSelectVideo = (video: AdminVideoSummary) => {
    setSelectedVideoId(getVideoKey(video))
    setActionError(undefined)
    setActionMessage(undefined)
    setPreviewError(undefined)
    setPreviewUrl(undefined)
    setPreviewExpiresAt(undefined)

    if (video.publishOn) {
      setSelectedPublishOn(toDateTimeLocalInputValue(video.publishOn) || getDefaultPublishOnLocal())
      setCalendarMonth(dateFromKey(getDateKeyFromPublishOn(video.publishOn) || getTodayKey()))
    }
  }

  const handleSelectDay = (dateKey: string) => {
    const previousIso = toIsoFromDateTimeLocal(selectedPublishOn)
    const previousDate = previousIso ? new Date(previousIso) : new Date()
    const nextDate = new Date(`${dateKey}T00:00`)
    nextDate.setHours(previousDate.getHours(), previousDate.getMinutes(), 0, 0)
    setSelectedPublishOn(toDateTimeLocalValue(nextDate))
    setActionError(undefined)
    setActionMessage(undefined)
  }

  const handleLoadPreview = async () => {
    if (!selectedVideo) {
      return
    }

    setIsLoadingPreview(true)
    setPreviewError(undefined)

    try {
      const result = await getAdminVideoPreview(selectedVideo.storyId, selectedVideo.videoId)
      setPreviewUrl(result.previewUrl)
      setPreviewExpiresAt(result.expiresAt)
    } catch (previewLoadError) {
      setPreviewError(
        previewLoadError instanceof Error
          ? previewLoadError.message
          : 'No pudimos abrir la vista previa del video.',
      )
      setPreviewUrl(undefined)
      setPreviewExpiresAt(undefined)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleDownloadVideo = async () => {
    if (!selectedVideo) {
      return
    }

    setIsDownloadingVideo(true)
    setActionError(undefined)
    setActionMessage(undefined)

    try {
      const result = await getAdminVideoPreview(selectedVideo.storyId, selectedVideo.videoId)
      const response = await fetch(result.previewUrl)

      if (!response.ok) {
        throw new Error(`No pudimos descargar el video. HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = selectedVideo.sourceVideoFileName || `${selectedVideo.storyId}.mp4`
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(objectUrl)
      setActionMessage(`Descargamos "${selectedVideo.sourceVideoFileName || selectedVideo.title}".`)
    } catch (downloadError) {
      setActionError(
        downloadError instanceof Error
          ? downloadError.message
          : 'No pudimos descargar el video seleccionado.',
      )
    } finally {
      setIsDownloadingVideo(false)
    }
  }

  const handleCopyCaption = async () => {
    if (!selectedVideo?.caption) {
      setActionError('Ese video no tiene caption para copiar.')
      return
    }

    setActionError(undefined)
    setActionMessage(undefined)

    try {
      await navigator.clipboard.writeText(selectedVideo.caption)
      setActionMessage(`Copiamos el caption de "${selectedVideo.title}".`)
    } catch {
      setActionError('No pudimos copiar el caption al portapapeles.')
    }
  }

  const handleUpdateVideo = async (status: AdminVideoStatus, publishOn?: string | null) => {
    if (!selectedVideo) {
      return
    }

    setIsSaving(true)
    setActionError(undefined)
    setActionMessage(undefined)

    try {
      const result = await updateAdminVideo(
        selectedVideo.storyId,
        selectedVideo.videoId,
        status,
        publishOn,
      )
      setActionMessage(buildActionMessage(result.video))
      reload()
    } catch (updateError) {
      setActionError(
        updateError instanceof Error
          ? updateError.message
          : 'No pudimos actualizar el estado del video.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminLayout
      title="Videos"
      description="Programa videos para redes sociales desde el portal administrativo, con visibilidad diaria de la carga ya agendada por fecha."
      actions={
        <button type="button" className="btn secondary" onClick={reload} disabled={isLoading}>
          {isLoading ? 'Actualizando...' : 'Recargar videos'}
        </button>
      }
    >
      <section className="admin-video-summary-grid">
        <article className="admin-stat-card">
          <span className="eyebrow">Por programar</span>
          <strong>{data?.stats.pendingToSchedule || 0}</strong>
          <p>Videos listos para recibir una fecha en <code>publishOn</code>.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Programados</span>
          <strong>{data?.stats.scheduledVideos || 0}</strong>
          <p>Videos con fecha asignada y pendientes de publicarse.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Subidos</span>
          <strong>{data?.stats.uploadedVideos || 0}</strong>
          <p>Videos ya publicados o cargados a la red social objetivo.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Descartados</span>
          <strong>{data?.stats.discardedVideos || 0}</strong>
          <p>Piezas que no deben volver a entrar al calendario.</p>
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

      <section className="admin-videos-dashboard">
        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Pendientes</p>
            <h3>Videos en estado por programar</h3>
          </div>

          <div className="admin-video-list" role="list">
            {pendingVideos.map((video) => {
              const isSelected = getVideoKey(video) === selectedVideoId

              return (
                <button
                  key={getVideoKey(video)}
                  type="button"
                  role="listitem"
                  className={isSelected ? 'admin-video-row admin-video-row-active' : 'admin-video-row'}
                  onClick={() => {
                    handleSelectVideo(video)
                  }}
                >
                  <div className="admin-video-row-main">
                    <strong>{video.title}</strong>
                    <p>{video.storyId}</p>
                    {video.caption ? <p>{video.caption}</p> : null}
                  </div>
                  <div className="admin-video-row-meta">
                    <span className={video.hasCaption ? 'tag' : 'tag tag-muted'}>
                      {video.hasCaption ? 'Con caption' : 'Sin caption'}
                    </span>
                    <span className="admin-video-status-badge admin-video-status-por_programar">
                      {getVideoStatusLabel(video.status)}
                    </span>
                    <span className="admin-video-row-time">{formatDateTime(video.uploadedAt)}</span>
                  </div>
                </button>
              )
            })}

            {!pendingVideos.length && (
              <div className="admin-empty-state admin-empty-state-compact">
                <strong>No hay videos pendientes.</strong>
                <p>Cuando el paso 6 publique nuevos videos, aparecerán aquí con status por programar.</p>
              </div>
            )}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Calendario</p>
            <h3>Carga visual por día</h3>
          </div>

          <div className="admin-calendar-toolbar">
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setCalendarMonth((current) => shiftMonth(current, -1))
              }}
            >
              Mes anterior
            </button>

            <div className="admin-calendar-toolbar-copy">
              <strong>{formatMonthLabel(calendarMonth)}</strong>
              <p>
                {selectedDayCount} video{selectedDayCount === 1 ? '' : 's'} programado
                {selectedDayCount === 1 ? '' : 's'} el {formatDateLabel(selectedPublishDay)}.
              </p>
            </div>

            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setCalendarMonth((current) => shiftMonth(current, 1))
              }}
            >
              Mes siguiente
            </button>
          </div>

          <div className="admin-calendar-weekdays">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="admin-calendar-grid">
            {calendarCells.map((dateKey, index) => {
              if (!dateKey) {
                return <div key={`empty-${index}`} className="admin-calendar-day admin-calendar-day-empty" />
              }

              const isSelected = dateKey === selectedPublishDay
              const isToday = dateKey === getTodayKey()
              const count = scheduledCountMap.get(dateKey) || 0

              return (
                <button
                  key={dateKey}
                  type="button"
                  className={[
                    'admin-calendar-day',
                    isSelected ? 'admin-calendar-day-selected' : '',
                    isToday ? 'admin-calendar-day-today' : '',
                    count > 0 ? 'admin-calendar-day-busy' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    handleSelectDay(dateKey)
                  }}
                >
                  <span className="admin-calendar-day-number">{Number(dateKey.slice(-2))}</span>
                  <span className="admin-calendar-day-count">
                    {count > 0 ? `${count} programado${count === 1 ? '' : 's'}` : 'Libre'}
                  </span>
                </button>
              )
            })}
          </div>
        </article>
      </section>

      <section className="admin-videos-detail-grid">
        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Detalle</p>
            <h3>Video seleccionado</h3>
          </div>

          {selectedVideo ? (
            <div className="admin-video-detail">
              <div className="admin-video-detail-head">
                <div>
                  <strong>{selectedVideo.title}</strong>
                  <p>{selectedVideo.storyId}</p>
                </div>
                <span className={`admin-video-status-badge admin-video-status-${selectedVideo.status}`}>
                  {getVideoStatusLabel(selectedVideo.status)}
                </span>
              </div>

              <div className="admin-session-list">
                <div className="admin-session-item">
                  <span>Video ID</span>
                  <strong>{selectedVideo.videoId}</strong>
                </div>
                <div className="admin-session-item">
                  <span>Archivo</span>
                  <strong>{selectedVideo.sourceVideoFileName || 'Sin nombre local'}</strong>
                </div>
                <div className="admin-session-item">
                  <span>Tamaño</span>
                  <strong>{formatFileSize(selectedVideo.sourceVideoFileSizeBytes)}</strong>
                </div>
                <div className="admin-session-item">
                  <span>Subido a S3</span>
                  <strong>{formatDateTime(selectedVideo.uploadedAt)}</strong>
                </div>
                <div className="admin-session-item">
                  <span>Última actualización</span>
                  <strong>{formatDateTime(selectedVideo.updatedAt)}</strong>
                </div>
                <div className="admin-session-item">
                  <span>publishOn</span>
                  <strong>{formatScheduleLabel(selectedVideo.publishOn)}</strong>
                </div>
              </div>

              <div className="admin-video-action-card">
                <div className="admin-panel-head">
                  <p className="eyebrow">Caption</p>
                  <h3>Texto para publicación</h3>
                </div>

                <label className="admin-grant-field">
                  <span>Caption</span>
                  <textarea
                    value={selectedVideo.caption || ''}
                    readOnly
                    rows={5}
                    placeholder="Este video no tiene caption guardado."
                  />
                </label>

                <div className="admin-action-row">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      void handleCopyCaption()
                    }}
                    disabled={!selectedVideo.caption}
                  >
                    Copiar caption
                  </button>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      void handleDownloadVideo()
                    }}
                    disabled={isDownloadingVideo}
                  >
                    {isDownloadingVideo ? 'Descargando video...' : 'Descargar video'}
                  </button>
                </div>
              </div>

              <div className="admin-video-action-card">
                <div className="admin-panel-head">
                  <p className="eyebrow">Programación</p>
                  <h3>Asignar fecha y mover estado</h3>
                </div>

                <p className="admin-user-action-copy">
                  Selecciona un día en el calendario y ajusta la hora. El conteo superior te dice
                  cuántos videos ya están programados ese día.
                </p>

                <div className="admin-video-action-grid">
                  <label className="admin-grant-field">
                    <span>publishOn</span>
                    <input
                      type="datetime-local"
                      value={selectedPublishOn}
                      onChange={(event) => {
                        setSelectedPublishOn(event.target.value)
                        const nextIso = toIsoFromDateTimeLocal(event.target.value)
                        const nextDay = getDateKeyFromPublishOn(nextIso)
                        if (nextDay) {
                          setCalendarMonth(dateFromKey(nextDay))
                        }
                      }}
                    />
                  </label>

                  <div className="admin-inline-note">
                    <p>
                      {selectedDayCount} video{selectedDayCount === 1 ? '' : 's'} ya están
                      programado{selectedDayCount === 1 ? '' : 's'} para {formatDateLabel(selectedPublishDay)}.
                    </p>
                  </div>
                </div>

                <div className="admin-action-row">
                  <Link
                    to={selectedVideo ? appPaths.videoEdit(selectedVideo.storyId, selectedVideo.videoId) : appPaths.videos}
                    className="btn secondary"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      void handleLoadPreview()
                    }}
                    disabled={isLoadingPreview}
                  >
                    {isLoadingPreview ? 'Abriendo video...' : 'Ver video'}
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      void handleUpdateVideo('programado', selectedPublishIso)
                    }}
                    disabled={isSaving || !selectedPublishIso}
                  >
                    {isSaving ? 'Guardando...' : 'Programar video'}
                  </button>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      void handleUpdateVideo('por_programar', null)
                    }}
                    disabled={isSaving}
                  >
                    Volver a por programar
                  </button>
                </div>

                <div className="admin-action-row">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      void handleUpdateVideo('subido')
                    }}
                    disabled={isSaving}
                  >
                    Marcar como subido
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      void handleUpdateVideo('descartado')
                    }}
                    disabled={isSaving}
                  >
                    Descartar video
                  </button>
                </div>
              </div>

              {(previewError || previewUrl) && (
                <div className="admin-video-preview-card">
                  <div className="admin-panel-head">
                    <p className="eyebrow">Vista previa</p>
                    <h3>Reproducir en el portal</h3>
                  </div>

                  {previewError && (
                    <div className="admin-inline-alert admin-inline-alert-compact">
                      <p>{previewError}</p>
                    </div>
                  )}

                  {previewUrl && (
                    <>
                      <div className="admin-video-player-wrap">
                        <video
                          key={previewUrl}
                          className="admin-video-player"
                          controls
                          preload="metadata"
                          playsInline
                          src={previewUrl}
                        />
                      </div>
                      <p className="admin-video-preview-meta">
                        La URL temporal vence {formatDateTime(previewExpiresAt)}.
                      </p>
                    </>
                  )}
                </div>
              )}

              {selectedVideo.bucketPath && (
                <div className="admin-inline-note">
                  <p>
                    Bucket: <code>{selectedVideo.bucketPath}</code>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="admin-empty-state admin-empty-state-compact">
              <strong>No hay video seleccionado.</strong>
              <p>Selecciona un video pendiente o uno ya programado desde el calendario.</p>
            </div>
          )}
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Agenda del día</p>
            <h3>Videos programados para {formatDateLabel(selectedPublishOn)}</h3>
          </div>

          <div className="admin-video-list" role="list">
            {videosOnSelectedDay.map((video) => {
              const isSelected = getVideoKey(video) === selectedVideoId

              return (
                <button
                  key={getVideoKey(video)}
                  type="button"
                  role="listitem"
                  className={isSelected ? 'admin-video-row admin-video-row-active' : 'admin-video-row'}
                  onClick={() => {
                    handleSelectVideo(video)
                  }}
                >
                  <div className="admin-video-row-main">
                    <div className="admin-video-row-headline">
                      <strong>{video.title}</strong>
                      <span className="admin-video-time-badge">{formatTimeLabel(video.publishOn)}</span>
                    </div>
                    <p>{video.storyId}</p>
                    <code className="admin-video-file-label">
                      {video.sourceVideoFileName || video.bucketKey || video.videoId}
                    </code>
                  </div>
                  <div className="admin-video-row-meta">
                    <span className="admin-video-status-badge admin-video-status-programado">
                      {getVideoStatusLabel(video.status)}
                    </span>
                    <span className="admin-video-row-time">{formatScheduleLabel(video.publishOn)}</span>
                  </div>
                </button>
              )
            })}

            {!videosOnSelectedDay.length && (
              <div className="admin-empty-state admin-empty-state-compact">
                <strong>Ese día todavía está libre.</strong>
                <p>No hay videos programados para {formatDateLabel(selectedPublishDay)}.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </AdminLayout>
  )
}
