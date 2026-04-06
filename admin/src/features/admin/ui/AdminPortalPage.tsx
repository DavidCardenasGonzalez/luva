import { AdminLayout } from '@/features/admin/ui/AdminLayout'
import { getDisplayName } from '@/features/auth/model/get-display-name'
import { useAuthSession } from '@/features/auth/model/use-auth-session'
import { useAdminOverview } from '@/features/admin/model/use-admin-overview'
import type { AdminModuleSummary } from '@/features/admin/model/types'

const FALLBACK_MODULES: AdminModuleSummary[] = [
  {
    id: 'dashboard',
    label: 'Dashboard base',
    description: 'Portal separado de la web, fondo claro y conexión a la lambda administrativa.',
    status: 'ready',
  },
  {
    id: 'users',
    label: 'Gestión de usuarios',
    description: 'Pantalla administrativa ya disponible para revisar cuentas, progreso y acceso Pro.',
    status: 'ready',
  },
  {
    id: 'content',
    label: 'Contenido y catálogos',
    description: 'Espacio para editar historias, vocabulario y assets sin tocar la web pública.',
    status: 'planned',
  },
]

function formatDateTime(value?: string) {
  if (!value) {
    return 'Sin sincronizar'
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

export function AdminPortalPage() {
  const { auth } = useAuthSession()
  const { data, error, isLoading, reload } = useAdminOverview()
  const modules = data?.modules?.length ? data.modules : FALLBACK_MODULES
  const statusTitle = data ? 'Lambda activa' : isLoading ? 'Conectando' : 'Pendiente'
  const statusCopy = data
    ? `La ruta ${data.portal.routePrefix} ya responde desde su propia lambda y exige sesión admin.`
    : error || 'Todavía no hay respuesta del backend administrativo.'

  return (
    <AdminLayout
      title={getDisplayName(auth.user)}
      description="Base del portal administrativo separada de la web pública, con backend propio, validación por rol admin y módulos internos listos para crecer."
      actions={
        <button type="button" className="btn secondary" onClick={reload} disabled={isLoading}>
          {isLoading ? 'Consultando...' : 'Recargar estado'}
        </button>
      }
    >
        <section className="admin-hero">
          <div className="admin-hero-copy">
            <p className="eyebrow">Portal administrativo separado</p>
            <h2>Interfaz blanca, estructura limpia y backend propio para operaciones admin.</h2>
            <p className="lede">
              El objetivo de esta base es diferenciar visualmente el admin del sitio web principal
              y dejar lista la separación por capas: frontend admin, cliente API propio y lambda
              exclusiva protegida por Cognito + rol <code>admin</code>.
            </p>

            <div className="admin-badges">
              <span className="tag">Fondo claro</span>
              <span className="tag">Ruta /v1/admin</span>
              <span className="tag">Claim admin obligatorio</span>
            </div>
          </div>

          <aside className="admin-status-card">
            <span className="admin-status-label">Estado del backend</span>
            <strong>{statusTitle}</strong>
            <p>{statusCopy}</p>

            <div className="admin-status-grid">
              <div className="admin-status-item">
                <span className="tag">Lambda</span>
                <p>{data?.portal.lambda || 'AdminFunction'}</p>
              </div>
              <div className="admin-status-item">
                <span className="tag">Protección</span>
                <p>{data?.portal.protection || 'Cognito + rol admin'}</p>
              </div>
              <div className="admin-status-item">
                <span className="tag">Stage</span>
                <p>{data?.portal.stage || 'Sin datos'}</p>
              </div>
              <div className="admin-status-item">
                <span className="tag">Actualizado</span>
                <p>{formatDateTime(data?.generatedAt)}</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="admin-stat-grid">
          <article className="admin-stat-card">
            <span className="eyebrow">Cuenta</span>
            <strong>{auth.user?.email || 'Usuario autenticado'}</strong>
            <p>Sesión actual usada para autenticar el portal y firmar requests a la API admin.</p>
          </article>
          <article className="admin-stat-card">
            <span className="eyebrow">Roles</span>
            <strong>{auth.user?.roles?.join(', ') || 'Sin roles detectados'}</strong>
            <p>La UI y la lambda validan el claim para evitar depender solo del frontend.</p>
          </article>
          <article className="admin-stat-card">
            <span className="eyebrow">Proveedor</span>
            <strong>{auth.user?.lastAuthProvider || 'email'}</strong>
            <p>El mismo Hosted UI de Cognito sigue sirviendo para Google o correo.</p>
          </article>
          <article className="admin-stat-card">
            <span className="eyebrow">Permisos</span>
            <strong>{data?.permissions.matchedRoles.join(', ') || 'admin'}</strong>
            <p>Si el token no trae el grupo correcto, el backend devuelve 403.</p>
          </article>
        </section>

        {error && (
          <section className="admin-inline-alert">
            <p>{error}</p>
          </section>
        )}

        <section className="admin-content-grid">
          <article className="admin-panel">
            <div className="admin-panel-head">
              <p className="eyebrow">Base técnica</p>
              <h3>Estructura inicial por dominios</h3>
            </div>
            <div className="admin-stack-grid">
              <div className="admin-stack-card">
                <span className="tag">Frontend</span>
                <h4><code>features/admin</code></h4>
                <p>La vista, los tipos, el hook y el cliente de overview viven separados del auth.</p>
              </div>
              <div className="admin-stack-card">
                <span className="tag">Shared</span>
                <h4><code>shared/api</code></h4>
                <p>El portal ya tiene un cliente HTTP propio que lee la sesión admin y firma requests.</p>
              </div>
              <div className="admin-stack-card">
                <span className="tag">Backend</span>
                <h4><code>handlers/admin.ts</code></h4>
                <p>La lambda administrativa queda desacoplada de `users` y del handler público.</p>
              </div>
              <div className="admin-stack-card">
                <span className="tag">Infra</span>
                <h4><code>/v1/admin</code></h4>
                <p>API Gateway enruta el dominio admin a un recurso dedicado con Cognito authorizer.</p>
              </div>
            </div>
          </article>

          <article className="admin-panel">
            <div className="admin-panel-head">
              <p className="eyebrow">Backend admin</p>
              <h3>Respuesta de la lambda</h3>
            </div>
            <div className="admin-session-list">
              <div className="admin-session-item">
                <span>Portal</span>
                <strong>{data?.portal.name || 'Luva Admin'}</strong>
              </div>
              <div className="admin-session-item">
                <span>Ruta</span>
                <strong>{data?.portal.routePrefix || '/v1/admin'}</strong>
              </div>
              <div className="admin-session-item">
                <span>Protección</span>
                <strong>{data?.portal.protection || 'Cognito + claim admin'}</strong>
              </div>
              <div className="admin-session-item">
                <span>Sincronización</span>
                <strong>{formatDateTime(data?.generatedAt)}</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Roadmap inicial</p>
            <h3>Módulos para crecer sin mezclar el admin con la web</h3>
          </div>
          <div className="admin-module-grid">
            {modules.map((module) => (
              <article key={module.id} className="admin-module-card">
                <span className={`admin-module-status admin-module-status-${module.status}`}>
                  {module.status === 'ready' ? 'Listo' : 'Planeado'}
                </span>
                <h4>{module.label}</h4>
                <p>{module.description}</p>
              </article>
            ))}
          </div>
        </section>
    </AdminLayout>
  )
}
