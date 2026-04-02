import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { buildStoryMissionsPath } from '@/app/router/paths'
import {
  EMPTY_PROGRESS,
  fetchUserProgress,
  type UserProgressRecord,
} from '@/features/progress/api/progress-client'
import { fetchStorySummaries, type StorySummary } from '@/features/stories/api/story-catalog'
import {
  getCompletedMissionsCount,
  isStoryCompleted,
} from '@/features/stories/lib/story-progress'
import { getErrorMessage } from '@/shared/lib/error-message'

export function StoriesIndexPage() {
  const [stories, setStories] = useState<StorySummary[]>([])
  const [progress, setProgress] = useState<UserProgressRecord>(EMPTY_PROGRESS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false

    const loadStories = async () => {
      try {
        setLoading(true)
        setError(undefined)
        const [storiesResult, progressResult] = await Promise.allSettled([
          fetchStorySummaries(),
          fetchUserProgress(),
        ])
        if (storiesResult.status === 'rejected') {
          throw storiesResult.reason
        }
        if (!cancelled) {
          setStories(storiesResult.value)
          setProgress(progressResult.status === 'fulfilled' ? progressResult.value : EMPTY_PROGRESS)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, 'No pudimos cargar las historias.'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadStories()

    return () => {
      cancelled = true
    }
  }, [])

  const summary = useMemo(() => {
    const totals = stories.reduce(
      (accumulator, story) => {
        const completed = Math.min(
          getCompletedMissionsCount(progress, story.storyId),
          story.missionsCount,
        )
        accumulator.completed += completed
        accumulator.total += story.missionsCount
        if (isStoryCompleted(progress, story.storyId)) {
          accumulator.completedStories += 1
        }
        return accumulator
      },
      { completed: 0, total: 0, completedStories: 0 },
    )

    return {
      totalMissions: totals.total,
      completedMissions: totals.completed,
      completedStories: totals.completedStories,
      progressPercent: totals.total ? Math.round((totals.completed / totals.total) * 100) : 0,
    }
  }, [progress, stories])

  return (
    <div className="stories-page">
      <section className="stories-hero-card">
        <div>
          <p className="eyebrow">Historias</p>
          <h1>Misiones narrativas</h1>
          <p className="lede">
            Explora storylines completas, abre cada misión y practica con chat contextual en la
            web.
          </p>
        </div>

        <div className="stories-hero-meter">
          <span>Misiones completadas</span>
          <strong>{summary.progressPercent}%</strong>
          <div className="dashboard-meter-track" aria-hidden="true">
            <div className="dashboard-meter-fill" style={{ width: `${summary.progressPercent}%` }} />
          </div>
          <p>
            {summary.completedMissions} de {summary.totalMissions} misiones y {summary.completedStories}{' '}
            historias cerradas.
          </p>
        </div>
      </section>

      {error ? (
        <section className="dashboard-feedback dashboard-feedback-error">
          <strong>No pudimos cargar el catálogo narrativo.</strong>
          <p>{error}</p>
        </section>
      ) : null}

      <section className="stories-stats-grid">
        <article className="stories-stat-card">
          <span className="tag">Historias</span>
          <strong>{stories.length}</strong>
          <p>Catálogo narrativo disponible en esta versión web.</p>
        </article>
        <article className="stories-stat-card">
          <span className="tag">Misiones</span>
          <strong>{summary.completedMissions}</strong>
          <p>Progreso combinado sobre todas las historias.</p>
        </article>
        <article className="stories-stat-card">
          <span className="tag">Completadas</span>
          <strong>{summary.completedStories}</strong>
          <p>Historias que ya tienen todas sus misiones terminadas.</p>
        </article>
      </section>

      <section className="stories-list">
        {loading ? (
          <article className="stories-empty-state">
            <strong>Cargando historias…</strong>
            <p>Estamos armando el catálogo y cruzándolo con tu progreso sincronizado.</p>
          </article>
        ) : stories.length ? (
          stories.map((story) => {
            const completed = Math.min(
              getCompletedMissionsCount(progress, story.storyId),
              story.missionsCount,
            )
            const progressPercent = story.missionsCount
              ? Math.round((completed / story.missionsCount) * 100)
              : 0
            const completedStory = isStoryCompleted(progress, story.storyId)

            return (
              <article key={story.storyId} className="story-card">
                <div className="story-card-head">
                  <div>
                    <div className="story-card-tags">
                      {story.level ? <span className="chip">Nivel {story.level}</span> : null}
                      <span className="chip">{story.missionsCount} misiones</span>
                      {story.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2>{story.title}</h2>
                    <p>{story.summary}</p>
                  </div>
                  <div className="story-card-status">
                    <span
                      className={`story-status-pill${
                        completedStory ? ' story-status-pill-complete' : ''
                      }`}
                    >
                      {completedStory ? 'Completada' : 'Disponible'}
                    </span>
                    <Link to={buildStoryMissionsPath(story.storyId)} className="btn primary">
                      Ver misiones
                    </Link>
                  </div>
                </div>

                <div className="dashboard-meter-track" aria-hidden="true">
                  <div className="dashboard-meter-fill" style={{ width: `${progressPercent}%` }} />
                </div>

                <div className="story-card-footer">
                  <span>
                    {completed}/{story.missionsCount} misiones completadas
                  </span>
                  <span>{progressPercent}% de avance</span>
                </div>
              </article>
            )
          })
        ) : (
          <article className="stories-empty-state">
            <strong>No encontramos historias disponibles.</strong>
            <p>Revisa que el catálogo embebido o el backend estén devolviendo stories válidas.</p>
          </article>
        )}
      </section>
    </div>
  )
}
