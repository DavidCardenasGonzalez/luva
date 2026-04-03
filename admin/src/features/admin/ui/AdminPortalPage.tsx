import { getDisplayName } from '@/features/auth/model/get-display-name'
import { useAuthSession } from '@/features/auth/model/use-auth-session'

export function AdminPortalPage() {
  const { auth, signOut } = useAuthSession()

  return (
    <div className="page auth-page">
      <main className="dashboard-shell">
        <section className="dashboard-hero-card">
          <div className="dashboard-hero-copy">
            <p className="eyebrow">Portal Administrativo</p>
            <h1>{getDisplayName(auth.user)}</h1>
            <p className="lede">
              Esta es una aplicación aparte del sitio web principal. Por ahora solo valida que el
              usuario autenticado traiga el rol correcto desde Cognito.
            </p>

            <div className="dashboard-account-row">
              <div className="dashboard-account-pill">
                <span className="tag">Cuenta</span>
                <strong>{auth.user?.email || 'Usuario autenticado'}</strong>
              </div>
              <div className="dashboard-account-pill">
                <span className="tag">Roles</span>
                <strong>{auth.user?.roles?.join(', ') || 'Sin roles detectados'}</strong>
              </div>
              <div className="dashboard-account-pill">
                <span className="tag">Método</span>
                <strong>{auth.user?.lastAuthProvider || 'email'}</strong>
              </div>
            </div>
          </div>

          <div className="dashboard-hero-meter">
            <span>Estado</span>
            <strong>Acceso concedido</strong>
            <p>
              El login quedó separado del proyecto `web` y la protección por rol ya responde al
              claim `admin`.
            </p>
            <div className="welcome-actions dashboard-actions">
              <button type="button" className="btn primary" onClick={signOut}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </section>

        <section className="dashboard-panel">
          <p className="eyebrow">Placeholder</p>
          <h2>Portal vacío por ahora</h2>
          <p className="lede">
            Esta pantalla no hace nada todavía. Solo confirma que la app separada ya puede iniciar
            sesión con Cognito y limitar acceso por rol.
          </p>
        </section>
      </main>
    </div>
  )
}
