import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { appPaths, buildStoryChatPath, buildStoryMissionsPath } from '@/app/router/paths'
import {
  EMPTY_PROGRESS,
  fetchUserProgress,
  type UserProgressRecord,
} from '@/features/progress/api/progress-client'
import { fetchStoryDetail, type StoryDetail } from '@/features/stories/api/story-catalog'
import {
  getCompletedMissionsCount,
  isStoryCompleted,
  isStoryMissionCompleted,
} from '@/features/stories/lib/story-progress'
import { getErrorMessage } from '@/shared/lib/error-message'

type MissionAvatarProps = {
  imageUrl?: string
  name: string
}

function MissionAvatar({ imageUrl, name }: MissionAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false)
  const initial = (name.trim().charAt(0) || '?').toUpperCase()

  return (
    <span className="mission-avatar" aria-hidden={!imageUrl || hasImageError}>
      {imageUrl && !hasImageError ? (
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          onError={() => {
            setHasImageError(true)
          }}
        />
      ) : (
        <span>{initial}</span>
      )}
    </span>
  )
}

export function StoryMissionsPage() {
  const navigate = useNavigate()
  const { storyId } = useParams<{ storyId: string }>()
  const [story, setStory] = useState<StoryDetail | undefined>()
  const [progress, setProgress] = useState<UserProgressRecord>(EMPTY_PROGRESS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false

    const loadStory = async () => {
      try {
        setLoading(true)
        setError(undefined)
        const [storyResult, progressResult] = await Promise.allSettled([
          fetchStoryDetail(storyId),
          fetchUserProgress(),
        ])
        if (storyResult.status === 'rejected') {
          throw storyResult.reason
        }
        if (!cancelled) {
          setStory(storyResult.value)
          setProgress(progressResult.status === 'fulfilled' ? progressResult.value : EMPTY_PROGRESS)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, 'No pudimos cargar esta historia.'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadStory()

    return () => {
      cancelled = true
    }
  }, [storyId])

  const storySummary = useMemo(() => {
    if (!story) {
      return {
        completedCount: 0,
        totalMissions: 0,
        progressPercent: 0,
        nextIncompleteIndex: -1,
        completedStory: false,
      }
    }

    const totalMissions = story.missions.length
    const completedCount = Math.min(getCompletedMissionsCount(progress, story.storyId), totalMissions)
    const progressPercent = totalMissions ? Math.round((completedCount / totalMissions) * 100) : 0
    const nextIncompleteIndex = story.missions.findIndex(
      (mission) => !isStoryMissionCompleted(progress, story.storyId, mission.missionId),
    )

    return {
      completedCount,
      totalMissions,
      progressPercent,
      nextIncompleteIndex,
      completedStory: isStoryCompleted(progress, story.storyId),
    }
  }, [progress, story])

  if (loading) {
    return (
      <section className="stories-empty-state">
        <strong>Cargando historia…</strong>
        <p>Estamos trayendo las misiones y sincronizando el progreso actual.</p>
      </section>
    )
  }

  if (error || !story) {
    return (
      <section className="stories-empty-state">
        <strong>No encontramos esta historia.</strong>
        <p>{error || 'La historia solicitada no está disponible en el catálogo.'}</p>
        <Link to={appPaths.stories} className="btn primary">
          Volver a historias
        </Link>
      </section>
    )
  }

  return (
    <div className="stories-page">
      <section className="story-detail-hero">
        <div className="story-detail-header">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              navigate(appPaths.stories)
            }}
          >
            Volver a historias
          </button>
          <Link to={buildStoryMissionsPath(story.storyId)} className="story-link-current">
            {story.title}
          </Link>
        </div>

        <div className="story-detail-grid">
          <div>
            <p className="eyebrow">Misiones</p>
            <h1>{story.title}</h1>
            <p className="lede">{story.summary}</p>
            <div className="story-card-tags">
              {story.level ? <span className="chip">Nivel {story.level}</span> : null}
              <span className="chip">{story.missions.length} misiones</span>
              {(story.tags || []).slice(0, 3).map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="story-progress-card">
            <span>Progreso</span>
            <strong>{storySummary.progressPercent}%</strong>
            <div className="dashboard-meter-track" aria-hidden="true">
              <div className="dashboard-meter-fill" style={{ width: `${storySummary.progressPercent}%` }} />
            </div>
            <p>
              {storySummary.completedCount}/{storySummary.totalMissions} misiones completadas
            </p>
            {storySummary.completedStory ? (
              <span className="story-status-pill story-status-pill-complete">Historia completa</span>
            ) : storySummary.nextIncompleteIndex >= 0 ? (
              <Link
                to={buildStoryChatPath(story.storyId, storySummary.nextIncompleteIndex)}
                className="btn primary"
              >
                Continuar misión {storySummary.nextIncompleteIndex + 1}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mission-list">
        {story.missions.map((mission, index) => {
          const completed = isStoryMissionCompleted(progress, story.storyId, mission.missionId)
          const characterName = mission.caracterName || mission.title

          return (
            <article key={mission.missionId} className="mission-card">
              <div className="mission-card-head">
                <div className="mission-card-character">
                  <MissionAvatar imageUrl={mission.avatarImageUrl} name={characterName} />
                  <div className="mission-card-copy">
                    {mission.caracterName ? (
                      <span className="mission-character-name">{mission.caracterName}</span>
                    ) : null}
                    <h2>
                      {index + 1}. {mission.title}
                    </h2>
                    {mission.sceneSummary ? <p>{mission.sceneSummary}</p> : null}
                  </div>
                </div>
                <span
                  className={`story-status-pill${completed ? ' story-status-pill-complete' : ''}`}
                >
                  {completed ? 'Completada' : 'Pendiente'}
                </span>
              </div>

              <div className="mission-card-footer">
                <span className="chip">
                  {mission.requirements.length} {mission.requirements.length === 1 ? 'requisito' : 'requisitos'}
                </span>
                <Link to={buildStoryChatPath(story.storyId, index)} className="btn primary">
                  Abrir chat
                </Link>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
