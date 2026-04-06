import { useMemo, useState, type FormEvent } from 'react'
import {
  BadgeCheck,
  BookOpenText,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { appPaths, buildHomeSectionHref } from '@/app/router/paths'
import { getDisplayName } from '@/features/auth/model/get-display-name'
import type { AuthUser } from '@/features/auth/model/types'
import { useAuthSession } from '@/features/auth/model/use-auth-session'
import { supportEmail } from '@/features/marketing/content/site-content'
import { getErrorMessage } from '@/shared/lib/error-message'
import './account.css'

type ProEntry = {
  key: string
  label: string
  plan: string
  expiresAt?: string
}

export function AccountPage() {
  const { auth, signOut, updateCurrentUser } = useAuthSession()
  const [promoCode, setPromoCode] = useState('')
  const [isRedeemingPromo, setIsRedeemingPromo] = useState(false)
  const [promoFeedback, setPromoFeedback] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)

  const proEntries = useMemo(() => buildProEntries(auth.user), [auth.user])
  const hasProAccess = Boolean(auth.user?.isPro || proEntries.length)

  const handleRedeemPromoCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedCode = promoCode.trim()
    if (!trimmedCode) {
      setPromoFeedback({ tone: 'error', message: 'Ingresa un código para activarlo.' })
      return
    }

    try {
      setIsRedeemingPromo(true)
      setPromoFeedback(null)
      const result = await updateCurrentUser({ promoCode: trimmedCode })
      const redemption = result.promoCode

      if (!redemption?.isValid) {
        setPromoFeedback({ tone: 'error', message: 'Código no encontrado.' })
        return
      }

      const expiresLabel = redemption.expiresAt
        ? new Date(redemption.expiresAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : `${redemption.premiumDays} días`

      setPromoCode('')
      setPromoFeedback({
        tone: 'success',
        message: `Código aplicado. Tu cuenta quedó Pro hasta ${expiresLabel}.`,
      })
    } catch (redeemError) {
      setPromoFeedback({
        tone: 'error',
        message: getErrorMessage(redeemError, 'No pudimos validar el código.'),
      })
    } finally {
      setIsRedeemingPromo(false)
    }
  }

  return (
    <div className="dashboard-shell account-page">
      <section className="dashboard-hero-card account-hero-card">
        <div className="account-hero-copy">
          <p className="eyebrow">Mi cuenta</p>
          <h1>{getDisplayName(auth.user)}</h1>
          <p className="lede">
            Gestiona tu sesión, el acceso Pro y los enlaces clave de soporte desde la web.
          </p>

          <div className="dashboard-account-row">
            <div className="dashboard-account-pill">
              <span className="tag">Correo</span>
              <strong>{auth.user?.email || 'Usuario autenticado'}</strong>
            </div>
            <div className="dashboard-account-pill">
              <span className="tag">Acceso</span>
              <strong>{hasProAccess ? 'Pro activo' : 'Cuenta estándar'}</strong>
            </div>
            <div className="dashboard-account-pill">
              <span className="tag">Método</span>
              <strong>{getProviderLabel(auth.user?.lastAuthProvider)}</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-hero-meter account-hero-meter">
          <span>Estado de la cuenta</span>
          <strong>{hasProAccess ? 'Pro' : 'Gratis'}</strong>
          <p>
            Tu progreso queda vinculado a este usuario para recuperarlo en la web y en el app con la
            misma cuenta.
          </p>

          <div className="account-hero-actions">
            <Link to={appPaths.dashboard} className="btn primary">
              Ir al resumen
            </Link>
            <Link to={appPaths.stories} className="btn ghost">
              Abrir historias
            </Link>
          </div>
        </div>
      </section>

      <section className="account-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="eyebrow">Cuenta</p>
              <h2>Sesión y datos básicos</h2>
            </div>
          </div>

          <div className="account-card-list">
            <div className="account-info-card">
              <div className="account-info-icon" aria-hidden="true">
                <UserRound size={18} />
              </div>
              <div>
                <strong>{getDisplayName(auth.user)}</strong>
                <p>{auth.user?.email || 'Tu sesión ya quedó vinculada a Cognito.'}</p>
              </div>
            </div>

            <div className="account-meta-grid">
              <div className="account-meta-item">
                <span>Proveedor</span>
                <strong>{getProviderLabel(auth.user?.lastAuthProvider)}</strong>
              </div>
              <div className="account-meta-item">
                <span>Alta</span>
                <strong>{formatDateLabel(auth.user?.createdAt)}</strong>
              </div>
              <div className="account-meta-item">
                <span>Último acceso</span>
                <strong>{formatDateLabel(auth.user?.lastLoginAt || auth.user?.updatedAt)}</strong>
              </div>
            </div>

            <button type="button" className="btn ghost account-signout-button" onClick={signOut}>
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </article>

        <article className="dashboard-panel dashboard-promo-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="eyebrow">Suscripción</p>
              <h2>{hasProAccess ? 'Tu acceso Pro' : 'Activa Pro con código'}</h2>
            </div>
          </div>

          {hasProAccess ? (
            <div className="account-card-list">
              {proEntries.map((entry) => (
                <div key={entry.key} className="account-pro-card">
                  <div className="account-pro-head">
                    <span className="tag">{entry.label}</span>
                    <BadgeCheck size={18} aria-hidden="true" />
                  </div>
                  <strong>{entry.plan}</strong>
                  <p>{entry.expiresAt ? `Expira ${formatDateLabel(entry.expiresAt)}` : 'Acceso activo en tu cuenta.'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <strong>Aún no vemos Pro en esta cuenta.</strong>
              <p>
                Si ya lo activaste en la app, entra con el mismo usuario. Si tienes un código privado,
                puedes aplicarlo aquí.
              </p>
            </div>
          )}

          <form className="dashboard-promo-form" onSubmit={handleRedeemPromoCode}>
            <label className="dashboard-promo-field">
              <span>Tengo un código</span>
              <input
                value={promoCode}
                onChange={(event) => {
                  setPromoCode(event.target.value)
                }}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={isRedeemingPromo}
              />
            </label>

            <div className="dashboard-promo-actions">
              <button type="submit" className="btn primary" disabled={isRedeemingPromo}>
                {isRedeemingPromo ? 'Validando…' : 'Aplicar código'}
              </button>
            </div>
          </form>

          {promoFeedback ? (
            <div
              className={`dashboard-feedback ${
                promoFeedback.tone === 'success'
                  ? 'dashboard-feedback-success'
                  : 'dashboard-feedback-error'
              }`}
            >
              <p>{promoFeedback.message}</p>
            </div>
          ) : null}
        </article>
      </section>

      <section className="account-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="eyebrow">Soporte</p>
              <h2>Ayuda y legal</h2>
            </div>
          </div>

          <div className="account-card-list">
            <a className="account-link-card" href={`mailto:${supportEmail}`}>
              <div className="account-link-copy">
                <div className="account-info-icon" aria-hidden="true">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong>Contacto</strong>
                  <p>{supportEmail}</p>
                </div>
              </div>
              <ExternalLink size={16} aria-hidden="true" />
            </a>

            <a className="account-link-card" href={buildHomeSectionHref('terminos')}>
              <div className="account-link-copy">
                <div className="account-info-icon" aria-hidden="true">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong>Términos y condiciones</strong>
                  <p>Consulta las condiciones vigentes del servicio.</p>
                </div>
              </div>
              <ExternalLink size={16} aria-hidden="true" />
            </a>

            <a className="account-link-card" href={buildHomeSectionHref('privacidad')}>
              <div className="account-link-copy">
                <div className="account-info-icon" aria-hidden="true">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong>Política de privacidad</strong>
                  <p>Revisa cómo tratamos tus datos y transcripciones.</p>
                </div>
              </div>
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="eyebrow">Navegación</p>
              <h2>Accesos rápidos</h2>
            </div>
          </div>

          <div className="account-shortcuts">
            <Link to={appPaths.dashboard} className="account-shortcut-card">
              <div className="account-info-icon" aria-hidden="true">
                <Sparkles size={18} />
              </div>
              <div>
                <strong>Resumen</strong>
                <p>Consulta actividad reciente y progreso global.</p>
              </div>
            </Link>

            <Link to={appPaths.vocabulary} className="account-shortcut-card">
              <div className="account-info-icon" aria-hidden="true">
                <BookOpenText size={18} />
              </div>
              <div>
                <strong>Vocabulario</strong>
                <p>Retoma cards pendientes y practica las que están en progreso.</p>
              </div>
            </Link>

            <Link to={appPaths.stories} className="account-shortcut-card">
              <div className="account-info-icon" aria-hidden="true">
                <Sparkles size={18} />
              </div>
              <div>
                <strong>Historias</strong>
                <p>Vuelve a tus missions y recupera el hilo desde tu último avance.</p>
              </div>
            </Link>
          </div>
        </article>
      </section>
    </div>
  )
}

function buildProEntries(user?: AuthUser): ProEntry[] {
  const entries: ProEntry[] = []
  const access = user?.proAccess

  if (access?.subscription?.isActive) {
    entries.push({
      key: 'subscription',
      label: 'Suscripción',
      plan: access.subscription.productId || 'Suscripción activa',
      expiresAt: access.subscription.expiresAt,
    })
  }

  if (access?.code?.isActive) {
    entries.push({
      key: 'code',
      label: 'Código',
      plan: 'Código promocional activo',
      expiresAt: access.code.expiresAt,
    })
  }

  if (!entries.length && user?.isPro) {
    entries.push({
      key: 'pro',
      label: 'Cuenta Pro',
      plan: 'Acceso premium activo',
      expiresAt: access?.updatedAt,
    })
  }

  return entries
}

function formatDateLabel(value?: string) {
  if (!value) {
    return 'Sin registro'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Sin registro'
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getProviderLabel(provider?: string) {
  const normalized = provider?.trim().toLowerCase()

  if (normalized === 'google') {
    return 'Google'
  }

  if (normalized === 'email') {
    return 'Correo y contraseña'
  }

  return provider || 'No disponible'
}
