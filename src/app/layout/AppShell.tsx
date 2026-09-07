import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  AlertTriangle,
  BadgeCheck,
  FolderTree,
  LayoutDashboard,
  Menu,
  MessageSquareWarning,
  Package,
  Scale,
  Settings2,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { primaryNavigation } from '@/app/config/navigation'
import { appConfig } from '@/app/config/env'
import { IconButton } from '@/shared/ui'

const iconById: Record<string, ReactNode> = {
  attention: <LayoutDashboard aria-hidden="true" />,
  verification: <BadgeCheck aria-hidden="true" />,
  campaigns: <Package aria-hidden="true" />,
  disputes: <Scale aria-hidden="true" />,
  moderation: <MessageSquareWarning aria-hidden="true" />,
  categories: <FolderTree aria-hidden="true" />,
  'extension-packages': <Settings2 aria-hidden="true" />,
  'featured-packages': <Sparkles aria-hidden="true" />,
  'dispute-categories': <AlertTriangle aria-hidden="true" />,
  account: <UserRound aria-hidden="true" />,
}

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNavOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [navOpen])

  return (
    <div className={['app-shell', navOpen ? 'app-shell--nav-open' : ''].filter(Boolean).join(' ')}>
      <button
        type="button"
        className="app-shell__nav-backdrop"
        aria-label="Close navigation"
        onClick={() => setNavOpen(false)}
      />

      <aside className="app-shell__nav" id="admin-primary-nav" aria-label="Primary">
        <div className="app-shell__brand">
          <div className="app-shell__brand-mark">MarcatursHub</div>
          <div className="app-shell__brand-sub">Operations console</div>
        </div>

        <nav aria-label="Admin modules">
          {primaryNavigation.map((section) => (
            <div key={section.id} style={{ marginBottom: '1rem' }}>
              {section.label ? (
                <div
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.68rem',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--color-nav-muted)',
                    fontWeight: 600,
                  }}
                >
                  {section.label}
                </div>
              ) : null}
              <ul className="app-shell__nav-list">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className="app-shell__nav-link"
                      onClick={() => setNavOpen(false)}
                    >
                      {iconById[item.id] ?? null}
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="app-shell__nav-footer">
          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              color: 'var(--color-nav-muted)',
              padding: '0 0.65rem',
            }}
          >
            Auth and domain modules arrive in later MH-FE tasks.
          </p>
        </div>
      </aside>

      <div className="app-shell__main">
        <header className="app-shell__topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <IconButton
              className="app-shell__menu-button"
              label={navOpen ? 'Close navigation' : 'Open navigation'}
              onClick={() => setNavOpen((value) => !value)}
              aria-expanded={navOpen}
              aria-controls="admin-primary-nav"
            >
              {navOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </IconButton>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {appConfig.appName}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>Phase 1 foundation</div>
            </div>
          </div>
          <div className="app-shell__topbar-meta">
            <span>API target configured</span>
          </div>
        </header>

        <main className="app-shell__content" id="main-content">
          <div className="app-shell__content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
