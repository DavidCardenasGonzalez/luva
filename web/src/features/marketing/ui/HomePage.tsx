import { Link, useNavigate } from 'react-router-dom'
import { appPaths, buildHomeSectionHref } from '@/app/router/paths'
import { getDisplayName } from '@/features/auth/model/get-display-name'
import { useAuthSession } from '@/features/auth/model/use-auth-session'
import {
  commitments,
  highlights,
  lastLegalUpdate,
  privacyPoints,
  sessionFlow,
  supportEmail,
  termsPoints,
} from '@/features/marketing/content/site-content'
import { luvaLogo } from '@/shared/assets/brand'

export function HomePage() {
  const navigate = useNavigate()
  const { auth, isSignedIn } = useAuthSession()

  const heroPrimaryLabel = isSignedIn ? 'Abrir Luva Web' : 'Login'
  const heroPrimaryDestination = isSignedIn ? appPaths.dashboard : appPaths.login

  return (
    <div className="page">
      <header className="hero">
        <nav className="nav">
          <Link className="brand brand-logo" to={appPaths.home} aria-label="Luva home">
            <img src={luvaLogo} alt="Luva" />
          </Link>
          <div className="nav-links">
            <a href={buildHomeSectionHref('como-funciona')}>Cómo funciona</a>
            <Link to={appPaths.links}>Links</Link>
            <a href={buildHomeSectionHref('terminos')}>Términos</a>
            <a href={buildHomeSectionHref('privacidad')}>Privacidad</a>
          </div>
          <button
            type="button"
            className="nav-cta"
            onClick={() => {
              navigate(heroPrimaryDestination)
            }}
          >
            {heroPrimaryLabel}
          </button>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <span className="pill">B1 → C1 con conversaciones guiadas</span>
            <h1>Practica inglés hablado sin sentir que estudias.</h1>
            <p className="lede">
              Luva te acompaña con cartas de conversación, historias interactivas y feedback de voz en segundos.
              Diseñada para hispanohablantes que quieren moverse de B1 a C1 con confianza.
            </p>
            <div className="cta-row">
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  navigate(heroPrimaryDestination)
                }}
              >
                {heroPrimaryLabel}
              </button>
              <a className="btn ghost" href={buildHomeSectionHref('como-funciona')}>
                Ver cómo funciona
              </a>
            </div>
            <p className="hero-note">
              La versión web usa el mismo Cognito del app: puedes entrar con Google o con correo y contraseña.
            </p>
            <div className="chips">
              <span className="chip">10-15 minutos al día</span>
              <span className="chip">Feedback inmediato de voz</span>
              <span className="chip">Infraestructura segura en AWS</span>
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-header">
              <p className="eyebrow">Una sesión típica</p>
              <span className="tag">Tiempo real</span>
            </div>
            <div className="flow">
              {sessionFlow.map((step) => (
                <div key={step.title} className="flow-item">
                  <div className="flow-dot" />
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="panel-footer">
              {isSignedIn ? (
                <p>Sesión web activa como {getDisplayName(auth.user)}.</p>
              ) : (
                <p>Entra desde la web con la misma cuenta que ya usas en iOS o Android.</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <section id="como-funciona" className="section">
        <div className="section-heading">
          <p className="eyebrow">Cómo funciona</p>
          <h2>Entrena speaking y listening en un mismo flujo.</h2>
          <p className="muted">
            Luva propone retos cortos, escucha tus respuestas y te devuelve correcciones que puedes aplicar en la
            siguiente ronda. Sin abrir libros ni perder tiempo en configuraciones.
          </p>
        </div>
        <div className="cards">
          {highlights.map((item) => (
            <div key={item.title} className="card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>

        <div className="commitments">
          {commitments.map((item) => (
            <div key={item.label} className="commitment">
              <span className="tag">{item.label}</span>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="terminos" className="section policies">
        <div className="policy">
          <p className="eyebrow">Términos y condiciones</p>
          <h2>Lee esto antes de usar Luva.</h2>
          <p className="muted">
            Última actualización: {lastLegalUpdate}. Si actualizamos estas condiciones, avisaremos en la app o en este
            sitio.
          </p>
          <ul>
            {termsPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div className="policy-note">
            <strong>Soporte:</strong> si tienes dudas, escríbenos al correo indicado en la app o a{' '}
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          </div>
        </div>

        <div id="privacidad" className="policy">
          <p className="eyebrow">Política de privacidad</p>
          <h2>Protegemos tus datos y tu voz.</h2>
          <p className="muted">
            Queremos transparencia: estos son los datos que procesamos y cómo los cuidamos mientras usas Luva.
          </p>
          <ul>
            {privacyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div className="policy-note">
            <strong>Derechos ARCO:</strong> puedes ejercer acceso, rectificación, cancelación u oposición contactándonos
            en <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="brand">Luva</div>
        <div className="footer-links">
          <a href={buildHomeSectionHref('como-funciona')}>Cómo funciona</a>
          <Link to={appPaths.links}>Links</Link>
          <a href={buildHomeSectionHref('terminos')}>Términos</a>
          <a href={buildHomeSectionHref('privacidad')}>Privacidad</a>
        </div>
        <p className="muted">Luva - práctica guiada de inglés B1→C1.</p>
      </footer>
    </div>
  )
}
