import { useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { useAuthSession } from '@/features/auth/model/use-auth-session'
import { luvaLogo } from '@/shared/assets/brand'

type LoginRouteState = {
  authMessage?: string
}

type EmailMode = 'login' | 'signup' | 'confirm'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as LoginRouteState | null
  const {
    auth,
    authConfig,
    startAuthFlow,
    signInWithEmail,
    signUpWithEmail,
    confirmEmailSignUp,
    resendEmailSignUpCode,
  } = useAuthSession()
  const [emailMode, setEmailMode] = useState<EmailMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [notice, setNotice] = useState<string | undefined>()
  const [deliveryHint, setDeliveryHint] = useState<string | undefined>()

  const error = auth.error || routeState?.authMessage
  const emailTitle = useMemo(() => {
    if (emailMode === 'signup') return 'Crear cuenta'
    if (emailMode === 'confirm') return 'Confirmar correo'
    return 'Entrar con correo'
  }, [emailMode])

  const emailSubtitle = useMemo(() => {
    if (emailMode === 'signup') {
      return 'Crea tu cuenta con correo y contraseña. Luego confirmas el código y quedas listo.'
    }
    if (emailMode === 'confirm') {
      return deliveryHint
        ? `Escribe el código que enviamos a ${deliveryHint}.`
        : 'Escribe el código que enviamos a tu correo para terminar el registro.'
    }
    return 'Usa el mismo correo y contraseña que tendrás en el app.'
  }, [deliveryHint, emailMode])

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(undefined)
    try {
      await signInWithEmail(email, password)
    } catch {
      // The provider already exposes the current error.
    }
  }

  const handleSignUpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(undefined)
    try {
      const result = await signUpWithEmail(email, password)
      if (!result.requiresConfirmation) {
        return
      }

      setDeliveryHint(result.destination)
      setEmailMode('confirm')
      setNotice(
        result.destination
          ? `Te enviamos un código a ${result.destination}.`
          : 'Te enviamos un código a tu correo.',
      )
    } catch {
      // The provider already exposes the current error.
    }
  }

  const handleConfirmSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(undefined)
    try {
      await confirmEmailSignUp(email, code, password)
    } catch {
      // The provider already exposes the current error.
    }
  }

  const handleResendCode = async () => {
    setNotice(undefined)
    try {
      await resendEmailSignUpCode(email)
      setNotice(
        deliveryHint
          ? `Te reenviamos el código a ${deliveryHint}.`
          : 'Te reenviamos el código a tu correo.',
      )
    } catch {
      // The provider already exposes the current error.
    }
  }

  return (
    <div className="page auth-page">
      <main className="auth-shell">
        <section className="auth-story">
          <button
            type="button"
            className="brand brand-logo auth-brand brand-button"
            onClick={() => {
              navigate(appPaths.home)
            }}
            aria-label="Luva home"
          >
            <img src={luvaLogo} alt="Luva" />
          </button>
          <p className="eyebrow">Luva Web</p>
          <h1>Entra con la misma cuenta que ya existe en el app.</h1>
          <p className="lede">
            La web comparte usuarios con iOS y Android. Puedes continuar con Google o entrar aquí mismo
            con correo y contraseña.
          </p>
          <div className="auth-benefits">
            <span className="chip">Google</span>
            <span className="chip">Correo y contraseña</span>
            <span className="chip">Mismo usuario que el app</span>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-head">
            <p className="eyebrow">Acceso</p>
            <h2>{emailTitle}</h2>
            <p className="muted">{emailSubtitle}</p>
          </div>

          <div className="auth-actions">
            <button
              type="button"
              className="auth-button auth-button-google"
              onClick={() => {
                startAuthFlow('login', 'google')
              }}
              disabled={auth.isLoading || !authConfig.isHostedUiConfigured}
            >
              {auth.isLoading ? 'Abriendo Cognito...' : 'Continuar con Google'}
            </button>
          </div>

          <div className="auth-divider">
            <span>o sigue con correo</span>
          </div>

          <div className="auth-mode-switch">
            <button
              type="button"
              className={`auth-segment${emailMode === 'login' ? ' is-active' : ''}`}
              onClick={() => {
                setNotice(undefined)
                setEmailMode('login')
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`auth-segment${emailMode === 'signup' || emailMode === 'confirm' ? ' is-active' : ''}`}
              onClick={() => {
                setNotice(undefined)
                setEmailMode('signup')
              }}
            >
              Crear cuenta
            </button>
          </div>

          <form
            className="auth-form"
            onSubmit={
              emailMode === 'login'
                ? handleLoginSubmit
                : emailMode === 'signup'
                  ? handleSignUpSubmit
                  : handleConfirmSubmit
            }
          >
            <label className="auth-field">
              <span>Correo</span>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                }}
                placeholder="tu@correo.com"
                autoComplete="email"
                disabled={auth.isLoading || !authConfig.isEmailAuthConfigured || emailMode === 'confirm'}
              />
            </label>

            <label className="auth-field">
              <span>Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                }}
                placeholder={emailMode === 'signup' ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
                autoComplete={emailMode === 'signup' ? 'new-password' : 'current-password'}
                disabled={auth.isLoading || !authConfig.isEmailAuthConfigured || emailMode === 'confirm'}
              />
            </label>

            {emailMode === 'confirm' && (
              <label className="auth-field">
                <span>Código</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value)
                  }}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  disabled={auth.isLoading || !authConfig.isEmailAuthConfigured}
                />
              </label>
            )}

            <div className="auth-form-actions">
              <button
                type="submit"
                className="auth-button auth-button-email"
                disabled={auth.isLoading || !authConfig.isEmailAuthConfigured}
              >
                {auth.isLoading
                  ? emailMode === 'confirm'
                    ? 'Verificando...'
                    : emailMode === 'signup'
                      ? 'Creando cuenta...'
                      : 'Entrando...'
                  : emailMode === 'confirm'
                    ? 'Verificar y entrar'
                    : emailMode === 'signup'
                      ? 'Crear cuenta'
                      : 'Entrar con correo'}
              </button>

              {emailMode === 'confirm' && (
                <button
                  type="button"
                  className="auth-button auth-button-ghost"
                  onClick={() => {
                    void handleResendCode()
                  }}
                  disabled={auth.isLoading || !authConfig.isEmailAuthConfigured}
                >
                  Reenviar código
                </button>
              )}
            </div>
          </form>

          {!authConfig.isEmailAuthConfigured && (
            <div className="auth-feedback auth-feedback-warning">
              Configura <code>VITE_COGNITO_DOMAIN</code>, <code>VITE_COGNITO_CLIENT_ID</code> y, si usas dominio custom, <code>VITE_COGNITO_REGION</code> para habilitar el acceso con correo.
            </div>
          )}

          {!authConfig.isHostedUiConfigured && (
            <div className="auth-feedback auth-feedback-warning">
              Configura también <code>VITE_REDIRECT_URI</code> para seguir usando Google con Hosted UI.
            </div>
          )}

          {notice && <div className="auth-feedback auth-feedback-success">{notice}</div>}
          {error && <div className="auth-feedback auth-feedback-error">{error}</div>}

          <div className="auth-meta">
            <button
              type="button"
              className="link-button"
              onClick={() => {
                navigate(appPaths.home)
              }}
            >
              Volver al inicio
            </button>
            <span className="muted">Correo dentro de UI + Google por Hosted UI</span>
          </div>
        </section>
      </main>
    </div>
  )
}
