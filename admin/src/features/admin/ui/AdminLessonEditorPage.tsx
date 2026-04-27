import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  completeLessonVideoUpload,
  createLessonVideoUpload,
  generateLessonAudio,
  generateLessonQuiz,
  generateLessonScript,
  generateLessonSubtitles,
  getAdminLessons,
  getLessonVoices,
  translateLessonSubtitles,
  updateLessonScript,
} from '@/features/admin/api/admin-client'
import type { AdminLesson, AdminLessonVoice, AdminQuizQuestion } from '@/features/admin/model/types'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'
import { appPaths } from '@/app/router/paths'

type Step = 'script' | 'quiz' | 'audio' | 'subtitles' | 'video'

const STEPS: Array<{ id: Step; label: string }> = [
  { id: 'script',    label: '1. Guion' },
  { id: 'quiz',      label: '2. Quiz' },
  { id: 'audio',     label: '3. Audio' },
  { id: 'subtitles', label: '4. Subtítulos' },
  { id: 'video',     label: '5. Video' },
]

function voiceGenderLabel(gender: AdminLessonVoice['gender']): string {
  if (gender === 'FEMALE') return 'Femenina'
  if (gender === 'MALE') return 'Masculina'
  return 'Neutral'
}

function isDone(lesson: AdminLesson | null, step: Step): boolean {
  if (!lesson) return false
  return (
    (step === 'script' && !!lesson.script) ||
    (step === 'quiz' && !!(lesson.quiz && lesson.quiz.length > 0)) ||
    (step === 'audio' && !!lesson.audioUrl) ||
    (step === 'subtitles' && !!lesson.subtitlesUrl) ||
    (step === 'video' && !!lesson.videoUrl)
  )
}

export function AdminLessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()

  const [lesson, setLesson] = useState<AdminLesson | null>(null)
  const [loadingLesson, setLoadingLesson] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<Step>('script')
  const [working, setWorking] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)

  const [scriptText, setScriptText] = useState('')
  const [scriptDirty, setScriptDirty] = useState(false)

  const [voices, setVoices] = useState<AdminLessonVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState('')

  const videoFileRef = useRef<HTMLInputElement>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoProgress, setVideoProgress] = useState<number | null>(null)

  useEffect(() => {
    if (!lessonId) return
    getAdminLessons()
      .then((res) => {
        const found = res.lessons.find((l) => l.lessonId === lessonId)
        if (!found) { setLoadError('Lección no encontrada.'); return }
        setLesson(found)
        setScriptText(found.script || '')
      })
      .catch(() => setLoadError('No se pudo cargar la lección.'))
      .finally(() => setLoadingLesson(false))
  }, [lessonId])

  useEffect(() => {
    if (activeStep !== 'audio' || voices.length > 0) return
    getLessonVoices()
      .then((res) => {
        setVoices(res.voices)
        if (res.voices.length > 0) {
          const savedValid = lesson?.voiceId && res.voices.some((v) => v.id === lesson.voiceId)
          setSelectedVoice(savedValid ? lesson!.voiceId! : res.voices[0].id)
        }
      })
      .catch(() => {})
  }, [activeStep, voices.length, lesson?.voiceId])

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    setStepError(null)
    setWorking(true)
    try { return await fn() }
    catch (err) {
      setStepError(err instanceof Error ? err.message : 'Ocurrió un error. Intenta de nuevo.')
      return null
    }
    finally { setWorking(false) }
  }

  async function handleGenerateScript() {
    if (!lessonId) return
    const res = await run(() => generateLessonScript(lessonId))
    if (!res) return
    setLesson(res.lesson); setScriptText(res.lesson.script || ''); setScriptDirty(false)
  }

  async function handleSaveScript() {
    if (!lessonId) return
    const res = await run(() => updateLessonScript(lessonId, scriptText))
    if (!res) return
    setLesson(res.lesson); setScriptDirty(false)
  }

  async function handleGenerateQuiz() {
    if (!lessonId) return
    const res = await run(() => generateLessonQuiz(lessonId))
    if (!res) return; setLesson(res.lesson)
  }

  async function handleGenerateAudio() {
    if (!lessonId || !selectedVoice) return
    const res = await run(() => generateLessonAudio(lessonId, selectedVoice))
    if (!res) return; setLesson(res.lesson)
  }

  async function handleGenerateSubtitles() {
    if (!lessonId) return
    const res = await run(() => generateLessonSubtitles(lessonId))
    if (!res) return; setLesson(res.lesson)
  }

  async function handleTranslateSubtitles() {
    if (!lessonId) return
    const res = await run(() => translateLessonSubtitles(lessonId, 'es'))
    if (!res) return; setLesson(res.lesson)
  }

  async function handleVideoUpload() {
    if (!lessonId || !videoFile) return
    setUploadingVideo(true); setVideoProgress(0); setStepError(null)
    try {
      const { uploadUrl, key } = await createLessonVideoUpload(lessonId, videoFile.type)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', videoFile.type)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setVideoProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Error ${xhr.status}`)))
        xhr.onerror = () => reject(new Error('Error de red'))
        xhr.send(videoFile)
      })
      const res = await completeLessonVideoUpload(lessonId, key)
      setLesson(res.lesson); setVideoFile(null); setVideoProgress(null)
      if (videoFileRef.current) videoFileRef.current.value = ''
    } catch (err) {
      setStepError(err instanceof Error ? err.message : 'Error al subir el video.')
    } finally { setUploadingVideo(false) }
  }

  if (loadingLesson) {
    return (
      <AdminLayout title="Editor de lección" description="Cargando...">
        <div className="admin-empty-state"><p>Cargando lección...</p></div>
      </AdminLayout>
    )
  }

  if (loadError || !lesson) {
    return (
      <AdminLayout title="Editor de lección" description="">
        <div className="admin-inline-alert"><p>{loadError || 'Lección no encontrada.'}</p></div>
        <button type="button" className="btn secondary" style={{ marginTop: 16 }}
          onClick={() => navigate(appPaths.lessons)}>← Volver</button>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title={lesson.title}
      description={lesson.prompt.length > 110 ? `${lesson.prompt.slice(0, 110)}…` : lesson.prompt}
      actions={
        <button type="button" className="btn ghost" onClick={() => navigate(appPaths.lessons)}>
          ← Lecciones
        </button>
      }
    >
      {/* Step tabs */}
      <div className="admin-lesson-steps">
        {STEPS.map((step) => {
          const done = isDone(lesson, step.id)
          const active = activeStep === step.id
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => { setActiveStep(step.id); setStepError(null) }}
              className={[
                'admin-lesson-step',
                active ? 'admin-lesson-step-active' : '',
                done && !active ? 'admin-lesson-step-done' : '',
              ].filter(Boolean).join(' ')}
            >
              <span className="admin-lesson-step-dot">{done ? '✓' : ''}</span>
              {step.label}
            </button>
          )
        })}
      </div>

      {stepError && (
        <div className="admin-inline-alert" style={{ marginBottom: 20 }}>
          <p>{stepError}</p>
        </div>
      )}

      {/* ── Script ───────────────────────────────────────────────────────── */}
      {activeStep === 'script' && (
        <section className="admin-panel">
          <div className="admin-lesson-editor-head">
            <div className="admin-lesson-editor-head-copy">
              <p className="eyebrow">Paso 1</p>
              <h3>Guion del video</h3>
              <p className="lede">La IA genera el guion basado en tu tema. Edítalo libremente.</p>
            </div>
            <div className="admin-lesson-editor-actions">
              {scriptDirty && (
                <button className="btn primary" type="button" onClick={handleSaveScript} disabled={working}>
                  {working ? 'Guardando...' : 'Guardar'}
                </button>
              )}
              <button className="btn secondary" type="button" onClick={handleGenerateScript} disabled={working}>
                {working ? 'Generando...' : lesson.script ? 'Regenerar con IA' : 'Generar con IA'}
              </button>
            </div>
          </div>

          <textarea
            className="admin-lesson-script-field"
            rows={22}
            placeholder={'El guion aparecerá aquí.\nPulsa "Generar con IA" para empezar.'}
            value={scriptText}
            onChange={(e) => { setScriptText(e.target.value); setScriptDirty(true) }}
            disabled={working}
          />

          {lesson.script && !scriptDirty && (
            <div style={{ marginTop: 18 }}>
              <button className="btn primary" type="button" onClick={() => setActiveStep('quiz')}>
                Siguiente: Quiz →
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Quiz ─────────────────────────────────────────────────────────── */}
      {activeStep === 'quiz' && (
        <section className="admin-panel">
          <div className="admin-lesson-editor-head">
            <div className="admin-lesson-editor-head-copy">
              <p className="eyebrow">Paso 2</p>
              <h3>Quiz de comprensión</h3>
              <p className="lede">5 preguntas de opción múltiple generadas desde el guion.</p>
            </div>
            <div className="admin-lesson-editor-actions">
              <button className="btn secondary" type="button" onClick={handleGenerateQuiz}
                disabled={working || !lesson.script}>
                {working ? 'Generando...' : lesson.quiz ? 'Regenerar quiz' : 'Generar quiz'}
              </button>
            </div>
          </div>

          {!lesson.script && (
            <div className="admin-inline-alert admin-inline-alert-compact">
              <p>Primero genera el guion en el Paso 1.</p>
            </div>
          )}

          {lesson.quiz && lesson.quiz.length > 0 ? (
            <>
              <div className="admin-lesson-quiz-grid">
                {lesson.quiz.map((q: AdminQuizQuestion, qi: number) => (
                  <div key={qi} className="admin-stack-card">
                    <p className="eyebrow">Pregunta {qi + 1}</p>
                    <p style={{ marginTop: 10, fontWeight: 700, fontSize: 17, lineHeight: 1.4 }}>{q.question}</p>
                    <ol type="A" style={{ paddingLeft: 20, margin: '14px 0 0', display: 'grid', gap: 8 }}>
                      {q.options.map((opt: string, oi: number) => (
                        <li key={oi} style={{
                          color: oi === q.correctIndex ? 'var(--accent)' : 'var(--muted)',
                          fontWeight: oi === q.correctIndex ? 800 : 500,
                        }}>
                          {opt}{oi === q.correctIndex && ' ✓'}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 22 }}>
                <button className="btn primary" type="button" onClick={() => setActiveStep('audio')}>
                  Siguiente: Audio →
                </button>
              </div>
            </>
          ) : lesson.script && !working ? (
            <div className="admin-empty-state admin-empty-state-compact" style={{ marginTop: 22 }}>
              <strong>Sin quiz todavía</strong>
              <p>Pulsa "Generar quiz" para crear las preguntas automáticamente.</p>
            </div>
          ) : null}
        </section>
      )}

      {/* ── Audio ────────────────────────────────────────────────────────── */}
      {activeStep === 'audio' && (
        <section className="admin-panel">
          <div className="admin-lesson-editor-head">
            <div className="admin-lesson-editor-head-copy">
              <p className="eyebrow">Paso 3</p>
              <h3>Audio Text-to-Speech</h3>
              <p className="lede">Gemini TTS convierte el guion en audio WAV con perfil de entrenador corporativo.</p>
            </div>
          </div>

          {!lesson.script ? (
            <div className="admin-inline-alert admin-inline-alert-compact">
              <p>Primero genera el guion en el Paso 1.</p>
            </div>
          ) : (
            <div className="admin-lesson-audio-grid">
              <div className="admin-user-action-card">
                <p className="eyebrow">Configuración</p>

                <div style={{ marginTop: 14 }}>
                  <label className="admin-lesson-field-label" htmlFor="voice-select">Voz</label>
                  <select
                    id="voice-select"
                    className="admin-lesson-select"
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    disabled={working || voices.length === 0}
                  >
                    {voices.length === 0
                      ? <option value="">Cargando voces…</option>
                      : voices.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} · {v.languageCode} · {voiceGenderLabel(v.gender)}
                          </option>
                        ))
                    }
                  </select>
                </div>

                <button className="btn primary" type="button" style={{ marginTop: 16 }}
                  onClick={handleGenerateAudio} disabled={working || !selectedVoice}>
                  {working ? 'Generando audio...' : lesson.audioUrl ? 'Regenerar audio' : 'Generar audio'}
                </button>
              </div>

              <div className="admin-user-action-card">
                <p className="eyebrow">Reproducción</p>
                {lesson.audioUrl ? (
                  <div style={{ marginTop: 12 }}>
                    <audio controls src={lesson.audioUrl} style={{ width: '100%' }} />
                    <a href={lesson.audioUrl} target="_blank" rel="noopener noreferrer"
                      className="admin-lesson-link" style={{ marginTop: 10, display: 'inline-block' }}>
                      Descargar WAV ↗
                    </a>
                  </div>
                ) : (
                  <p style={{ marginTop: 14, color: 'var(--muted)' }}>
                    El audio aparecerá aquí listo para reproducir.
                  </p>
                )}
              </div>
            </div>
          )}

          {lesson.audioUrl && (
            <div style={{ marginTop: 22 }}>
              <button className="btn primary" type="button" onClick={() => setActiveStep('subtitles')}>
                Siguiente: Subtítulos →
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Subtitles ─────────────────────────────────────────────────────── */}
      {activeStep === 'subtitles' && (
        <section className="admin-panel">
          <div className="admin-lesson-editor-head">
            <div className="admin-lesson-editor-head-copy">
              <p className="eyebrow">Paso 4</p>
              <h3>Subtítulos SRT</h3>
              <p className="lede">Genera en inglés y traduce al español con Google Translate.</p>
            </div>
          </div>

          {!lesson.script ? (
            <div className="admin-inline-alert admin-inline-alert-compact">
              <p>Primero genera el guion en el Paso 1.</p>
            </div>
          ) : (
            <div className="admin-stack-grid">
              <div className="admin-user-action-card">
                <p className="eyebrow">Inglés (EN)</p>
                {lesson.subtitlesUrl ? (
                  <div className="admin-inline-note admin-inline-note-success admin-inline-note-compact"
                    style={{ marginTop: 12 }}>
                    <div className="admin-inline-note-head">
                      <span className="tag">Listo</span>
                      <strong>subtitles_en.srt</strong>
                    </div>
                    <a href={lesson.subtitlesUrl} target="_blank" rel="noopener noreferrer"
                      className="admin-lesson-link">Descargar ↗</a>
                  </div>
                ) : (
                  <p style={{ marginTop: 12, color: 'var(--muted)' }}>No generados aún.</p>
                )}
                <button className="btn secondary" type="button" style={{ marginTop: 14 }}
                  onClick={handleGenerateSubtitles} disabled={working}>
                  {working ? 'Generando...' : lesson.subtitlesUrl ? 'Regenerar EN' : 'Generar EN'}
                </button>
              </div>

              <div className="admin-user-action-card">
                <p className="eyebrow">Español (ES)</p>
                {lesson.translatedSubtitlesUrl ? (
                  <div className="admin-inline-note admin-inline-note-success admin-inline-note-compact"
                    style={{ marginTop: 12 }}>
                    <div className="admin-inline-note-head">
                      <span className="tag">Traducido</span>
                      <strong>subtitles_es.srt</strong>
                    </div>
                    <a href={lesson.translatedSubtitlesUrl} target="_blank" rel="noopener noreferrer"
                      className="admin-lesson-link">Descargar ↗</a>
                  </div>
                ) : (
                  <p style={{ marginTop: 12, color: 'var(--muted)' }}>No traducidos aún.</p>
                )}
                <button className="btn secondary" type="button" style={{ marginTop: 14 }}
                  onClick={handleTranslateSubtitles} disabled={working || !lesson.subtitlesKey}>
                  {working ? 'Traduciendo...' : lesson.translatedSubtitlesUrl ? 'Retraducir ES' : 'Traducir a ES'}
                </button>
              </div>
            </div>
          )}

          {(lesson.subtitlesUrl || lesson.translatedSubtitlesUrl) && (
            <div style={{ marginTop: 22 }}>
              <button className="btn primary" type="button" onClick={() => setActiveStep('video')}>
                Siguiente: Video →
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Video ─────────────────────────────────────────────────────────── */}
      {activeStep === 'video' && (
        <section className="admin-panel">
          <div className="admin-lesson-editor-head">
            <div className="admin-lesson-editor-head-copy">
              <p className="eyebrow">Paso 5</p>
              <h3>Video de la clase</h3>
              <p className="lede">Sube el video final. Se guarda en assets y la lección queda lista.</p>
            </div>
          </div>

          <div className="admin-lesson-video-grid">
            <div className="admin-user-action-card">
              <p className="eyebrow">{lesson.videoUrl ? 'Reemplazar video' : 'Subir video'}</p>

              <div style={{ marginTop: 14 }}>
                <label className="admin-lesson-field-label" htmlFor="video-file">Archivo</label>
                <input
                  id="video-file"
                  type="file"
                  className="admin-lesson-file-input"
                  accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/mpeg"
                  ref={videoFileRef}
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  disabled={uploadingVideo}
                />
              </div>

              {videoFile && (
                <p style={{ marginTop: 8, color: 'var(--muted)', fontSize: 14 }}>
                  {videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}

              {videoProgress !== null && (
                <div style={{ marginTop: 14 }}>
                  <div className="admin-lesson-progress-track">
                    <div className="admin-lesson-progress-fill" style={{ width: `${videoProgress}%` }} />
                  </div>
                  <p style={{ marginTop: 6, fontSize: 13, color: 'var(--muted)' }}>
                    Subiendo {videoProgress}%…
                  </p>
                </div>
              )}

              <button className="btn primary" type="button" style={{ marginTop: 18 }}
                onClick={handleVideoUpload} disabled={!videoFile || uploadingVideo}>
                {uploadingVideo ? 'Subiendo...' : 'Subir video'}
              </button>
            </div>

            <div className="admin-user-action-card">
              <p className="eyebrow">Vista previa</p>
              {lesson.videoUrl ? (
                <div style={{ marginTop: 12 }}>
                  <div className="admin-video-player-wrap">
                    <video controls src={lesson.videoUrl} className="admin-video-player" />
                  </div>
                  <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer"
                    className="admin-lesson-link" style={{ marginTop: 10, display: 'inline-block' }}>
                    Abrir video ↗
                  </a>
                </div>
              ) : (
                <p style={{ marginTop: 14, color: 'var(--muted)' }}>
                  El video subido aparecerá aquí.
                </p>
              )}
            </div>
          </div>

          {lesson.videoUrl && (
            <div className="admin-inline-note admin-inline-note-success" style={{ marginTop: 22 }}>
              <div className="admin-inline-note-head">
                <span className="tag">Lista</span>
                <strong>Lección completada</strong>
              </div>
              <p>Tiene guion, audio, subtítulos y video.</p>
            </div>
          )}
        </section>
      )}
    </AdminLayout>
  )
}
