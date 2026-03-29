import { useNavigate } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { getDisplayName } from '@/features/auth/model/get-display-name'
import { useAuthSession } from '@/features/auth/model/use-auth-session'

export function WelcomePage() {
  const navigate = useNavigate()
  const { auth, signOut } = useAuthSession()

  return (
    <div className="page auth-page">
      <main className="welcome-shell">
        <section className="welcome-card">
          <p className="eyebrow">Área protegida</p>
          <h1>Bienvenido</h1>
          <p className="lede">Ya entraste a la versión web con el mismo usuario que usa el app.</p>

          <div className="welcome-grid">
            <div className="welcome-panel">
              <span className="tag">Cuenta</span>
              <h2>{getDisplayName(auth.user)}</h2>
              <p>{auth.user?.email || 'Tu usuario ya quedó autenticado en Cognito.'}</p>
            </div>
            <div className="welcome-panel">
              <span className="tag">Método</span>
              <h2>{auth.user?.lastAuthProvider || 'email'}</h2>
              <p>El acceso web comparte el mismo user pool que el app móvil.</p>
            </div>
          </div>

          <div className="welcome-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                navigate(appPaths.home)
              }}
            >
              Ir al inicio
            </button>
            <button type="button" className="btn ghost" onClick={signOut}>
              Cerrar sesión
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
