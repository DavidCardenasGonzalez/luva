import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { appPaths, buildStoryChatPath, buildStoryMissionsPath } from '@/app/router/paths'
import { api } from '@/shared/api/client'
import {
  EMPTY_PROGRESS,
  fetchUserProgress,
  mergeUserProgress,
  type UserProgressRecord,
} from '@/features/progress/api/progress-client'
import {
  fetchStoryDetail,
  type StoryDetail,
  type StoryRequirementState,
} from '@/features/stories/api/story-catalog'
import {
  isStoryCompleted as isStoryCompletedInProgress,
  isStoryMissionCompleted,
  mergeStoryMissionCompletionIntoProgress,
} from '@/features/stories/lib/story-progress'
import { getErrorMessage } from '@/shared/lib/error-message'
import luviImage from '../../../../../app/src/image/luvi.png'

type StoryMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

type StoryAdvancePayload = {
  sceneIndex: number
  missionCompleted: boolean
  storyCompleted: boolean
  requirements: StoryRequirementState[]
  aiReply: string
  correctness: number
  result: 'correct' | 'partial' | 'incorrect'
  errors: string[]
  reformulations: string[]
  conversationFeedback?: {
    summary: string
    improvements: string[]
  } | null
}

type StoryAssistanceResponse = {
  answer: string
}

type StoryAttemptSnapshot = {
  messages: StoryMessage[]
  requirements: StoryRequirementState[]
  analysis: {
    correctness: number
    result: 'correct' | 'partial' | 'incorrect'
    errors: string[]
    reformulations: string[]
  } | null
  missionCompleted: boolean
  storyCompleted: boolean
  pendingNext: number | null
  conversationFeedback: {
    summary: string
    improvements: string[]
  } | null
}

type SessionStartResponse = {
  sessionId: string
}

export function StoryChatPage() {
  const navigate = useNavigate()
  const { storyId, sceneIndex } = useParams<{ storyId: string; sceneIndex: string }>()
  const numericSceneIndex = Number.isFinite(Number(sceneIndex)) ? Math.max(0, Number(sceneIndex)) : 0
  const [story, setStory] = useState<StoryDetail | undefined>()
  const [progress, setProgress] = useState<UserProgressRecord>(EMPTY_PROGRESS)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | undefined>()
  const [messages, setMessages] = useState<StoryMessage[]>([])
  const [requirements, setRequirements] = useState<StoryRequirementState[]>([])
  const [analysis, setAnalysis] = useState<StoryAttemptSnapshot['analysis']>(null)
  const [missionCompleted, setMissionCompleted] = useState(false)
  const [storyCompleted, setStoryCompleted] = useState(false)
  const [pendingNext, setPendingNext] = useState<number | null>(null)
  const [conversationFeedback, setConversationFeedback] =
    useState<StoryAttemptSnapshot['conversationFeedback']>(null)
  const [retryState, setRetryState] = useState<'none' | 'optional' | 'required'>('none')
  const [lastAttemptSnapshot, setLastAttemptSnapshot] = useState<StoryAttemptSnapshot | null>(null)
  const [draft, setDraft] = useState('')
  const [flowState, setFlowState] = useState<'idle' | 'evaluating'>('idle')
  const [chatError, setChatError] = useState<string | null>(null)
  const [showAssistanceModal, setShowAssistanceModal] = useState(false)
  const [assistanceQuestion, setAssistanceQuestion] = useState('')
  const [assistanceAnswer, setAssistanceAnswer] = useState('')
  const [assistanceLoading, setAssistanceLoading] = useState(false)
  const [assistanceError, setAssistanceError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadStoryChat = async () => {
      try {
        setLoading(true)
        setPageError(undefined)
        const [storyResult, progressResult] = await Promise.allSettled([
          fetchStoryDetail(storyId),
          fetchUserProgress(),
        ])
        if (cancelled) {
          return
        }
        if (storyResult.status === 'rejected') {
          throw storyResult.reason
        }

        setStory(storyResult.value)
        setProgress(progressResult.status === 'fulfilled' ? progressResult.value : EMPTY_PROGRESS)
      } catch (loadError) {
        if (!cancelled) {
          setPageError(getErrorMessage(loadError, 'No pudimos cargar esta misión.'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadStoryChat()

    return () => {
      cancelled = true
    }
  }, [storyId])

  const mission = story?.missions?.[numericSceneIndex]

  useEffect(() => {
    if (!mission || !storyId) {
      setRequirements([])
      setMessages([])
      setAnalysis(null)
      setMissionCompleted(false)
      setStoryCompleted(false)
      setPendingNext(null)
      setConversationFeedback(null)
      setRetryState('none')
      setLastAttemptSnapshot(null)
      setDraft('')
      setChatError(null)
      return
    }

    setRequirements(mission.requirements.map((requirement) => ({ ...requirement, met: false })))
    setMessages([])
    setAnalysis(null)
    setMissionCompleted(isStoryMissionCompleted(progress, storyId, mission.missionId))
    setStoryCompleted(isStoryCompletedInProgress(progress, storyId))
    setPendingNext(null)
    setConversationFeedback(null)
    setRetryState('none')
    setLastAttemptSnapshot(null)
    setDraft('')
    setChatError(null)
    setAssistanceQuestion('')
    setAssistanceAnswer('')
    setAssistanceError(null)
    setShowAssistanceModal(false)
  }, [mission?.missionId, numericSceneIndex, storyId])

  useEffect(() => {
    if (!mission || !storyId || messages.length > 0) {
      return
    }

    setMissionCompleted(isStoryMissionCompleted(progress, storyId, mission.missionId))
    setStoryCompleted(isStoryCompletedInProgress(progress, storyId))
  }, [messages.length, mission, progress, storyId])

  const appendMessage = useCallback((message: StoryMessage) => {
    setMessages((current) => [...current, message])
  }, [])

  const storyDefinitionPayload = useMemo(() => {
    if (!story) {
      return undefined
    }

    return {
      storyId: story.storyId,
      title: story.title,
      summary: story.summary,
      level: story.level,
      missions: story.missions.map((item) => ({
        missionId: item.missionId,
        title: item.title,
        sceneSummary: item.sceneSummary,
        aiRole: item.aiRole,
        avatarImageUrl: item.avatarImageUrl,
        requirements: item.requirements.map((requirement) => ({
          requirementId: requirement.requirementId,
          text: requirement.text,
        })),
      })),
    }
  }, [story])

  const missionDefinitionPayload = useMemo(() => {
    if (!mission) {
      return undefined
    }

    return {
      missionId: mission.missionId,
      title: mission.title,
      sceneSummary: mission.sceneSummary,
      aiRole: mission.aiRole,
      avatarImageUrl: mission.avatarImageUrl,
      requirements: mission.requirements.map((requirement) => ({
        requirementId: requirement.requirementId,
        text: requirement.text,
      })),
    }
  }, [mission])

  const handleAdvance = useCallback(
    async (transcript: string, sessionId: string) => {
      if (!storyId || !mission) {
        return
      }

      const trimmed = transcript.trim()
      if (!trimmed) {
        setChatError('Escribe un mensaje antes de continuar.')
        setFlowState('idle')
        return
      }

      if (retryState === 'required') {
        setChatError('Debes volver a intentar antes de continuar.')
        setFlowState('idle')
        return
      }

      const snapshot: StoryAttemptSnapshot = {
        messages: messages.map((message) => ({ ...message })),
        requirements: requirements.map((requirement) => ({ ...requirement })),
        analysis: analysis
          ? {
              correctness: analysis.correctness,
              result: analysis.result,
              errors: [...analysis.errors],
              reformulations: [...analysis.reformulations],
            }
          : null,
        missionCompleted,
        storyCompleted,
        pendingNext,
        conversationFeedback: conversationFeedback
          ? {
              summary: conversationFeedback.summary,
              improvements: [...conversationFeedback.improvements],
            }
          : null,
      }

      const userMessage: StoryMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmed,
      }

      setChatError(null)
      setFlowState('evaluating')
      setRetryState('none')
      appendMessage(userMessage)

      try {
        const history = [...messages, userMessage].map(({ role, text }) => ({
          role,
          content: text,
        }))
        const persistedRequirements = requirements.map((requirement) => ({
          requirementId: requirement.requirementId,
          met: Boolean(requirement.met),
          feedback: requirement.feedback,
        }))

        const payload = await api.post<StoryAdvancePayload>(`/stories/${storyId}/advance`, {
          sessionId,
          sceneIndex: numericSceneIndex,
          transcript: trimmed,
          history,
          persistedRequirements,
          persistedMissionCompleted: missionCompleted,
        })

        setRequirements((current) => {
          const previousById = new Map(current.map((requirement) => [requirement.requirementId, requirement]))
          return payload.requirements.map((requirement) => {
            const previousRequirement = previousById.get(requirement.requirementId)
            if (previousRequirement?.met) {
              return {
                ...requirement,
                met: true,
                feedback: requirement.feedback || previousRequirement.feedback,
              }
            }
            return { ...requirement }
          })
        })
        appendMessage({
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: payload.aiReply,
        })
        setAnalysis({
          correctness: payload.correctness,
          result: payload.result,
          errors: payload.errors || [],
          reformulations: payload.reformulations || [],
        })
        setMissionCompleted((current) => current || payload.missionCompleted)
        setStoryCompleted((current) => current || payload.storyCompleted)
        setConversationFeedback(payload.conversationFeedback ?? null)

        if (payload.missionCompleted) {
          const completedAt = new Date().toISOString()
          setProgress((current) =>
            mergeStoryMissionCompletionIntoProgress(
              current,
              storyId,
              mission.missionId,
              payload.storyCompleted,
              completedAt,
            ),
          )
          void mergeUserProgress({
            stories: {
              updatedAt: completedAt,
              items: {
                [storyId]: {
                  updatedAt: completedAt,
                  completedMissions: {
                    [mission.missionId]: completedAt,
                  },
                  ...(payload.storyCompleted ? { storyCompletedAt: completedAt } : {}),
                },
              },
            },
          }).catch((syncError) => {
            console.warn('[StoryChatPage] No se pudo sincronizar el progreso', syncError)
          })
        }

        if (payload.missionCompleted && payload.sceneIndex !== numericSceneIndex) {
          setPendingNext(payload.sceneIndex)
        } else {
          setPendingNext(null)
        }

        if (payload.result === 'incorrect') {
          setRetryState('required')
          setLastAttemptSnapshot(snapshot)
        } else if (payload.result === 'partial') {
          setRetryState('optional')
          setLastAttemptSnapshot(snapshot)
        } else {
          setRetryState('none')
          setLastAttemptSnapshot(null)
        }
      } catch (advanceError) {
        setChatError(getErrorMessage(advanceError, 'No pudimos analizar tu respuesta.'))
      } finally {
        setFlowState('idle')
      }
    },
    [
      analysis,
      appendMessage,
      conversationFeedback,
      messages,
      mission,
      missionCompleted,
      numericSceneIndex,
      pendingNext,
      requirements,
      retryState,
      storyCompleted,
      storyId,
    ],
  )

  const handleSendText = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || !storyId) {
      return
    }

    setDraft('')

    try {
      const session = await api.post<SessionStartResponse>('/sessions/start', {
        storyId,
        sceneIndex: numericSceneIndex,
      })
      await handleAdvance(trimmed, session.sessionId)
    } catch (sendError) {
      setDraft(trimmed)
      setChatError(getErrorMessage(sendError, 'No pudimos preparar la evaluación del mensaje.'))
      setFlowState('idle')
    }
  }

  const handleRetry = () => {
    if (!lastAttemptSnapshot) {
      return
    }

    setMessages(lastAttemptSnapshot.messages.map((message) => ({ ...message })))
    setRequirements(lastAttemptSnapshot.requirements.map((requirement) => ({ ...requirement })))
    setAnalysis(
      lastAttemptSnapshot.analysis
        ? {
            correctness: lastAttemptSnapshot.analysis.correctness,
            result: lastAttemptSnapshot.analysis.result,
            errors: [...lastAttemptSnapshot.analysis.errors],
            reformulations: [...lastAttemptSnapshot.analysis.reformulations],
          }
        : null,
    )
    setMissionCompleted(lastAttemptSnapshot.missionCompleted)
    setStoryCompleted(lastAttemptSnapshot.storyCompleted)
    setPendingNext(lastAttemptSnapshot.pendingNext)
    setConversationFeedback(
      lastAttemptSnapshot.conversationFeedback
        ? {
            summary: lastAttemptSnapshot.conversationFeedback.summary,
            improvements: [...lastAttemptSnapshot.conversationFeedback.improvements],
          }
        : null,
    )
    setLastAttemptSnapshot(null)
    setRetryState('none')
    setChatError(null)
  }

  const handleOpenAssistance = (prefill?: string) => {
    setAssistanceQuestion(prefill || '')
    setAssistanceAnswer('')
    setAssistanceError(null)
    setShowAssistanceModal(true)
  }

  const handleRequestAssistance = async () => {
    const trimmed = assistanceQuestion.trim()
    if (!trimmed || !storyId || !mission) {
      setAssistanceError('Escribe una pregunta para pedir ayuda.')
      return
    }

    setAssistanceLoading(true)
    setAssistanceError(null)
    setAssistanceAnswer('')

    try {
      const payload = await api.post<StoryAssistanceResponse>(`/stories/${storyId}/assist`, {
        sceneIndex: numericSceneIndex,
        question: trimmed,
        history: messages.map(({ role, text }) => ({ role, content: text })),
        requirements: requirements.map((requirement) => ({
          requirementId: requirement.requirementId,
          text: requirement.text,
          met: Boolean(requirement.met),
          feedback: requirement.feedback,
        })),
        storyDefinition: storyDefinitionPayload,
        missionDefinition: missionDefinitionPayload,
        conversationFeedback,
      })
      setAssistanceAnswer(payload.answer || '')
    } catch (assistError) {
      setAssistanceError(getErrorMessage(assistError, 'No pudimos obtener la asistencia.'))
    } finally {
      setAssistanceLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="stories-empty-state">
        <strong>Cargando misión…</strong>
        <p>Estamos trayendo la misión y el estado actual de la conversación.</p>
      </section>
    )
  }

  if (pageError || !storyId || !story || !mission) {
    return (
      <section className="stories-empty-state">
        <strong>No encontramos esta misión.</strong>
        <p>{pageError || 'La misión solicitada no existe dentro de esta historia.'}</p>
        <Link to={storyId ? buildStoryMissionsPath(storyId) : appPaths.stories} className="btn primary">
          Volver
        </Link>
      </section>
    )
  }

  const characterName = mission.caracterName || mission.title || 'Personaje'
  const characterInitial = (characterName.trim().charAt(0) || '?').toUpperCase()

  return (
    <div className="stories-page story-chat-page">
      <section className="chat-topbar">
        <div className="chat-topbar-left">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              navigate(buildStoryMissionsPath(story.storyId))
            }}
          >
            Volver a misiones
          </button>

          <button
            type="button"
            className="chat-character-button"
            onClick={() => {
              handleOpenAssistance(`Puedes resumirme el contexto de esta misión: "${mission.title}"`)
            }}
          >
            <span className="chat-character-avatar">
              {mission.avatarImageUrl ? (
                <img src={mission.avatarImageUrl} alt={characterName} />
              ) : (
                <span>{characterInitial}</span>
              )}
            </span>
            <span className="chat-character-copy">
              <strong>{characterName}</strong>
              <span>
                {mission.title} · Misión {numericSceneIndex + 1} de {story.missions.length}
              </span>
            </span>
          </button>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => {
            handleOpenAssistance()
          }}
        >
          Ayuda
        </button>
      </section>

      <section className="story-chat-layout">
        <aside className="story-chat-sidebar">
          <div className="story-chat-panel">
            <p className="eyebrow">Requisitos</p>
            <h2>{mission.title}</h2>
            {mission.sceneSummary ? <p className="muted">{mission.sceneSummary}</p> : null}

            <div className="story-requirement-list">
              {requirements.map((requirement) => (
                <button
                  key={requirement.requirementId}
                  type="button"
                  className={`story-requirement-item${requirement.met ? ' is-complete' : ''}`}
                  onClick={() => {
                    handleOpenAssistance(
                      `Puedes ayudarme a cumplir este requisito: "${requirement.text}"`,
                    )
                  }}
                >
                  <span>{requirement.met ? '✓' : '○'}</span>
                  <div>
                    <strong>{requirement.text}</strong>
                    {requirement.feedback ? <p>{requirement.feedback}</p> : null}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {(analysis || missionCompleted) && (
            <div className="story-chat-panel">
              <p className="eyebrow">Resultado</p>
              {analysis ? (
                <>
                  <h2>
                    {analysis.correctness}% ·{' '}
                    {analysis.result === 'correct'
                      ? 'Correcto'
                      : analysis.result === 'partial'
                        ? 'Parcial'
                        : 'Reintenta'}
                  </h2>
                  {analysis.errors.length ? (
                    <div className="story-analysis-block">
                      <strong>Errores detectados</strong>
                      <ul>
                        {analysis.errors.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {analysis.reformulations.length ? (
                    <div className="story-analysis-block">
                      <strong>Reformulaciones sugeridas</strong>
                      <ul>
                        {analysis.reformulations.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : null}

              {retryState !== 'none' ? (
                <button type="button" className="btn primary" onClick={handleRetry}>
                  Volver a intentar
                </button>
              ) : null}

              {missionCompleted ? (
                <div className="story-complete-box">
                  <strong>¡Misión completada!</strong>
                  {conversationFeedback?.summary ? <p>{conversationFeedback.summary}</p> : null}
                  {conversationFeedback?.improvements?.length ? (
                    <ul>
                      {conversationFeedback.improvements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {!storyCompleted && pendingNext !== null ? (
                    <Link to={buildStoryChatPath(story.storyId, pendingNext)} className="btn primary">
                      Ir a la siguiente misión
                    </Link>
                  ) : null}
                  <Link to={buildStoryMissionsPath(story.storyId)} className="btn ghost">
                    Ver misiones
                  </Link>
                </div>
              ) : null}
            </div>
          )}
        </aside>

        <section className="story-chat-main">
          <div className="story-chat-thread">
            {messages.length === 0 ? (
              <div className="story-chat-empty">
                <strong>La conversación todavía no empieza.</strong>
                <p>Escribe tu primer mensaje para activar la misión y recibir feedback.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`story-chat-bubble story-chat-bubble-${message.role}`}
                >
                  {message.role === 'assistant' ? (
                    <button
                      type="button"
                      className="story-chat-bubble-action"
                      onClick={() => {
                        handleOpenAssistance(`Puedes explicarme esta frase: "${message.text}"`)
                      }}
                    >
                      {message.text}
                    </button>
                  ) : (
                    <p>{message.text}</p>
                  )}
                </div>
              ))
            )}
          </div>

          {chatError ? (
            <div className="dashboard-feedback dashboard-feedback-error">
              <strong>No pudimos continuar el chat.</strong>
              <p>{chatError}</p>
            </div>
          ) : null}

          <form className="story-chat-composer" onSubmit={handleSendText}>
            <label className="story-chat-input">
              <span>Tu mensaje</span>
              <textarea
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value)
                  if (chatError) {
                    setChatError(null)
                  }
                }}
                rows={4}
                placeholder="Escribe tu respuesta en inglés…"
                disabled={flowState !== 'idle'}
              />
            </label>
            <div className="story-chat-actions">
              <span className="story-chat-status">
                {flowState === 'evaluating'
                  ? 'Evaluando mensaje…'
                  : retryState === 'required'
                    ? 'Debes reintentar antes de seguir.'
                    : retryState === 'optional'
                      ? 'Puedes reintentar o seguir.'
                      : 'Chat listo'}
              </span>
              <button
                type="submit"
                className="btn primary"
                disabled={!draft.trim() || flowState !== 'idle'}
              >
                {flowState === 'evaluating' ? 'Evaluando…' : 'Enviar'}
              </button>
            </div>
          </form>
        </section>
      </section>

      {showAssistanceModal ? (
        <div className="story-assistance-backdrop" role="presentation">
          <div className="story-assistance-modal" role="dialog" aria-modal="true">
            <div className="story-assistance-close-row">
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setShowAssistanceModal(false)
                }}
              >
                Cerrar
              </button>
            </div>

            <div className="story-assistance-head">
              <div className="story-assistance-avatar">
                <img src={luviImage} alt="Luvi" />
              </div>
              <div>
                <p className="eyebrow">Asistencia</p>
                <h2>Luvi puede darte una pista</h2>
                <p className="muted">Usa el contexto de la misión y el chat actual para ayudarte.</p>
              </div>
            </div>

            <label className="vocab-search-field practice-textarea-field">
              <span>Tu pregunta</span>
              <textarea
                value={assistanceQuestion}
                onChange={(event) => {
                  setAssistanceQuestion(event.target.value)
                  if (assistanceError) {
                    setAssistanceError(null)
                  }
                }}
                rows={4}
                placeholder='Ejemplo: "No entiendo cómo cumplir el segundo requisito."'
              />
            </label>

            <div className="story-assistance-actions">
              <button
                type="button"
                className="btn primary"
                disabled={assistanceLoading}
                onClick={() => {
                  void handleRequestAssistance()
                }}
              >
                {assistanceLoading ? 'Pensando…' : 'Pedir ayuda'}
              </button>
            </div>

            {assistanceError ? (
              <div className="dashboard-feedback dashboard-feedback-error">
                <strong>No se pudo obtener ayuda.</strong>
                <p>{assistanceError}</p>
              </div>
            ) : null}

            {assistanceAnswer ? (
              <div className="story-assistance-answer">
                <strong>Respuesta de Luvi</strong>
                <p>{assistanceAnswer}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
