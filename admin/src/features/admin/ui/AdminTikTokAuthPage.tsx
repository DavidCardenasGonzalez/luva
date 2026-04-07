import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  completeAdminTikTokAuth,
  getAdminTikTokAuthStatus,
  startAdminTikTokAuth,
} from '@/features/admin/api/admin-client'
import type { AdminTikTokAuthStatusResponse } from '@/features/admin/model/types'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'

const TIKTOK_OAUTH_STATE_KEY = 'luva.admin.tiktok.oauth.state'

function formatDateTime(value?: string) {
  if (!value) {
    return 'Sin datos'
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

function readStoredOAuthState() {
  try {
    return sessionStorage.getItem(TIKTOK_OAUTH_STATE_KEY)
  } catch {
    return null
  }
}

function writeStoredOAuthState(value: string) {
  try {
    sessionStorage.setItem(TIKTOK_OAUTH_STATE_KEY, value)
  } catch {
    // Ignore storage failures in browsers with restricted sessionStorage.
  }
}

function clearStoredOAuthState() {
  try {
    sessionStorage.removeItem(TIKTOK_OAUTH_STATE_KEY)
  } catch {
    // Ignore storage failures in browsers with restricted sessionStorage.
  }
}

export function AdminTikTokAuthPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState<AdminTikTokAuthStatusResponse>()
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  const callbackCode = searchParams.get('code')
  const callbackState = searchParams.get('state')
  const callbackError = searchParams.get('error') || searchParams.get('error_description')

  const steps = useMemo(() => {
    const token = status?.token

    return [
      {
        label: 'Configurar app',
        done:
          !!status?.clientKeyConfigured &&
          !!status?.clientSecretConfigured &&
          !!status?.redirectUriConfigured,
        detail: status?.redirectUri || 'Falta TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET o TIKTOK_REDIRECT_URI.',
      },
      {
        label: 'Autorizar cuenta',
        done: !!status?.connected,
        detail: status?.connected
          ? `Open ID: ${token?.openId || 'recibido'}`
          : 'Inicia el flujo OAuth y aprueba video.publish en TikTok.',
      },
      {
        label: 'Token disponible',
        done: !!status?.token.accessTokenStored && !!status?.token.refreshTokenStored,
        detail: status?.token.updatedAt
          ? `Guardado el ${formatDateTime(status.token.updatedAt)}`
          : 'Todavía no hay tokens guardados en SSM.',
      },
    ]
  }, [status])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(undefined)

      try {
        const result = await getAdminTikTokAuthStatus()
        if (!cancelled) {
          setStatus(result)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No pudimos cargar el estado de autenticación de TikTok.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const finishOAuth = async () => {
      if (callbackError) {
        setError(`TikTok devolvió un error en el callback: ${callbackError}`)
        setSearchParams({}, { replace: true })
        clearStoredOAuthState()
        return
      }

      if (!callbackCode) {
        return
      }

      const expectedState = readStoredOAuthState()
      if (!expectedState || !callbackState || expectedState !== callbackState) {
        setError('El state devuelto por TikTok no coincide con el iniciado desde el portal.')
        setSearchParams({}, { replace: true })
        clearStoredOAuthState()
        return
      }

      setIsCompleting(true)
      setError(undefined)
      setMessage(undefined)

      try {
        const result = await completeAdminTikTokAuth(callbackCode)
        if (cancelled) {
          return
        }

        clearStoredOAuthState()
        setMessage(
          `TikTok quedó conectado. Access token vigente hasta ${formatDateTime(result.token.accessTokenExpiresAt)}.`,
        )
        setStatus((current) =>
          current
            ? {
                ...current,
                connected: result.connected,
                token: {
                  ...current.token,
                  accessTokenStored: true,
                  refreshTokenStored: true,
                  ...result.token,
                },
              }
            : undefined,
        )
      } catch (completeError) {
        if (!cancelled) {
          setError(
            completeError instanceof Error
              ? completeError.message
              : 'No pudimos completar la autenticación de TikTok.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsCompleting(false)
          setSearchParams({}, { replace: true })
        }
      }
    }

    void finishOAuth()

    return () => {
      cancelled = true
    }
  }, [callbackCode, callbackError, callbackState, setSearchParams])

  const handleStartOAuth = async () => {
    setIsStarting(true)
    setError(undefined)
    setMessage(undefined)

    try {
      const result = await startAdminTikTokAuth()
      writeStoredOAuthState(result.state)
      window.location.assign(result.authUrl)
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : 'No pudimos iniciar el flujo de autenticación con TikTok.',
      )
      setIsStarting(false)
    }
  }

  return (
    <AdminLayout
      title="TikTok OAuth"
      description="Conecta una cuenta de TikTok desde el portal admin para guardar access token y refresh token en AWS."
      actions={
        <button type="button" className="btn secondary" onClick={() => window.location.reload()} disabled={isLoading || isCompleting}>
          {isLoading ? 'Consultando...' : 'Recargar estado'}
        </button>
      }
    >
      {(error || message) && (
        <section className={error ? 'admin-inline-alert' : 'admin-inline-note admin-inline-note-success'}>
          <p>{error || message}</p>
        </section>
      )}

      <section className="admin-content-grid">
        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Flujo OAuth</p>
            <h3>Seguimiento de conexión</h3>
          </div>

          <div className="admin-stack-grid">
            {steps.map((step, index) => (
              <div key={step.label} className="admin-stack-card">
                <span className={`admin-module-status ${step.done ? 'admin-module-status-ready' : 'admin-module-status-planned'}`}>
                  Paso {index + 1}
                </span>
                <h4>{step.label}</h4>
                <p>{step.detail}</p>
              </div>
            ))}
          </div>

          <div className="admin-action-row">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                void handleStartOAuth()
              }}
              disabled={isStarting || isCompleting}
            >
              {isStarting ? 'Redirigiendo a TikTok...' : 'Conectar con TikTok'}
            </button>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Estado actual</p>
            <h3>Configuración guardada</h3>
          </div>

          <div className="admin-session-list">
            <div className="admin-session-item">
              <span>Client key</span>
              <strong>{status?.clientKeyConfigured ? 'Configurado' : 'Falta configurar'}</strong>
            </div>
            <div className="admin-session-item">
              <span>Client secret</span>
              <strong>{status?.clientSecretConfigured ? 'Configurado' : 'Falta configurar'}</strong>
            </div>
            <div className="admin-session-item">
              <span>Redirect URI</span>
              <strong>{status?.redirectUriConfigured ? status?.redirectUri || 'Configurado' : 'Falta configurar'}</strong>
            </div>
            <div className="admin-session-item">
              <span>Scopes</span>
              <strong>{status?.scopes?.join(', ') || 'video.publish'}</strong>
            </div>
            <div className="admin-session-item">
              <span>Access token</span>
              <strong>{status?.token.accessTokenStored ? 'Guardado en SSM' : 'No guardado'}</strong>
            </div>
            <div className="admin-session-item">
              <span>Refresh token</span>
              <strong>{status?.token.refreshTokenStored ? 'Guardado en SSM' : 'No guardado'}</strong>
            </div>
            <div className="admin-session-item">
              <span>Access expira</span>
              <strong>{formatDateTime(status?.token.accessTokenExpiresAt)}</strong>
            </div>
            <div className="admin-session-item">
              <span>Refresh expira</span>
              <strong>{formatDateTime(status?.token.refreshTokenExpiresAt)}</strong>
            </div>
            <div className="admin-session-item">
              <span>Open ID</span>
              <strong>{status?.token.openId || 'Sin datos'}</strong>
            </div>
            <div className="admin-session-item">
              <span>Actualizado</span>
              <strong>{formatDateTime(status?.token.updatedAt)}</strong>
            </div>
          </div>
        </article>
      </section>
    </AdminLayout>
  )
}
