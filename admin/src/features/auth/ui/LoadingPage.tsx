export function LoadingPage() {
  return (
    <div className="page auth-page">
      <main className="loading-card">
        <p className="eyebrow">Autenticando</p>
        <h1>Validando acceso</h1>
        <p className="muted">Estamos terminando el login con Cognito y preparando tu sesión admin.</p>
      </main>
    </div>
  )
}
