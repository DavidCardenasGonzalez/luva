import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/shared/api/client'
import { appPaths } from '@/app/router/paths'
import {
  EMPTY_PROGRESS,
  fetchUserProgress,
  mergeUserProgress,
  type CardProgressStatus,
  type UserProgressRecord,
} from '@/features/progress/api/progress-client'
import {
  getLearningItemById,
  type LearningItemOptionKey,
} from '@/features/vocabulary/data/learning-items'
import {
  CARD_STATUS_LABELS,
  getCardStatus,
  mergeCardStatusIntoProgress,
} from '@/features/vocabulary/lib/card-progress'
import { CardStatusSwitch } from '@/features/vocabulary/ui/CardStatusSwitch'
import { getErrorMessage } from '@/shared/lib/error-message'

type EvalRes = {
  score: number
  result: 'correct' | 'partial' | 'incorrect'
  feedback: {
    grammar: string[]
    wording: string[]
    naturalness: string[]
    register: string[]
  }
  errors?: string[]
  improvements?: string[]
  suggestions?: string[]
}

type PracticeState = 'idle' | 'evaluating' | 'done'

type SessionStartResponse = {
  sessionId: string
}

export function VocabularyPracticePage() {
  const navigate = useNavigate()
  const { cardId } = useParams<{ cardId: string }>()
  const item = getLearningItemById(cardId)
  const [progress, setProgress] = useState<UserProgressRecord>(EMPTY_PROGRESS)
  const [loadingProgress, setLoadingProgress] = useState(true)
  const [pageError, setPageError] = useState<string | undefined>()
  const [submissionError, setSubmissionError] = useState<string | undefined>()
  const [selected, setSelected] = useState<LearningItemOptionKey | null>(null)
  const [draft, setDraft] = useState('')
  const [submittedAnswer, setSubmittedAnswer] = useState('')
  const [feedback, setFeedback] = useState<EvalRes | null>(null)
  const [state, setState] = useState<PracticeState>('idle')
  const [statusSaving, setStatusSaving] = useState<CardProgressStatus | null>(null)

  const loadProgress = useCallback(async () => {
    try {
      setLoadingProgress(true)
      setPageError(undefined)
      const next = await fetchUserProgress()
      setProgress(next)
    } catch (loadError) {
      setPageError(getErrorMessage(loadError, 'No pudimos cargar el progreso de esta card.'))
    } finally {
      setLoadingProgress(false)
    }
  }, [])

  useEffect(() => {
    void loadProgress()
  }, [loadProgress])

  useEffect(() => {
    setSelected(null)
    setDraft('')
    setSubmittedAnswer('')
    setFeedback(null)
    setSubmissionError(undefined)
    setState('idle')
    setStatusSaving(null)
  }, [cardId])

  const currentStatus = item ? getCardStatus(progress, item.id) : 'todo'
  const definitionIsCorrect = item && selected ? selected === item.answer : false
  const canSubmit = Boolean(item && selected && draft.trim()) && state !== 'evaluating'
  const errorsList = useMemo(() => {
    if (!feedback) {
      return [] as string[]
    }

    const nextErrors =
      feedback.errors && feedback.errors.length ? feedback.errors : feedback.feedback.grammar
    return nextErrors.filter((entry) => entry.trim().length > 0)
  }, [feedback])
  const improvementsList = useMemo(() => {
    if (!feedback) {
      return [] as string[]
    }

    const nextImprovements =
      feedback.improvements && feedback.improvements.length
        ? feedback.improvements
        : feedback.suggestions || []
    return nextImprovements.filter((entry) => entry.trim().length > 0)
  }, [feedback])

  const handleSetCardStatus = useCallback(
    async (nextStatus: CardProgressStatus) => {
      if (!item || currentStatus === nextStatus) {
        return
      }

      const updatedAt = new Date().toISOString()
      setStatusSaving(nextStatus)
      setPageError(undefined)
      setProgress((current) => mergeCardStatusIntoProgress(current, item.id, nextStatus, updatedAt))

      try {
        const remoteProgress = await mergeUserProgress({
          cards: {
            updatedAt,
            items: {
              [String(item.id)]: {
                status: nextStatus,
                updatedAt,
              },
            },
          },
        })
        setProgress(remoteProgress)
      } catch (saveError) {
        setPageError(getErrorMessage(saveError, 'No pudimos actualizar el estado de la card.'))
        void loadProgress()
      } finally {
        setStatusSaving(null)
      }
    },
    [currentStatus, item, loadProgress],
  )

  if (!item) {
    return (
      <section className="vocab-empty-state">
        <strong>No encontramos esta práctica.</strong>
        <p>La card que intentaste abrir no existe en el catálogo actual.</p>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            navigate(appPaths.vocabulary)
          }}
        >
          Volver al deck
        </button>
      </section>
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selected || !draft.trim()) {
      return
    }

    setSubmissionError(undefined)
    setState('evaluating')

    try {
      const started = await api.post<SessionStartResponse>('/sessions/start', {
        cardId: String(item.id),
      })

      const response = await api.post<EvalRes>(`/sessions/${started.sessionId}/evaluate`, {
        transcript: draft.trim(),
        label: item.label,
        example: item.examples[0],
      })

      setSubmittedAnswer(draft.trim())
      setFeedback(response)
      setState('done')

      const combinedResult =
        selected === item.answer && response.result === 'correct' ? 'correct' : 'incorrect'

      void api
        .post(`/cards/${item.id}/complete`, {
          result: combinedResult,
          score: response.score,
        })
        .catch((syncError) => {
          console.warn('[VocabularyPracticePage] No se pudo sincronizar completion', syncError)
        })
    } catch (submitError) {
      setSubmissionError(getErrorMessage(submitError, 'No pudimos evaluar tu respuesta.'))
      setState('idle')
    }
  }

  return (
    <div className="vocab-page">
      <section className="practice-header-card">
        <div className="practice-header-row">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              navigate(appPaths.vocabulary)
            }}
          >
            Volver al deck
          </button>

          <div className="practice-header-meta">
            <span className={`vocab-status-pill vocab-status-pill-${currentStatus}`}>
              {loadingProgress ? 'Cargando progreso…' : CARD_STATUS_LABELS[currentStatus]}
            </span>
            <button
              type="button"
              className="btn ghost practice-speak-button"
              onClick={() => {
                speakText([item.label, ...item.examples].join('. '))
              }}
            >
              Escuchar
            </button>
          </div>
        </div>

        <div className="practice-heading">
          <div>
            <p className="eyebrow">Práctica de vocabulario</p>
            <h1>{item.label}</h1>
            <p className="lede">Primero identifica la definición y luego úsala en una oración.</p>
          </div>
          <div className="practice-prompt-card">
            <span className="tag">Objetivo</span>
            <p>{item.prompt || `Usa "${item.label}" en una oración natural y clara.`}</p>
          </div>
        </div>
      </section>

      {pageError ? (
        <section className="dashboard-feedback dashboard-feedback-error">
          <strong>No pudimos completar una parte de la práctica.</strong>
          <p>{pageError}</p>
        </section>
      ) : null}

      <section className="practice-grid">
        <article className="practice-panel">
          <div className="practice-panel-head">
            <div>
              <p className="eyebrow">Contexto</p>
              <h2>Ejemplos y guía</h2>
            </div>
          </div>

          <div className="practice-example-list">
            {item.examples.map((example) => (
              <div key={example} className="practice-example-item">
                {example}
              </div>
            ))}
          </div>

          <div className="practice-explanation-box">
            <span className="tag">Pista</span>
            <p>{item.explanation}</p>
          </div>
        </article>

        <article className="practice-panel">
          <div className="practice-panel-head">
            <div>
              <p className="eyebrow">Paso 1</p>
              <h2>Elige la mejor definición</h2>
            </div>
          </div>

          <div className="practice-options">
            {(['a', 'b', 'c'] as LearningItemOptionKey[]).map((optionKey) => {
              const isSelected = selected === optionKey
              const isCorrectChoice = isSelected && optionKey === item.answer
              const isWrongChoice = isSelected && optionKey !== item.answer

              return (
                <button
                  key={optionKey}
                  type="button"
                  className={`practice-option${
                    isCorrectChoice
                      ? ' is-correct'
                      : isWrongChoice
                        ? ' is-wrong'
                        : isSelected
                          ? ' is-selected'
                          : ''
                  }`}
                  onClick={() => {
                    setSelected(optionKey)
                    setFeedback(null)
                    setSubmittedAnswer('')
                    setSubmissionError(undefined)
                    setState('idle')
                  }}
                >
                  <strong>{optionKey.toUpperCase()}</strong>
                  <span>{item.options[optionKey]}</span>
                </button>
              )
            })}
          </div>

          {selected ? (
            <div
              className={`practice-selection-feedback${
                definitionIsCorrect ? ' is-correct' : ' is-wrong'
              }`}
            >
              <strong>{definitionIsCorrect ? 'Definición correcta.' : 'La opción elegida no es la correcta.'}</strong>
              <p>
                {definitionIsCorrect
                  ? item.explanation
                  : 'Puedes seguir con la práctica escrita para recibir feedback, pero la sesión contará como incorrecta hasta corregir esta parte.'}
              </p>
            </div>
          ) : null}
        </article>
      </section>

      <section className="practice-panel">
        <div className="practice-panel-head">
          <div>
            <p className="eyebrow">Paso 2</p>
            <h2>Escribe tu oración</h2>
          </div>
          <span className={`practice-state-pill practice-state-pill-${state}`}>
            {state === 'evaluating' ? 'Evaluando…' : feedback ? 'Con feedback' : 'Lista'}
          </span>
        </div>

        <form className="practice-form" onSubmit={handleSubmit}>
          <label className="vocab-search-field practice-textarea-field">
            <span>
              {selected
                ? `Usa "${item.label}" en contexto.`
                : 'Selecciona primero una definición para habilitar esta parte.'}
            </span>
            <textarea
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
                if (submissionError) {
                  setSubmissionError(undefined)
                }
              }}
              placeholder={item.prompt || `Write a sentence using "${item.label}".`}
              rows={5}
              disabled={!selected || state === 'evaluating'}
            />
          </label>

          <div className="practice-form-actions">
            <button type="submit" className="btn primary" disabled={!canSubmit}>
              {state === 'evaluating' ? 'Evaluando…' : 'Evaluar respuesta'}
            </button>
          </div>
        </form>

        {submissionError ? (
          <div className="dashboard-feedback dashboard-feedback-error">
            <strong>No se pudo evaluar.</strong>
            <p>{submissionError}</p>
          </div>
        ) : null}

        {submittedAnswer ? (
          <div className="practice-submitted-answer">
            <span className="tag">Tu respuesta</span>
            <p>{submittedAnswer}</p>
          </div>
        ) : null}
      </section>

      {feedback ? (
        <section className="practice-panel">
          <div className="practice-panel-head">
            <div>
              <p className="eyebrow">Feedback</p>
              <h2>
                {feedback.result === 'correct'
                  ? 'Muy bien resuelto'
                  : feedback.result === 'partial'
                    ? 'Buen intento'
                    : 'Hay espacio para mejorar'}
              </h2>
            </div>
            <span className="tag">Puntaje {feedback.score}/100</span>
          </div>

          <div className="dashboard-meter-track" aria-hidden="true">
            <div className="dashboard-meter-fill" style={{ width: `${feedback.score}%` }} />
          </div>

          <div className="practice-feedback-grid">
            <div className="practice-feedback-box">
              <strong>Aspectos a mejorar</strong>
              {errorsList.length ? (
                <ul>
                  {errorsList.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              ) : (
                <p>No encontramos errores importantes en gramática.</p>
              )}
            </div>

            <div className="practice-feedback-box">
              <strong>Reformulaciones sugeridas</strong>
              {improvementsList.length ? (
                <ul>
                  {improvementsList.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              ) : (
                <p>No hubo reformulaciones adicionales para esta respuesta.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {definitionIsCorrect && feedback?.result === 'correct' ? (
        <section className="practice-panel practice-progress-panel">
          <div className="practice-panel-head">
            <div>
              <p className="eyebrow">Progreso</p>
              <h2>Actualiza el estado de esta card</h2>
            </div>
          </div>

          <p className="muted">
            Igual que en el app, aquí decides si quieres seguir reforzándola o marcarla como
            aprendida.
          </p>

          <CardStatusSwitch
            value={currentStatus}
            allowedStatuses={['learning', 'learned']}
            onChange={(nextStatus) => {
              void handleSetCardStatus(nextStatus)
            }}
            disabled={statusSaving !== null}
            pendingStatus={statusSaving}
          />
        </section>
      ) : null}
    </div>
  )
}

function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.95
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
