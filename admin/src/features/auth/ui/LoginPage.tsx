import { useLocation } from 'react-router-dom'
import { useAuthSession } from '@/features/auth/model/use-auth-session'
import { appPaths } from '@/app/router/paths'
import { luvaLogo } from '@/shared/assets/brand'

type LoginRouteState = {
  authMessage?: string
  nextPath?: string
}

export function LoginPage() {
  const location = useLocation()
  const routeState = location.state as LoginRouteState | null
  const { auth, authConfig, startAuthFlow } = useAuthSession()
  const error = auth.error || routeState?.authMessage

  return (
    <div className="page auth-page">
      <main className="auth-shell">
        <section className="auth-story">
          <div className="brand brand-logo auth-brand">
            <img src={luvaLogo} alt="Luva" />
          </div>
          <p className="eyebrow">Luva Admin</p>
          <h1>Entra con la misma cuenta de Cognito.</h1>
          <p className="lede">
            Este portal es una aplicación aparte en React y usa el mismo Hosted UI. El acceso final
            depende del rol <code>admin</code> dentro del token.
          </p>
          <div className="auth-benefits">
            <span className="chip">Google</span>
            <span className="chip">Correo y contraseña</span>
            <span className="chip">Rol admin en Cognito</span>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-head">
            <p className="eyebrow">Acceso</p>
            <h2>Login o signup</h2>
            <p className="muted">
              El login es el mismo flujo de Cognito. Si la cuenta no tiene rol <code>admin</code>,
              el portal no se abre aunque la autenticación sea válida.
            </p>
          </div>

          <div className="auth-actions">
            <button
              type="button"
              className="auth-button auth-button-google"
              onClick={() => {
                startAuthFlow('login', 'google', routeState?.nextPath || appPaths.home)
              }}
              disabled={auth.isLoading || !authConfig.isConfigured}
            >
              {auth.isLoading ? 'Abriendo Cognito...' : 'Continuar con Google'}
            </button>
            <button
              type="button"
              className="auth-button auth-button-email"
              onClick={() => {
                startAuthFlow('login', 'email', routeState?.nextPath || appPaths.home)
              }}
              disabled={auth.isLoading || !authConfig.isConfigured}
            >
              {auth.isLoading ? 'Abriendo Cognito...' : 'Entrar con correo y contraseña'}
            </button>
            <button
              type="button"
              className="auth-button auth-button-ghost"
              onClick={() => {
                startAuthFlow('signup', 'email', routeState?.nextPath || appPaths.home)
              }}
              disabled={auth.isLoading || !authConfig.isConfigured}
            >
              {auth.isLoading ? 'Abriendo signup...' : 'Crear cuenta'}
            </button>
          </div>

          {!authConfig.isConfigured && (
            <div className="auth-feedback auth-feedback-warning">
              Configura <code>VITE_COGNITO_DOMAIN</code> y <code>VITE_COGNITO_CLIENT_ID</code> para
              habilitar el login del admin.
            </div>
          )}

          {error && <div className="auth-feedback auth-feedback-error">{error}</div>}

          <div className="auth-feedback">
            Si asignas o cambias el rol en Cognito, vuelve a iniciar sesión para refrescar los
            claims.
          </div>

          <div className="auth-meta">
            <span className="muted">Aplicación separada + Cognito Hosted UI</span>
          </div>
        </section>
      </main>
    </div>
  )
}
