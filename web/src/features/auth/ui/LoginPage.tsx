import { useLocation, useNavigate } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { useAuthSession } from '@/features/auth/model/use-auth-session'
import { luvaLogo } from '@/shared/assets/brand'

type LoginRouteState = {
  authMessage?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as LoginRouteState | null
  const { auth, authConfig, startAuthFlow } = useAuthSession()

  const error = auth.error || routeState?.authMessage

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
            Esta primera versión web comparte usuarios de Cognito con iOS y Android. Puedes continuar con Google
            o entrar con correo y contraseña.
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
            <h2>Login o signup</h2>
            <p className="muted">
              Si no tienes cuenta, crea una desde aquí y quedarás listo para usar la web y el app con el mismo usuario.
            </p>
          </div>

          <div className="auth-actions">
            <button
              type="button"
              className="auth-button auth-button-google"
              onClick={() => {
                startAuthFlow('login', 'google')
              }}
              disabled={auth.isLoading || !authConfig.isConfigured}
            >
              {auth.isLoading ? 'Abriendo Cognito...' : 'Continuar con Google'}
            </button>
            <button
              type="button"
              className="auth-button auth-button-email"
              onClick={() => {
                startAuthFlow('login', 'email')
              }}
              disabled={auth.isLoading || !authConfig.isConfigured}
            >
              {auth.isLoading ? 'Abriendo Cognito...' : 'Entrar con correo y contraseña'}
            </button>
            <button
              type="button"
              className="auth-button auth-button-ghost"
              onClick={() => {
                startAuthFlow('signup', 'email')
              }}
              disabled={auth.isLoading || !authConfig.isConfigured}
            >
              {auth.isLoading ? 'Abriendo signup...' : 'Crear cuenta'}
            </button>
          </div>

          {!authConfig.isConfigured && (
            <div className="auth-feedback auth-feedback-warning">
              Configura <code>VITE_COGNITO_DOMAIN</code> y <code>VITE_COGNITO_CLIENT_ID</code> en la web para habilitar el login.
            </div>
          )}

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
            <span className="muted">Cognito Hosted UI + mismos usuarios del app</span>
          </div>
        </section>
      </main>
    </div>
  )
}
