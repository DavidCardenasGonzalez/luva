import { useAuthSession } from '@/features/auth/model/use-auth-session'

type AccessDeniedPageProps = {
  title?: string
  message?: string
}

export function AccessDeniedPage({
  title = 'No tienes permisos para abrir esta sección.',
  message = 'Tu sesión está activa, pero Cognito no devolvió el rol requerido para esta vista.',
}: AccessDeniedPageProps) {
  const { auth, signOut } = useAuthSession()

  return (
    <div className="page auth-page">
      <main className="welcome-shell">
        <section className="welcome-card">
          <p className="eyebrow">Acceso restringido</p>
          <h1>{title}</h1>
          <p className="lede">{message}</p>

          <div className="welcome-grid">
            <article className="welcome-panel">
              <span className="tag">Cuenta</span>
              <h2>{auth.user?.email || 'Usuario autenticado'}</h2>
              <p>
                El portal administrativo solo permite acceso cuando el token incluye el grupo o rol
                <code> admin </code>.
              </p>
            </article>

            <article className="welcome-panel">
              <span className="tag">Siguiente paso</span>
              <h2>Actualiza Cognito</h2>
              <p>
                Asigna el rol desde Cognito y después vuelve a iniciar sesión para renovar los
                claims del token.
              </p>
            </article>
          </div>

          <div className="welcome-actions">
            <button type="button" className="btn primary" onClick={signOut}>
              Cerrar sesión
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
