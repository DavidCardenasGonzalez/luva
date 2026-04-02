import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { getDisplayName } from '@/features/auth/model/get-display-name'
import { useAuthSession } from '@/features/auth/model/use-auth-session'
import {
  fetchDashboardData,
  type CardProgressStatus,
  type StoryCatalogItem,
  type StoryProgressDocument,
  type StoryProgressItem,
  type UserProgressRecord,
} from '@/features/progress/api/progress-client'
import { CARD_STATUS_LABELS } from '@/features/vocabulary/lib/card-progress'
import { getErrorMessage } from '@/shared/lib/error-message'

type DashboardState = {
  progress: UserProgressRecord
  totalCards: number
  stories: StoryCatalogItem[]
}

type ActivityItem = {
  key: string
  label: string
  detail: string
  at: string
}

const EMPTY_DASHBOARD: DashboardState = {
  progress: {
    cards: { updatedAt: '1970-01-01T00:00:00.000Z', items: {} },
    stories: { updatedAt: '1970-01-01T00:00:00.000Z', items: {} },
  },
  totalCards: 0,
  stories: [],
}

export function DashboardHomePage() {
  const { auth } = useAuthSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [dashboard, setDashboard] = useState<DashboardState>(EMPTY_DASHBOARD)

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError(undefined)
        const next = await fetchDashboardData()
        if (!cancelled) {
          setDashboard(next)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, 'No pudimos cargar tu dashboard.'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const dashboardSummary = useMemo(() => {
    const { progress, totalCards, stories } = dashboard
    const statusCounts: Record<CardProgressStatus, number> = { todo: 0, learning: 0, learned: 0 }

    for (const entry of Object.values(progress.cards.items || {})) {
      if (entry.status === 'learned') {
        statusCounts.learned += 1
      } else if (entry.status === 'learning') {
        statusCounts.learning += 1
      }
    }
    statusCounts.todo = Math.max(totalCards - statusCounts.learned - statusCounts.learning, 0)

    const storyRows = stories.map((story) => {
      const item = normalizeStoryItem(progress.stories, story.storyId)
      const completedMissions = Math.min(
        story.missionsCount,
        Object.keys(item?.completedMissions || {}).length,
      )
      const percent = story.missionsCount
        ? Math.round((completedMissions / story.missionsCount) * 100)
        : 0

      return {
        storyId: story.storyId,
        title: story.title,
        summary: story.summary,
        level: story.level,
        tags: story.tags,
        missionsCount: story.missionsCount,
        completedMissions,
        percent,
        updatedAt: item?.updatedAt,
        storyCompletedAt: item?.storyCompletedAt,
      }
    })

    const totalStories = stories.length
    const totalMissions = storyRows.reduce((sum, story) => sum + story.missionsCount, 0)
    const learnedCards = statusCounts.learned
    const activeCards = statusCounts.learning
    const completedMissions = storyRows.reduce((sum, story) => sum + story.completedMissions, 0)
    const completedStories = storyRows.filter((story) => story.storyCompletedAt).length
    const startedStories = storyRows.filter((story) => story.completedMissions > 0).length
    const totalWeighted = totalCards + totalMissions * 2
    const completedWeighted = learnedCards + completedMissions * 2
    const overallPercent = totalWeighted ? Math.round((completedWeighted / totalWeighted) * 100) : 0
    const lastSyncedAt = maxTimestamp(progress.cards.updatedAt, progress.stories.updatedAt)

    return {
      statusCounts,
      storyRows,
      totals: {
        totalCards,
        totalStories,
        totalMissions,
        learnedCards,
        activeCards,
        completedMissions,
        completedStories,
        startedStories,
        overallPercent,
        lastSyncedAt,
      },
      activity: buildRecentActivity(progress, storyRows),
    }
  }, [dashboard])

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero-card">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Dashboard Luva</p>
          <h1>{getDisplayName(auth.user)}</h1>
          <p className="lede">
            La web ya comparte progreso con el app y desde aquí puedes empezar con el primer módulo
            migrado: vocabulario.
          </p>

          <div className="dashboard-account-row">
            <div className="dashboard-account-pill">
              <span className="tag">Cuenta</span>
              <strong>{auth.user?.email || 'Usuario autenticado'}</strong>
            </div>
            <div className="dashboard-account-pill">
              <span className="tag">Método</span>
              <strong>{auth.user?.lastAuthProvider || 'email'}</strong>
            </div>
            <div className="dashboard-account-pill">
              <span className="tag">Última sync</span>
              <strong>{formatDateTime(dashboardSummary.totals.lastSyncedAt)}</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-hero-meter">
          <span>Progreso global</span>
          <strong>{dashboardSummary.totals.overallPercent}%</strong>
          <div className="dashboard-meter-track" aria-hidden="true">
            <div
              className="dashboard-meter-fill"
              style={{ width: `${dashboardSummary.totals.overallPercent}%` }}
            />
          </div>
          <p>
            {dashboardSummary.totals.learnedCards} cards aprendidas y{' '}
            {dashboardSummary.totals.completedMissions} misiones completadas.
          </p>
          <Link to={appPaths.vocabulary} className="btn primary dashboard-inline-action">
            Abrir vocabulario web
          </Link>
        </div>
      </section>

      {error ? (
        <section className="dashboard-feedback dashboard-feedback-error">
          <strong>No pudimos cargar tu progreso.</strong>
          <p>{error}</p>
        </section>
      ) : null}

      <section className="dashboard-stats-grid">
        <article className="dashboard-stat-card">
          <span className="tag">Cards</span>
          <strong>{dashboardSummary.totals.learnedCards}</strong>
          <p>
            de {dashboardSummary.totals.totalCards} aprendidas
            {dashboardSummary.totals.activeCards
              ? `, ${dashboardSummary.totals.activeCards} en aprendizaje`
              : ''}
          </p>
        </article>

        <article className="dashboard-stat-card">
          <span className="tag">Historias</span>
          <strong>{dashboardSummary.totals.completedStories}</strong>
          <p>
            de {dashboardSummary.totals.totalStories} cerradas
            {dashboardSummary.totals.startedStories
              ? `, ${dashboardSummary.totals.startedStories} con actividad`
              : ''}
          </p>
        </article>

        <article className="dashboard-stat-card">
          <span className="tag">Misiones</span>
          <strong>{dashboardSummary.totals.completedMissions}</strong>
          <p>de {dashboardSummary.totals.totalMissions} completadas</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="eyebrow">Cards</p>
              <h2>Estado del deck</h2>
            </div>
          </div>

          <div className="dashboard-card-status-grid">
            {(['learned', 'learning', 'todo'] as CardProgressStatus[]).map((status) => {
              const count = dashboardSummary.statusCounts[status]
              const total = dashboardSummary.totals.totalCards
              const percent = total ? Math.round((count / total) * 100) : 0

              return (
                <div key={status} className={`dashboard-card-status dashboard-card-status-${status}`}>
                  <span>{CARD_STATUS_LABELS[status]}</span>
                  <strong>{count}</strong>
                  <p>{percent}% del deck</p>
                </div>
              )
            })}
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="eyebrow">Actividad</p>
              <h2>Últimos movimientos</h2>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-empty-state">
              <strong>Cargando progreso…</strong>
              <p>Estamos armando tu resumen con la última información sincronizada.</p>
            </div>
          ) : dashboardSummary.activity.length ? (
            <div className="dashboard-activity-list">
              {dashboardSummary.activity.map((item) => (
                <div key={item.key} className="dashboard-activity-item">
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <time>{formatDateTime(item.at)}</time>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <strong>Aún no hay actividad sincronizada.</strong>
              <p>En cuanto cambies una card o completes una misión, aparecerá aquí.</p>
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel-head">
          <div>
            <p className="eyebrow">Historias</p>
            <h2>Avance por story</h2>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-empty-state">
            <strong>Cargando historias…</strong>
            <p>Estamos calculando misiones completadas y porcentaje por story.</p>
          </div>
        ) : dashboardSummary.storyRows.length ? (
          <div className="dashboard-story-list">
            {dashboardSummary.storyRows.map((story) => (
              <article key={story.storyId} className="dashboard-story-card">
                <div className="dashboard-story-head">
                  <div>
                    <h3>{story.title}</h3>
                    <p>{story.summary}</p>
                  </div>
                  <div className="dashboard-story-meta">
                    {story.level ? <span className="chip">{story.level}</span> : null}
                    <span className="chip">
                      {story.completedMissions}/{story.missionsCount} misiones
                    </span>
                  </div>
                </div>

                <div className="dashboard-meter-track" aria-hidden="true">
                  <div className="dashboard-meter-fill" style={{ width: `${story.percent}%` }} />
                </div>

                <div className="dashboard-story-footer">
                  <span>{story.percent}% completado</span>
                  <span>
                    {story.storyCompletedAt
                      ? `Cerrada ${formatDateTime(story.storyCompletedAt)}`
                      : story.updatedAt
                        ? `Último avance ${formatDateTime(story.updatedAt)}`
                        : 'Sin avance todavía'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty-state">
            <strong>No encontramos stories en el catálogo.</strong>
            <p>Verifica que el backend público esté respondiendo `/stories`.</p>
          </div>
        )}
      </section>
    </div>
  )
}

function normalizeStoryItem(progress: StoryProgressDocument, storyId: string): StoryProgressItem | undefined {
  const item = progress.items[storyId]
  if (!item) {
    return undefined
  }

  if (item.deletedAt && compareTimestamps(item.deletedAt, item.updatedAt) >= 0) {
    return undefined
  }

  const completedMissions = Object.fromEntries(
    Object.entries(item.completedMissions || {}).filter(([, completedAt]) => {
      if (progress.resetAt && compareTimestamps(completedAt, progress.resetAt) <= 0) {
        return false
      }
      if (item.deletedAt && compareTimestamps(completedAt, item.deletedAt) <= 0) {
        return false
      }
      return true
    }),
  )

  const storyCompletedAt =
    item.storyCompletedAt &&
    (!progress.resetAt || compareTimestamps(item.storyCompletedAt, progress.resetAt) > 0) &&
    (!item.deletedAt || compareTimestamps(item.storyCompletedAt, item.deletedAt) > 0)
      ? item.storyCompletedAt
      : undefined

  if (!storyCompletedAt && !Object.keys(completedMissions).length) {
    return undefined
  }

  return {
    ...item,
    ...(storyCompletedAt ? { storyCompletedAt } : {}),
    completedMissions,
  }
}

function buildRecentActivity(
  progress: UserProgressRecord,
  stories: Array<{
    storyId: string
    title: string
    completedMissions: number
    missionsCount: number
    updatedAt?: string
    storyCompletedAt?: string
  }>,
): ActivityItem[] {
  const activity: ActivityItem[] = []

  for (const [cardId, entry] of Object.entries(progress.cards.items || {})) {
    activity.push({
      key: `card-${cardId}`,
      label: `Card ${cardId}`,
      detail: `Estado actual: ${CARD_STATUS_LABELS[entry.status]}.`,
      at: entry.updatedAt,
    })
  }

  for (const story of stories) {
    const at = story.storyCompletedAt || story.updatedAt
    if (!at) {
      continue
    }
    activity.push({
      key: `story-${story.storyId}`,
      label: story.title,
      detail: story.storyCompletedAt
        ? 'Story completada.'
        : `${story.completedMissions}/${story.missionsCount} misiones completadas.`,
      at,
    })
  }

  return activity
    .sort((left, right) => compareTimestamps(right.at, left.at))
    .slice(0, 6)
}

function formatDateTime(value?: string) {
  if (!value || value === '1970-01-01T00:00:00.000Z') {
    return 'Sin registro'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Sin registro'
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function maxTimestamp(...values: Array<string | undefined>) {
  let next = '1970-01-01T00:00:00.000Z'
  for (const value of values) {
    if (value && compareTimestamps(value, next) > 0) {
      next = value
    }
  }
  return next
}

function compareTimestamps(left?: string, right?: string) {
  return (left || '').localeCompare(right || '')
}
