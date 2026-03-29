import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { socialLinks } from '@/features/marketing/content/site-content'
import { copyToClipboard, getInAppBrowserName, getSmartRedirectTarget } from '@/features/marketing/lib/browser'
import { luvaLogo } from '@/shared/assets/brand'

export function LinksPage() {
  const hasRedirectedRef = useRef(false)
  const clearCopiedRef = useRef<number | undefined>(undefined)
  const location = useLocation()
  const [copiedHref, setCopiedHref] = useState<string | null>(null)
  const params = new URLSearchParams(location.search)
  const skipSmartRedirect = params.get('no_redirect') === '1'
  const smartRedirectTarget = !skipSmartRedirect ? getSmartRedirectTarget() : null
  const inAppBrowserName = getInAppBrowserName()
  const shouldAutoRedirect = Boolean(smartRedirectTarget && !inAppBrowserName)

  useEffect(() => {
    return () => {
      if (clearCopiedRef.current) {
        window.clearTimeout(clearCopiedRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!shouldAutoRedirect || !smartRedirectTarget || hasRedirectedRef.current) {
      return
    }

    hasRedirectedRef.current = true
    window.location.replace(smartRedirectTarget.href)
  }, [shouldAutoRedirect, smartRedirectTarget])

  const handleCopy = async (href: string) => {
    try {
      await copyToClipboard(href)
      setCopiedHref(href)

      if (clearCopiedRef.current) {
        window.clearTimeout(clearCopiedRef.current)
      }

      clearCopiedRef.current = window.setTimeout(() => {
        setCopiedHref((current) => (current === href ? null : current))
      }, 1800)
    } catch {
      setCopiedHref(null)
    }
  }

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

          {inAppBrowserName && (
            <p className="redirect-note">
              Si abres esto desde {inAppBrowserName}, usa el link manual para evitar bloqueos del navegador embebido.
            </p>
          )}

          <div className="links-list">
            {socialLinks.map((link) => (
              <div key={link.title} className="store-link-card">
                <a className="store-link" href={link.href} target="_blank" rel="noreferrer">
                  <span className="eyebrow">{link.eyebrow}</span>
                  <strong>{link.title}</strong>
                  <span>{link.detail}</span>
                  <span className="store-link-cta">{link.cta}</span>
                </a>
                <button
                  type="button"
                  className="copy-link-button"
                  onClick={() => {
                    void handleCopy(link.href)
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
            <span className="chip">Sesiones de 10-15 min</span>
          </div>

          <Link className="links-home" to={appPaths.home}>
            Ver sitio completo
          </Link>
        </section>
      </main>
    </div>
  )
}
