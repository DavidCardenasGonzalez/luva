import { useEffect, useRef, useState } from 'react'
import luvaLogo from '../../app/src/image/logo.png'
import './App.css'

const appStoreUrl = 'https://apps.apple.com/es/app/luva-ingles/id6758112881'
const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.cardi7.luva'

const socialLinks = [
  {
    eyebrow: 'iPhone / iPad',
    title: 'Descargar en App Store',
    detail: 'Instala Luva en iOS y empieza a practicar conversaciones guiadas en inglés.',
    href: appStoreUrl,
    cta: 'Abrir App Store',
  },
  {
    eyebrow: 'Android',
    title: 'Descargar en Google Play',
    detail: 'Accede a la versión para Android con el mismo enfoque de speaking y feedback inmediato.',
    href: playStoreUrl,
    cta: 'Abrir Google Play',
  },
]

function getSmartRedirectTarget() {
  if (typeof navigator === 'undefined') {
    return null
  }

  const userAgent = navigator.userAgent || ''
  const platform = navigator.platform || ''
  const maxTouchPoints = navigator.maxTouchPoints || 0
  const isAndroid = /android/i.test(userAgent)
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)

  if (isAndroid) {
    return {
      label: 'Android',
      href: playStoreUrl,
    }
  }

  if (isIOS) {
    return {
      label: 'iPhone o iPad',
      href: appStoreUrl,
    }
  }

  return null
}

function getInAppBrowserName() {
  if (typeof navigator === 'undefined') {
    return null
  }

  const userAgent = navigator.userAgent || ''

  if (/tiktok/i.test(userAgent)) {
    return 'TikTok'
  }

  if (/instagram/i.test(userAgent)) {
    return 'Instagram'
  }

  if (/FBAN|FBAV/i.test(userAgent)) {
    return 'Facebook'
  }

  return null
}

const sessionFlow = [
  {
    title: 'Contexto en voz',
    detail:
      'Escuchas el reto: una carta, una historia o una situación real. Tienes 30 segundos para pensar tu respuesta.',
  },
  {
    title: 'Habla y responde',
    detail:
      'Respondes en voz. Luva transcribe, entiende tu intención y mantiene el ritmo para que no pierdas fluidez.',
  },
  {
    title: 'Feedback inmediato',
    detail:
      'En segundos recibes correcciones de pronunciación y gramática, frases modelo y vocabulario para subir a C1.',
  },
  {
    title: 'Seguimiento',
    detail:
      'Guardamos tu progreso y proponemos el siguiente reto en función de lo que ya dominaste y tus errores frecuentes.',
  },
]

const highlights = [
  {
    title: 'Conversaciones guiadas',
    description:
      'Cartas y micro historias creadas para hispanohablantes B1→C1. Escuchas el contexto, respondes en voz y recibes la réplica.',
  },
  {
    title: 'Correcciones accionables',
    description:
      'Transcripción limpia, frases modelo, phrasal verbs y notas cortas de pronunciación para usar en la siguiente respuesta.',
  },
  {
    title: 'Entrena hablando',
    description:
      'Interacción 100% por voz con refuerzos opcionales en texto. Practicas listening, speaking y autocorrección en un mismo flujo.',
  },
  {
    title: 'Seguro por diseño',
    description:
      'Sin claves de IA en el cliente. Todo pasa por nuestra API en AWS con cifrado en tránsito y en reposo.',
  },
]

const commitments = [
  {
    label: 'B1→C1',
    text: 'Retos diseñados con rúbricas CEFR para que ganes precisión sin perder naturalidad.',
  },
  {
    label: '10–15 min',
    text: 'Sesiones cortas y guiadas que puedes completar en un descanso o de camino a casa.',
  },
  {
    label: 'Respeto a tu tiempo',
    text: 'Sin feeds infinitos ni notificaciones invasivas. Luva te recuerda solo lo necesario para progresar.',
  },
]

const termsPoints = [
  'Al usar Luva aceptas estos términos y los ajustes que publiquemos. La app está pensada para mayores de 16 años.',
  'Usa la app solo para practicar inglés. No la utilices para actividades ilegales, automatización masiva ni para poner en riesgo a otras personas.',
  'Si creas una cuenta, mantén tus credenciales seguras. Podemos suspender accesos que abusen del servicio o interfieran con la infraestructura.',
  'Las suscripciones o compras dentro de la app, si aplican, se gestionan a través de la tienda correspondiente (App Store/Play Store) y se rigen por sus políticas.',
  'Todo el contenido y la tecnología de Luva son propiedad de sus creadores. No está permitido copiar, redistribuir o crear obras derivadas sin permiso.',
  'Luva es una herramienta de aprendizaje: no garantizamos resultados específicos ni asumimos responsabilidad por decisiones tomadas con base en la información entregada.',
]

const privacyPoints = [
  'Recopilamos datos básicos de cuenta (por ejemplo, correo o alias), progreso de sesiones, transcripciones de voz y métricas de evaluación. No pedimos acceso a tus contactos ni fotos.',
  'Usamos tus datos para operar la app, personalizar retos, mejorar los modelos de corrección y enviar comunicaciones relevantes sobre el servicio.',
  'El audio se procesa para generar transcripciones y feedback; después se descarta. Guardamos las transcripciones y métricas para darte seguimiento.',
  'Alojamos la infraestructura en AWS. Protegemos la información con cifrado en tránsito y en reposo y aplicamos controles de acceso mínimos.',
  'No vendemos tus datos. Solo los compartimos con proveedores que nos ayudan a operar (autenticación, almacenamiento, analítica) bajo acuerdos de confidencialidad.',
  'Puedes solicitar acceso, corrección o eliminación de tus datos escribiendo al equipo de soporte publicado en la app o en dcardenasgz@gmail.com.',
]

function App() {
  const hasRedirectedRef = useRef(false)
  const [copiedHref, setCopiedHref] = useState<string | null>(null)
  const path = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') || '/' : '/'
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const isLinksView = path === '/links' || params?.get('view') === 'links'
  const skipSmartRedirect = params?.get('no_redirect') === '1'
  const smartRedirectTarget = isLinksView && !skipSmartRedirect ? getSmartRedirectTarget() : null
  const inAppBrowserName = isLinksView ? getInAppBrowserName() : null
  const shouldAutoRedirect = Boolean(isLinksView && smartRedirectTarget && !inAppBrowserName)

  const copyLink = async (href: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(href)
      } else {
        const input = document.createElement('textarea')
        input.value = href
        input.setAttribute('readonly', '')
        input.style.position = 'absolute'
        input.style.left = '-9999px'
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }

      setCopiedHref(href)
      window.setTimeout(() => {
        setCopiedHref((current) => (current === href ? null : current))
      }, 1800)
    } catch {
      setCopiedHref(null)
    }
  }

  useEffect(() => {
    if (!shouldAutoRedirect || !smartRedirectTarget || hasRedirectedRef.current) {
      return
    }

    hasRedirectedRef.current = true
    window.location.replace(smartRedirectTarget.href)
  }, [shouldAutoRedirect, smartRedirectTarget])

  if (isLinksView) {
    return (
      <div className="page page-links">
        <main className="links-shell">
          <section className="links-card">
            <img className="links-logo" src={luvaLogo} alt="Luva" />
            <h1>Tu siguiente sesión de inglés empieza aquí.</h1>
            <p className="lede links-lede">
              Practica speaking con historias guiadas, responde en voz y recibe feedback útil en segundos.
            </p>

            {shouldAutoRedirect && smartRedirectTarget && (
              <p className="redirect-note">
                Detectamos {smartRedirectTarget.label}. Te estamos llevando a la tienda correcta.
              </p>
            )}

            <div className="links-list">
              {socialLinks.map((link) => (
                <div key={link.title} className="store-link-card">
                  <a
                    className="store-link"
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="eyebrow">{link.eyebrow}</span>
                    <strong>{link.title}</strong>
                    <span>{link.detail}</span>
                    <span className="store-link-cta">{link.cta}</span>
                  </a>
                  <button
                    type="button"
                    className="copy-link-button"
                    onClick={() => {
                      void copyLink(link.href)
                    }}
                  >
                    {copiedHref === link.href ? 'Link copiado' : 'Copiar link'}
                  </button>
                </div>
              ))}
            </div>

            <div className="links-meta">
              <span className="chip">B1→C1</span>
              <span className="chip">Speaking con IA</span>
              <span className="chip">Sesiones de 10–15 min</span>
            </div>

            <a className="links-home" href="/">
              Ver sitio completo
            </a>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="hero">
        <nav className="nav">
          <a className="brand brand-logo" href="/" aria-label="Luva home">
            <img src={luvaLogo} alt="Luva" />
          </a>
          <div className="nav-links">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="/?view=links">Links</a>
            <a href="#terminos">Términos</a>
            <a href="#privacidad">Privacidad</a>
          </div>
          <a className="nav-cta" href="#como-funciona">
            Ver experiencia
          </a>
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
              <a className="btn primary" href="#como-funciona">
                Ver cómo funciona
              </a>
              <a className="btn ghost" href="#privacidad">
                Leer políticas
              </a>
            </div>
            <div className="chips">
              <span className="chip">10–15 minutos al día</span>
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
              <p>Sin claves de IA expuestas en el cliente. Todo pasa por la API de Luva.</p>
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
            Última actualización: {new Date().toLocaleDateString('es-ES')}. Si actualizamos estas condiciones,
            avisaremos en la app o en este sitio.
          </p>
          <ul>
            {termsPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div className="policy-note">
            <strong>Soporte:</strong> si tienes dudas, escríbenos al correo indicado en la app o a
            {' '}
            <a href="mailto:dcardenasgz@gmail.com">dcardenasgz@gmail.com</a>.
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
            <strong>Derechos ARCO:</strong> puedes ejercer acceso, rectificación, cancelación u oposición
            contactándonos en <a href="mailto:dcardenasgz@gmail.com">dcardenasgz@gmail.com</a>.
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="brand">Luva</div>
        <div className="footer-links">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="/?view=links">Links</a>
          <a href="#terminos">Términos</a>
          <a href="#privacidad">Privacidad</a>
        </div>
        <p className="muted">Luva — práctica guiada de inglés B1→C1.</p>
      </footer>
    </div>
  )
}

export default App
