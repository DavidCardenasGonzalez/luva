import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAdminLesson, deleteAdminLesson } from '@/features/admin/api/admin-client'
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

  const lessons = data?.lessons || []

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
            <p className="eyebrow">Todas las lecciones</p>
            <h3>{isLoading ? '…' : `${lessons.length} ${lessons.length === 1 ? 'lección' : 'lecciones'}`}</h3>
          </div>
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
