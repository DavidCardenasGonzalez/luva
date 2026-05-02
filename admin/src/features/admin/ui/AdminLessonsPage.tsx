import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createAdminLesson,
  deleteAdminLesson,
  createLessonVideoUpload,
  completeLessonVideoUpload,
} from '@/features/admin/api/admin-client'
import type { AdminLesson } from '@/features/admin/model/types'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'
import { appPaths } from '@/app/router/paths'
import { useAdminLessons } from '@/features/admin/model/use-admin-lessons'

type CreateFormState = { title: string; prompt: string }

function formatDateTime(value?: string) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

export function AdminLessonsPage() {
  const navigate = useNavigate()
  const { data, isLoading, error, reload } = useAdminLessons()

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateFormState>({ title: '', prompt: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const videoInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null)
  const [videoProgress, setVideoProgress] = useState<number | null>(null)
  const [selectedVideos, setSelectedVideos] = useState<Record<string, File>>({})
  const [videoUploadError, setVideoUploadError] = useState<Record<string, string>>({})

  function handleVideoFileChange(lessonId: string, file: File | undefined) {
    if (!file) return
    setSelectedVideos((prev) => ({ ...prev, [lessonId]: file }))
    setVideoUploadError((prev) => { const next = { ...prev }; delete next[lessonId]; return next })
  }

  async function handleVideoUpload(lessonId: string) {
    const file = selectedVideos[lessonId]
    if (!file) return
    setUploadingLessonId(lessonId)
    setVideoProgress(0)
    setVideoUploadError((prev) => { const next = { ...prev }; delete next[lessonId]; return next })
    try {
      const { uploadUrl, key } = await createLessonVideoUpload(lessonId, file.type)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setVideoProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)))
        xhr.onerror = () => reject(new Error('Error de red al subir el video.'))
        xhr.send(file)
      })
      await completeLessonVideoUpload(lessonId, key)
      setSelectedVideos((prev) => { const next = { ...prev }; delete next[lessonId]; return next })
      const ref = videoInputRefs.current.get(lessonId)
      if (ref) ref.value = ''
      reload()
    } catch (err) {
      setVideoUploadError((prev) => ({
        ...prev,
        [lessonId]: err instanceof Error ? err.message : 'Error al subir el video.',
      }))
    } finally {
      setUploadingLessonId(null)
      setVideoProgress(null)
    }
  }

  async function handleCreate() {
    setCreateError(null)
    if (!form.title.trim()) { setCreateError('Escribe un título para la lección.'); return }
    if (!form.prompt.trim()) { setCreateError('Describe el tema de la clase.'); return }
    setCreating(true)
    try {
      const res = await createAdminLesson({ title: form.title.trim(), prompt: form.prompt.trim() })
      navigate(appPaths.lessonEditor(res.lesson.lessonId))
    } catch {
      setCreateError('No se pudo crear la lección. Intenta de nuevo.')
      setCreating(false)
    }
  }

  async function handleDelete(lesson: AdminLesson) {
    if (!window.confirm(`¿Eliminar "${lesson.title}" y todos sus assets?`)) return
    setDeletingId(lesson.lessonId)
    try {
      await deleteAdminLesson(lesson.lessonId)
      reload()
    } catch {
      /* ignore — just reload */
      reload()
    } finally {
      setDeletingId(null)
    }
  }

  const [onlyWithoutVideo, setOnlyWithoutVideo] = useState(false)

  const allLessons = data?.lessons || []
  const lessons = onlyWithoutVideo ? allLessons.filter((l) => !l.videoUrl) : allLessons

  return (
    <AdminLayout
      title="Lecciones de inglés"
      description="Crea clases con guion generado por IA, quiz, audio TTS, subtítulos y video."
      actions={
        <button type="button" className="btn secondary" onClick={reload} disabled={isLoading}>
          {isLoading ? 'Cargando...' : 'Recargar'}
        </button>
      }
    >
      {/* Header panel */}
      <section className="admin-panel">
        <div className="admin-panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p className="eyebrow">{onlyWithoutVideo ? 'Sin video' : 'Todas las lecciones'}</p>
            <h3>{isLoading ? '…' : `${lessons.length} ${lessons.length === 1 ? 'lección' : 'lecciones'}`}</h3>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={onlyWithoutVideo}
              onChange={(e) => setOnlyWithoutVideo(e.target.checked)}
            />
            Solo sin video
          </label>
          {!showCreate && (
            <button
              type="button"
              className="btn primary"
              onClick={() => { setShowCreate(true); setCreateError(null) }}
            >
              + Nueva lección
            </button>
          )}
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="admin-lesson-create-form">
            <p className="eyebrow" style={{ marginBottom: 16 }}>Nueva lección</p>

            <div className="admin-grant-field">
              <label htmlFor="lesson-title">Título</label>
              <input
                id="lesson-title"
                type="text"
                placeholder="Ej. Using present perfect in conversations"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                disabled={creating}
                autoFocus
              />
            </div>

            <div className="admin-grant-field" style={{ marginTop: 14 }}>
              <label htmlFor="lesson-prompt">Tema de la clase (prompt libre)</label>
              <textarea
                id="lesson-prompt"
                placeholder="Describe de qué va a tratar la clase. Ej: Quiero enseñar cómo usar 'used to' para hablar de hábitos del pasado, con ejemplos cotidianos para adultos."
                rows={4}
                value={form.prompt}
                onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                disabled={creating}
              />
            </div>

            {createError && (
              <div className="admin-inline-alert admin-inline-alert-compact" style={{ marginTop: 14 }}>
                <p>{createError}</p>
              </div>
            )}

            <div className="admin-topbar-actions" style={{ marginTop: 18 }}>
              <button type="button" className="btn primary" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creando...' : 'Crear y abrir editor'}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => { setShowCreate(false); setCreateError(null); setForm({ title: '', prompt: '' }) }}
                disabled={creating}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="admin-inline-alert admin-inline-alert-compact" style={{ marginTop: 20 }}>
            <p>{error}</p>
          </div>
        )}

        {/* Lesson list */}
        {isLoading && !data ? (
          <div className="admin-empty-state admin-empty-state-compact" style={{ marginTop: 24 }}>
            <p style={{ color: 'var(--muted)' }}>Cargando lecciones...</p>
          </div>
        ) : lessons.length === 0 && !showCreate ? (
          <div className="admin-empty-state admin-empty-state-compact" style={{ marginTop: 24 }}>
            <strong>Sin lecciones todavía</strong>
            <p>Crea la primera lección y el editor te guía paso a paso.</p>
            <button
              type="button"
              className="btn primary"
              onClick={() => setShowCreate(true)}
              style={{ marginTop: 4, width: 'fit-content' }}
            >
              + Nueva lección
            </button>
          </div>
        ) : (
          <div className="admin-lesson-list">
            {lessons.map((lesson) => (
              <div key={lesson.lessonId} className="admin-lesson-row">
                <div className="admin-lesson-row-main">
                  <div className="admin-lesson-row-copy">
                    <div className="admin-lesson-row-headline">
                      <strong>{lesson.title}</strong>
                      <span className={`admin-lesson-status-badge admin-lesson-status-${lesson.status}`}>
                        {lesson.status === 'ready' ? 'Lista' : 'Borrador'}
                      </span>
                    </div>
                    <p>{lesson.prompt.length > 100 ? `${lesson.prompt.slice(0, 100)}…` : lesson.prompt}</p>
                  </div>

                  <div className="admin-lesson-row-assets">
                    {(lesson.audioStatus === 'pending' || lesson.audioStatus === 'processing') && (
                      <span className="tag">Audio generando</span>
                    )}
                    {lesson.audioUrl && (
                      <span className="tag">Audio</span>
                    )}
                    {lesson.subtitlesUrl && (
                      <span className="tag">SRT EN</span>
                    )}
                    {lesson.translatedSubtitlesUrl && (
                      <span className="tag">SRT ES</span>
                    )}
                    {lesson.videoUrl && (
                      <span className="tag">Video</span>
                    )}
                    {lesson.quiz && lesson.quiz.length > 0 && (
                      <span className="tag">Quiz</span>
                    )}
                  </div>
                </div>

                <div className="admin-lesson-row-meta">
                  <span className="admin-video-time-badge">{formatDateTime(lesson.createdAt)}</span>

                  {/* Inline video upload */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      ref={(el) => {
                        if (el) videoInputRefs.current.set(lesson.lessonId, el)
                        else videoInputRefs.current.delete(lesson.lessonId)
                      }}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/mpeg"
                      style={{ display: 'none' }}
                      disabled={uploadingLessonId === lesson.lessonId}
                      onChange={(e) => handleVideoFileChange(lesson.lessonId, e.target.files?.[0])}
                    />
                    {selectedVideos[lesson.lessonId] ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {selectedVideos[lesson.lessonId].name} · {(selectedVideos[lesson.lessonId].size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        {uploadingLessonId === lesson.lessonId && videoProgress !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="admin-lesson-progress-bar" style={{ flex: 1 }}>
                              <div className="admin-lesson-progress-fill" style={{ width: `${videoProgress}%` }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{videoProgress}%</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn primary"
                            style={{ padding: '6px 12px', fontSize: 13 }}
                            disabled={uploadingLessonId === lesson.lessonId}
                            onClick={() => handleVideoUpload(lesson.lessonId)}
                          >
                            {uploadingLessonId === lesson.lessonId ? 'Subiendo...' : 'Subir'}
                          </button>
                          <button
                            type="button"
                            className="btn ghost"
                            style={{ padding: '6px 12px', fontSize: 13 }}
                            disabled={uploadingLessonId === lesson.lessonId}
                            onClick={() => {
                              setSelectedVideos((prev) => { const next = { ...prev }; delete next[lesson.lessonId]; return next })
                              const ref = videoInputRefs.current.get(lesson.lessonId)
                              if (ref) ref.value = ''
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn ghost"
                        style={{ padding: '6px 12px', fontSize: 13 }}
                        disabled={uploadingLessonId === lesson.lessonId}
                        onClick={() => videoInputRefs.current.get(lesson.lessonId)?.click()}
                      >
                        {lesson.videoUrl ? 'Reemplazar video' : 'Subir video'}
                      </button>
                    )}
                    {videoUploadError[lesson.lessonId] && (
                      <span style={{ fontSize: 12, color: 'var(--danger, #e53e3e)' }}>
                        {videoUploadError[lesson.lessonId]}
                      </span>
                    )}
                  </div>

                  <div className="admin-topbar-actions">
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: '9px 14px', fontSize: 14 }}
                      onClick={() => navigate(appPaths.lessonEditor(lesson.lessonId))}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn admin-btn-danger"
                      style={{ padding: '9px 14px', fontSize: 14 }}
                      disabled={deletingId === lesson.lessonId}
                      onClick={() => handleDelete(lesson)}
                    >
                      {deletingId === lesson.lessonId ? '…' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  )
}
