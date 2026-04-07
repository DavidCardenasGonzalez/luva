import type { PropsWithChildren, ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { getDisplayName } from '@/features/auth/model/get-display-name'
import { useAuthSession } from '@/features/auth/model/use-auth-session'

type AdminLayoutProps = PropsWithChildren<{
  title: string
  description: string
  actions?: ReactNode
}>

const navigationItems = [
  { to: appPaths.home, label: 'Resumen' },
  { to: appPaths.users, label: 'Usuarios' },
  { to: appPaths.videos, label: 'Videos' },
  { to: appPaths.integrationsTikTok, label: 'TikTok' },
]

export function AdminLayout({ title, description, actions, children }: AdminLayoutProps) {
  const { auth, signOut } = useAuthSession()

  return (
    <div className="page admin-page">
      <main className="admin-shell">
        <header className="admin-frame">
          <div className="admin-frame-copy">
            <p className="eyebrow">Luva Admin</p>
            <h1>{title}</h1>
            <p className="lede">{description}</p>
          </div>

          <div className="admin-frame-side">
            <div className="admin-session-card">
              <span className="tag">Sesión admin</span>
              <strong>{getDisplayName(auth.user)}</strong>
              <p>{auth.user?.email || 'Usuario autenticado'}</p>
            </div>

            <div className="admin-topbar-actions">
              {actions}
              <button type="button" className="btn ghost" onClick={signOut}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <nav className="admin-nav" aria-label="Secciones administrativas">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === appPaths.home}
              className={({ isActive }) =>
                isActive ? 'admin-nav-link admin-nav-link-active' : 'admin-nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {children}
      </main>
    </div>
  )
}
