import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EMPTY_PROGRESS,
  fetchUserProgress,
  mergeUserProgress,
  type CardProgressStatus,
  type UserProgressRecord,
} from '@/features/progress/api/progress-client'
import { buildVocabularyPracticePath } from '@/app/router/paths'
import { learningItems } from '@/features/vocabulary/data/learning-items'
import {
  buildCardStatusCounts,
  buildCardStatusPercentages,
  CARD_STATUS_LABELS,
  getCardStatus,
  mergeCardStatusIntoProgress,
  STATUS_ORDER,
} from '@/features/vocabulary/lib/card-progress'
import { CardStatusSwitch } from '@/features/vocabulary/ui/CardStatusSwitch'
import { getErrorMessage } from '@/shared/lib/error-message'

export function VocabularyDeckPage() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState<UserProgressRecord>(EMPTY_PROGRESS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [activeStatuses, setActiveStatuses] = useState<CardProgressStatus[]>(['todo'])
  const [savingCardId, setSavingCardId] = useState<string | null>(null)

  const loadProgress = useCallback(async () => {
    try {
      setLoading(true)
      setError(undefined)
      const next = await fetchUserProgress()
      setProgress(next)
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'No pudimos cargar tu progreso de vocabulario.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProgress()
  }, [loadProgress])

  const deckSummary = useMemo(() => {
    const counts = buildCardStatusCounts(progress, learningItems.length)
    const percentages = buildCardStatusPercentages(counts, learningItems.length)
    const activeSet = new Set(activeStatuses)

    const items = learningItems
      .map((item) => ({
        ...item,
        status: getCardStatus(progress, item.id),
      }))
      .filter((item) => activeSet.has(item.status))
      .sort((left, right) => {
        const statusDelta = STATUS_ORDER.indexOf(left.status) - STATUS_ORDER.indexOf(right.status)
        if (statusDelta !== 0) {
          return statusDelta
        }

        return left.id - right.id
      })

    return {
      counts,
      percentages,
      items,
    }
  }, [activeStatuses, progress])

  const toggleStatusFilter = (status: CardProgressStatus) => {
    setActiveStatuses((current) => {
      if (current.includes(status)) {
        if (current.length === 1) {
          return current
        }
        return current.filter((item) => item !== status)
      }

      return [...current, status]
    })
  }

  const handleSetCardStatus = useCallback(
    async (cardId: number, nextStatus: CardProgressStatus) => {
      const currentStatus = getCardStatus(progress, cardId)
      if (currentStatus === nextStatus) {
        return
      }

      const updatedAt = new Date().toISOString()
      setSavingCardId(String(cardId))
      setError(undefined)
      setProgress((current) => mergeCardStatusIntoProgress(current, cardId, nextStatus, updatedAt))

      try {
        const remoteProgress = await mergeUserProgress({
          cards: {
            updatedAt,
            items: {
              [String(cardId)]: {
                status: nextStatus,
                updatedAt,
              },
            },
          },
        })
        setProgress(remoteProgress)
      } catch (saveError) {
        setError(getErrorMessage(saveError, 'No pudimos guardar el cambio de estado.'))
        void loadProgress()
      } finally {
        setSavingCardId(null)
      }
    },
    [loadProgress, progress],
  )

  return (
    <div className="vocab-page">
      <section className="vocab-hero-card">
        <div className="vocab-hero-copy">
          <p className="eyebrow">Vocabulario</p>
          <h1>Deck de práctica web</h1>
          <div className="vocab-hero-filters">
            {STATUS_ORDER.map((status) => {
              const isActive = activeStatuses.includes(status)
              return (
                <button
                  key={status}
                  type="button"
                  className={`vocab-filter-chip vocab-filter-chip-${status}${
                    isActive ? ' is-active' : ''
                  }`}
                  onClick={() => {
                    toggleStatusFilter(status)
                  }}
                >
                  {CARD_STATUS_LABELS[status]} · {deckSummary.counts[status]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="vocab-hero-meter">
          <span>Aprendidas</span>
          <strong>{deckSummary.percentages.learned}%</strong>
          <div className="dashboard-meter-track" aria-hidden="true">
            <div
              className="dashboard-meter-fill"
              style={{ width: `${deckSummary.percentages.learned}%` }}
            />
          </div>
          <p>
            {deckSummary.counts.learned} de {learningItems.length} cards marcadas como aprendidas.
          </p>
          {/* <span className="chip vocab-hero-total">
            {deckSummary.items.length}/{learningItems.length} visibles
          </span> */}
        </div>
      </section>

      {error ? (
        <section className="dashboard-feedback dashboard-feedback-error">
          <strong>Hay un problema con el deck.</strong>
          <p>{error}</p>
        </section>
      ) : null}

      <section className="vocab-card-grid">
        {loading ? (
          <article className="vocab-empty-state">
            <strong>Cargando deck…</strong>
            <p>Estamos trayendo tu progreso sincronizado para mostrar el estado real de cada card.</p>
          </article>
        ) : deckSummary.items.length ? (
          deckSummary.items.map((item) => {
            const savingThisCard = savingCardId === String(item.id)

            return (
              <article key={item.id} className="vocab-card">
                <div className="vocab-card-head">
                  <div>
                    <span className={`vocab-status-pill vocab-status-pill-${item.status}`}>
                      {CARD_STATUS_LABELS[item.status]}
                    </span>
                    <h3>{item.label}</h3>
                  </div>

                  <button
                    type="button"
                    className="btn primary vocab-open-button"
                    onClick={() => {
                      navigate(buildVocabularyPracticePath(item.id))
                    }}
                  >
                    Practicar
                  </button>
                </div>

                <p className="vocab-card-example">{item.examples[0]}</p>

                <div className="vocab-card-footer">
                  <CardStatusSwitch
                    value={item.status}
                    onChange={(status) => {
                      void handleSetCardStatus(item.id, status)
                    }}
                    disabled={savingThisCard}
                    pendingStatus={savingThisCard ? item.status : null}
                  />
                </div>
              </article>
            )
          })
        ) : (
          <article className="vocab-empty-state">
            <strong>No encontramos cards con esos filtros.</strong>
            <p>Ajusta la búsqueda o vuelve a activar algún estado del deck.</p>
          </article>
        )}
      </section>
    </div>
  )
}
