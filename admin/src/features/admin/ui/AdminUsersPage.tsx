import { useDeferredValue, useEffect, useState } from 'react'
import {
  grantManualCodeProAccess,
  revokeManualCodeProAccess,
  verifyRevenueCatUsers,
} from '@/features/admin/api/admin-client'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'
import { useAdminUsers } from '@/features/admin/model/use-admin-users'
import type {
  AdminManualCodeProGrantResponse,
  AdminManualCodeProRevokeResponse,
  AdminRevenueCatVerificationResponse,
  AdminUserSummary,
} from '@/features/admin/model/types'

function formatDateTime(value?: string) {
  if (!value || value.startsWith('1970-01-01')) {
    return 'Sin fecha'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatProvider(provider: AdminUserSummary['provider']) {
  switch (provider) {
    case 'google':
      return 'Google'
    case 'apple':
      return 'Apple'
    case 'email':
      return 'Correo'
    default:
      return 'Otro'
  }
}

function getInitials(user: AdminUserSummary) {
  const parts = user.displayName
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)

  if (!parts.length) {
    return user.email.slice(0, 2).toUpperCase()
  }

  return parts.map((part) => part[0]?.toUpperCase() || '').join('')
}

function getProLabel(user: AdminUserSummary) {
  if (!user.isPro) {
    return 'Free'
  }

  if (user.proAccess.source === 'subscription') {
    return 'Pro por suscripción'
  }

  if (user.proAccess.source === 'code') {
    return 'Pro por código'
  }

  if (user.proAccess.source === 'multiple') {
    return 'Pro por múltiples fuentes'
  }

  return 'Pro'
}

function getProBadgeLabel(user: AdminUserSummary) {
  return user.isPro ? 'Pro' : 'No Pro'
}

function buildRevenueCatSummary(result: AdminRevenueCatVerificationResponse) {
  const { summary } = result
  const parts = [
    `Verificamos ${summary.verifiedUsers} usuarios con RevenueCat.`,
    `${summary.updatedUsers} registros cambiaron de estado.`,
  ]

  if (summary.deactivatedUsers > 0) {
    parts.push(`${summary.deactivatedUsers} usuarios quedaron sin acceso Pro activo.`)
  }

  if (summary.reactivatedUsers > 0) {
    parts.push(`${summary.reactivatedUsers} usuarios recuperaron acceso Pro.`)
  }

  if (summary.skippedMissingAppUserId > 0) {
    parts.push(
      `${summary.skippedMissingAppUserId} usuarios se omitieron porque todavía no tienen appUserId de RevenueCat guardado.`,
    )
  }

  if (summary.errors > 0) {
    parts.push(`${summary.errors} usuarios fallaron al consultar RevenueCat.`)
  }

  return parts.join(' ')
}

function formatVerificationReason(reason?: string) {
  if (!reason) {
    return 'No pudimos completar la verificación.'
  }

  if (reason === 'missing_app_user_id') {
    return 'Falta appUserId de RevenueCat en el usuario.'
  }

  if (reason.startsWith('revenuecat_http_')) {
    return `RevenueCat respondió ${reason.replace('revenuecat_http_', 'HTTP ')}.`
  }

  return reason
}

function canRevokeManualCodeAccess(user: AdminUserSummary) {
  return user.proAccess.source === 'code' || user.proAccess.source === 'multiple'
}

function buildManualGrantSummary(result: AdminManualCodeProGrantResponse) {
  const parts = [
    `Otorgamos ${result.premiumDays} días de membresía por código.`,
    `Ahora vence el ${formatDateTime(result.expiresAt)}.`,
  ]

  if (result.source === 'multiple') {
    parts.push('El usuario conserva además otra fuente de acceso Pro activa.')
  }

  return parts.join(' ')
}

function buildManualRevokeSummary(result: AdminManualCodeProRevokeResponse) {
  const parts = ['Revocamos la membresía manual por código.']

  if (result.source === 'subscription') {
    parts.push('El usuario sigue siendo Pro porque mantiene una suscripción activa.')
  } else {
    parts.push('El usuario quedó sin acceso Pro activo.')
  }

  return parts.join(' ')
}

export function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState('')
  const deferredSearch = useDeferredValue(searchInput.trim())
  const { data, error, isLoading, reload } = useAdminUsers(deferredSearch)
  const [selectedEmail, setSelectedEmail] = useState<string>()
  const [isVerifyingRevenueCat, setIsVerifyingRevenueCat] = useState(false)
  const [verificationError, setVerificationError] = useState<string>()
  const [verificationResult, setVerificationResult] = useState<AdminRevenueCatVerificationResponse>()
  const [grantDaysInput, setGrantDaysInput] = useState('30')
  const [isUpdatingManualPro, setIsUpdatingManualPro] = useState(false)
  const [manualActionError, setManualActionError] = useState<string>()
  const [grantResult, setGrantResult] = useState<AdminManualCodeProGrantResponse>()
  const [revokeResult, setRevokeResult] = useState<AdminManualCodeProRevokeResponse>()

  useEffect(() => {
    if (!data?.users.length) {
      setSelectedEmail(undefined)
      return
    }

    if (!selectedEmail || !data.users.some((user) => user.email === selectedEmail)) {
      setSelectedEmail(data.users[0].email)
    }
  }, [data?.users, selectedEmail])

  useEffect(() => {
    setManualActionError(undefined)
    setGrantResult(undefined)
    setRevokeResult(undefined)
  }, [selectedEmail])

  const selectedUser = data?.users.find((user) => user.email === selectedEmail)
  const verificationIssues =
    verificationResult?.users
      .filter((item) => item.status !== 'verified')
      .slice(0, 3) || []

  const handleVerifyRevenueCat = async () => {
    setIsVerifyingRevenueCat(true)
    setVerificationError(undefined)

    try {
      const result = await verifyRevenueCatUsers()
      setVerificationResult(result)
      reload()
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : 'No pudimos verificar las suscripciones activas con RevenueCat.',
      )
    } finally {
      setIsVerifyingRevenueCat(false)
    }
  }

  const handleGrantPro = async () => {
    if (!selectedUser) {
      return
    }

    const premiumDays = Number(grantDaysInput)
    if (!Number.isFinite(premiumDays) || premiumDays <= 0) {
      setManualActionError('Indica una cantidad válida de días.')
      return
    }

    setIsUpdatingManualPro(true)
    setManualActionError(undefined)
    setRevokeResult(undefined)

    try {
      const result = await grantManualCodeProAccess(selectedUser.email, premiumDays)
      setGrantResult(result)
      reload()
    } catch (error) {
      setManualActionError(
        error instanceof Error
          ? error.message
          : 'No pudimos otorgar la membresía Pro por código.',
      )
    } finally {
      setIsUpdatingManualPro(false)
    }
  }

  const handleRevokePro = async () => {
    if (!selectedUser) {
      return
    }

    setIsUpdatingManualPro(true)
    setManualActionError(undefined)
    setGrantResult(undefined)

    try {
      const result = await revokeManualCodeProAccess(selectedUser.email)
      setRevokeResult(result)
      reload()
    } catch (error) {
      setManualActionError(
        error instanceof Error
          ? error.message
          : 'No pudimos revocar la membresía manual por código.',
      )
    } finally {
      setIsUpdatingManualPro(false)
    }
  }

  return (
    <AdminLayout
      title="Usuarios"
      description="Consulta el estado de las cuentas, su proveedor de acceso, progreso y nivel de acceso Pro desde el portal administrativo."
      actions={
        <>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              void handleVerifyRevenueCat()
            }}
            disabled={isVerifyingRevenueCat}
          >
            {isVerifyingRevenueCat ? 'Verificando RevenueCat...' : 'Validar premium con RevenueCat'}
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={reload}
            disabled={isLoading || isVerifyingRevenueCat || isUpdatingManualPro}
          >
            {isLoading ? 'Actualizando...' : 'Recargar usuarios'}
          </button>
        </>
      }
    >
      <section className="admin-user-summary-grid">
        <article className="admin-stat-card">
          <span className="eyebrow">Usuarios</span>
          <strong>{data?.stats.totalUsers || 0}</strong>
          <p>Total de cuentas sincronizadas en la tabla administrativa.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Pro</span>
          <strong>{data?.stats.proUsers || 0}</strong>
          <p>Usuarios con acceso Pro activo por suscripción, código o múltiples fuentes.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Verificados</span>
          <strong>{data?.stats.verifiedUsers || 0}</strong>
          <p>Cuentas con correo verificado según el último claim sincronizado.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Activos hoy</span>
          <strong>{data?.stats.activeToday || 0}</strong>
          <p>Usuarios con `lastLoginAt` dentro del día actual del servidor.</p>
        </article>
      </section>

      <section className="admin-users-toolbar">
        <label className="admin-search-field">
          <span className="eyebrow">Buscar</span>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value)
            }}
            placeholder="correo, nombre, proveedor..."
          />
        </label>

        <div className="admin-users-toolbar-meta">
          <span className="tag">{isLoading ? 'Sincronizando...' : `${data?.users.length || 0} resultados`}</span>
          <span className="tag">Google {data?.stats.providers.google || 0}</span>
          <span className="tag">Correo {data?.stats.providers.email || 0}</span>
          <span className="tag">Apple {data?.stats.providers.apple || 0}</span>
        </div>
      </section>

      {error && (
        <section className="admin-inline-alert">
          <p>{error}</p>
        </section>
      )}

      {verificationError && (
        <section className="admin-inline-alert">
          <p>{verificationError}</p>
        </section>
      )}

      {verificationResult && (
        <section className="admin-inline-note admin-inline-note-success">
          <div className="admin-inline-note-head">
            <span className="tag">RevenueCat</span>
            <span className="tag">{formatDateTime(verificationResult.checkedAt)}</span>
          </div>
          <p>{buildRevenueCatSummary(verificationResult)}</p>
          {verificationIssues.length > 0 && (
            <div className="admin-inline-note-detail">
              {verificationIssues.map((item) => (
                <p key={`${item.email}-${item.status}`}>
                  <strong>{item.email}</strong>: {formatVerificationReason(item.reason)}
                </p>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="admin-users-grid">
        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Listado</p>
            <h3>Cuentas disponibles</h3>
          </div>

          <div className="admin-users-list" role="list">
            {data?.users.length ? (
              data.users.map((user) => {
                const isSelected = user.email === selectedEmail

                return (
                  <button
                    key={user.email}
                    type="button"
                    className={isSelected ? 'admin-user-row admin-user-row-active' : 'admin-user-row'}
                    onClick={() => {
                      setSelectedEmail(user.email)
                    }}
                  >
                    <div className="admin-user-row-main">
                      <span className="admin-user-avatar">{getInitials(user)}</span>
                      <div className="admin-user-row-copy">
                        <strong>{user.displayName}</strong>
                        <p>{user.email}</p>
                      </div>
                    </div>

                    <div className="admin-user-row-meta">
                      <span className="tag">{getProLabel(user)}</span>
                      <span className="tag">{formatProvider(user.provider)}</span>
                      <span className="admin-user-row-time">
                        Último acceso {formatDateTime(user.lastLoginAt)}
                      </span>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="admin-empty-state">
                <strong>No encontramos usuarios.</strong>
                <p>Prueba limpiando la búsqueda o espera a que existan cuentas sincronizadas.</p>
              </div>
            )}
          </div>
        </article>

        <aside className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Detalle</p>
            <h3>{selectedUser?.displayName || 'Selecciona un usuario'}</h3>
          </div>

          {selectedUser ? (
            <div className="admin-user-detail">
              <div className="admin-user-detail-header">
                <span className="admin-user-avatar admin-user-avatar-large">
                  {getInitials(selectedUser)}
                </span>
                <div>
                  <strong>{selectedUser.displayName}</strong>
                  <p>{selectedUser.email}</p>
                </div>
              </div>

              <div className="admin-session-list">
                <div className="admin-session-item">
                  <span>Proveedor</span>
                  <strong>{formatProvider(selectedUser.provider)}</strong>
                </div>
                <div className="admin-session-item">
                  <span>Estado</span>
                  <strong>{selectedUser.status}</strong>
                </div>
                <div className="admin-session-item">
                  <span>Verificación</span>
                  <strong>{selectedUser.emailVerified ? 'Correo verificado' : 'Pendiente'}</strong>
                </div>
                <div className="admin-session-item">
                  <span>Acceso Pro</span>
                  <strong>{getProLabel(selectedUser)}</strong>
                </div>
                <div className="admin-session-item admin-session-item-highlight">
                  <span>Última sync</span>
                  <div className="admin-sync-status">
                    <strong>{formatDateTime(selectedUser.updatedAt)}</strong>
                    <span
                      className={
                        selectedUser.isPro
                          ? 'admin-pro-badge admin-pro-badge-active'
                          : 'admin-pro-badge admin-pro-badge-inactive'
                      }
                    >
                      {getProBadgeLabel(selectedUser)}
                    </span>
                  </div>
                </div>
                <div className="admin-session-item">
                  <span>Creado</span>
                  <strong>{formatDateTime(selectedUser.createdAt)}</strong>
                </div>
                <div className="admin-session-item">
                  <span>Último login</span>
                  <strong>{formatDateTime(selectedUser.lastLoginAt)}</strong>
                </div>
              </div>

              <div className="admin-user-action-card">
                <div className="admin-panel-head">
                  <p className="eyebrow">Acceso manual</p>
                  <h3>Gestionar Pro manual</h3>
                </div>
                <div className="admin-user-action-meta">
                  <span className="tag">Estado actual: {getProLabel(selectedUser)}</span>
                  <span className="tag">
                    Vence: {formatDateTime(selectedUser.proAccess.expiresAt)}
                  </span>
                </div>

                {!selectedUser.isPro ? (
                  <>
                    <p className="admin-user-action-copy">
                      Este cambio se guarda como acceso Pro por código.
                    </p>
                    <div className="admin-grant-form">
                      <label className="admin-grant-field">
                        <span className="eyebrow">Días Pro</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={grantDaysInput}
                          onChange={(event) => {
                            setGrantDaysInput(event.target.value)
                          }}
                          placeholder="30"
                          inputMode="numeric"
                        />
                      </label>
                      <button
                        type="button"
                        className="btn primary"
                        onClick={() => {
                          void handleGrantPro()
                        }}
                        disabled={isUpdatingManualPro}
                      >
                        {isUpdatingManualPro ? 'Aplicando Pro...' : 'Hacer Pro por días'}
                      </button>
                    </div>
                  </>
                ) : canRevokeManualCodeAccess(selectedUser) ? (
                  <>
                    <p className="admin-user-action-copy">
                      Esto revoca el acceso manual por código. Si el usuario también tiene una
                      suscripción activa, seguirá siendo Pro por esa otra fuente.
                    </p>
                    <div className="admin-action-row">
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => {
                          void handleRevokePro()
                        }}
                        disabled={isUpdatingManualPro}
                      >
                        {isUpdatingManualPro ? 'Revocando...' : 'Revocar membresía por código'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="admin-inline-note">
                    <span className="tag">Solo lectura</span>
                    <p>
                      Este usuario es Pro por suscripción. Esa membresía no se revoca desde el
                      portal porque RevenueCat y la tienda la volverían a marcar como activa.
                    </p>
                  </div>
                )}

                {manualActionError && (
                  <div className="admin-inline-alert admin-inline-alert-compact">
                    <p>{manualActionError}</p>
                  </div>
                )}

                {grantResult && (
                  <div className="admin-inline-note admin-inline-note-success">
                    <span className="tag">Grant aplicado</span>
                    <p>{buildManualGrantSummary(grantResult)}</p>
                  </div>
                )}

                {revokeResult && (
                  <div className="admin-inline-note admin-inline-note-success">
                    <span className="tag">Membresía revocada</span>
                    <p>{buildManualRevokeSummary(revokeResult)}</p>
                  </div>
                )}
              </div>

              <div className="admin-user-progress-grid">
                <div className="admin-stack-card">
                  <span className="tag">Vocabulario</span>
                  <h4>{selectedUser.progress.cardsLearned}/{selectedUser.progress.cardsTotal}</h4>
                  <p>
                    {selectedUser.progress.cardsLearning} tarjetas siguen en aprendizaje activo.
                  </p>
                </div>
                <div className="admin-stack-card">
                  <span className="tag">Historias</span>
                  <h4>{selectedUser.progress.storiesCompleted}/{selectedUser.progress.storiesStarted}</h4>
                  <p>Historias completadas frente a historias iniciadas.</p>
                </div>
              </div>

              <div className="admin-inline-note">
                <span className="tag">Última sincronización</span>
                <p>{formatDateTime(selectedUser.progress.updatedAt || selectedUser.updatedAt)}</p>
              </div>
            </div>
          ) : (
            <div className="admin-empty-state admin-empty-state-compact">
              <strong>Sin selección.</strong>
              <p>Elige un usuario de la lista para ver su detalle y progreso.</p>
            </div>
          )}
        </aside>
      </section>
    </AdminLayout>
  )
}
