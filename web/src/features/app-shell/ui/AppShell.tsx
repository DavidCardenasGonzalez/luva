import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BookOpenText, House, Menu, Sparkles, UserRound, X } from 'lucide-react'
import { appPaths } from '@/app/router/paths'
import { useAuthSession } from '@/features/auth/model/use-auth-session'
import { getDisplayName } from '@/features/auth/model/get-display-name'
import { luvaLogo } from '@/shared/assets/brand'

const navItems = [
  {
    to: appPaths.dashboard,
    icon: House,
    label: 'Resumen',
    end: true,
  },
  {
    to: appPaths.vocabulary,
    icon: BookOpenText,
    label: 'Vocabulario',
    end: false,
  },
  {
    to: appPaths.stories,
    icon: Sparkles,
    label: 'Historias',
    end: false,
  },
  {
    to: appPaths.account,
    icon: UserRound,
    label: 'Mi cuenta',
    end: false,
  },
]

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { auth, signOut } = useAuthSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const userLabel = getDisplayName(auth.user)

  return (
    <div className="app-shell">
      <aside className="app-shell-sidebar">
        <button
          type="button"
          className="brand brand-button app-shell-brand"
          onClick={() => {
            navigate(appPaths.dashboard)
          }}
          aria-label="Abrir dashboard"
        >
          <img src={luvaLogo} alt="Luva" />
          <span>Web App</span>
        </button>

        <nav className="app-shell-nav" aria-label="Navegación principal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `app-shell-nav-link${isActive ? ' app-shell-nav-link-active' : ''}`
              }
            >
              <span className="app-shell-nav-icon" aria-hidden="true">
                <item.icon size={18} strokeWidth={2.2} />
              </span>
              <strong className="app-shell-nav-label">{item.label}</strong>
            </NavLink>
          ))}
        </nav>

        <div className="app-shell-sidebar-footer">
          <div className="app-shell-account-card">
           Bienvenido:
            <strong>{getDisplayName(auth.user)}</strong>
            <p>{auth.user?.email || 'Usuario autenticado'}</p>
                      <button type="button" className="btn app-shell-signout-button" onClick={signOut}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <div className="app-shell-content">
        <header className="app-shell-topbar">
          <div className="app-shell-topbar-main">
            <button
              type="button"
              className="brand brand-button app-shell-brand"
              onClick={() => {
                navigate(appPaths.dashboard)
              }}
              aria-label="Abrir dashboard"
            >
              <img src={luvaLogo} alt="Luva" />
              <span>Web App</span>
            </button>

            <nav className="app-shell-topbar-nav" aria-label="Navegación principal">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `app-shell-nav-link app-shell-topbar-link${isActive ? ' app-shell-nav-link-active' : ''}`
                  }
                >
                  <span className="app-shell-nav-icon" aria-hidden="true">
                    <item.icon size={18} strokeWidth={2.2} />
                  </span>
                  <strong className="app-shell-nav-label">{item.label}</strong>
                </NavLink>
              ))}
            </nav>

            <div className="app-shell-topbar-actions">
              {/* <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  navigate(appPaths.home)
                }}
              >
                Sitio público
              </button> */}
              <button
                type="button"
                className="btn app-shell-signout-button"
                onClick={signOut}
              >
                Cerrar sesión
              </button>
            </div>

            <button
              type="button"
              className="app-shell-menu-toggle"
              aria-expanded={isMobileMenuOpen}
              aria-controls="app-shell-mobile-panel"
              onClick={() => {
                setIsMobileMenuOpen((current) => !current)
              }}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              <span>Menú</span>
            </button>
          </div>

          <div
            id="app-shell-mobile-panel"
            className={`app-shell-mobile-panel${isMobileMenuOpen ? ' app-shell-mobile-panel-open' : ''}`}
          >
            <nav className="app-shell-mobile-nav" aria-label="Navegación móvil">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `app-shell-nav-link${isActive ? ' app-shell-nav-link-active' : ''}`
                  }
                >
                  <span className="app-shell-nav-icon" aria-hidden="true">
                    <item.icon size={18} strokeWidth={2.2} />
                  </span>
                  <strong className="app-shell-nav-label">{item.label}</strong>
                </NavLink>
              ))}
            </nav>

            <div className="app-shell-account-card">
              <span className="tag">Cuenta</span>
              <strong>{userLabel}</strong>
              <p>{auth.user?.email || 'Usuario autenticado'}</p>
            </div>

            <div className="app-shell-mobile-actions">
              {/* <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  navigate(appPaths.home)
                }}
              >
                Sitio público
              </button> */}
              <button
                type="button"
                className="btn app-shell-signout-button"
                onClick={signOut}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <main className="app-shell-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
