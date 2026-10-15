import { Activity, ClipboardList, FileText, Menu, MessageSquare, Shield, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { canAdmin, canAudit, canChat, useAuth } from '../../auth/AuthContext'
import { Logo } from './Logo'
import { UserCard } from './UserCard'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

/** Dark-sidebar layout used by the Admin and Auditor consoles. */
export function ConsoleLayout() {
  const { session } = useAuth()
  const location = useLocation()
  const [drawer, setDrawer] = useState(false)
  useEffect(() => setDrawer(false), [location.pathname])
  if (!session) return null
  const role = session.role

  const items: NavItem[] = []
  if (canAdmin(role)) {
    items.push({ to: '/admin', label: 'Dasbor Kesehatan', icon: <Activity size={18} />, end: true })
    if (role.canManageDocuments) items.push({ to: '/admin/documents', label: 'Dokumen', icon: <FileText size={18} /> })
    if (role.canManageRoles) items.push({ to: '/admin/roles', label: 'Peran & Izin', icon: <Shield size={18} /> })
  }
  if (canAudit(role)) items.push({ to: '/audit', label: 'Log Audit', icon: <ClipboardList size={18} /> })
  if (canChat(role)) items.push({ to: '/chat', label: 'Kembali ke Chat', icon: <MessageSquare size={18} /> })

  const subtitle = canAdmin(role) ? 'Konsol Admin' : 'Konsol Auditor'

  return (
    <div className="console">
      <header className="mobile-bar">
        <button className="icon-btn icon-btn--inverse" aria-label="Buka menu" onClick={() => setDrawer(true)}>
          <Menu size={20} />
        </button>
        <Logo subtitle={subtitle} />
      </header>
      <aside className={`sidebar ${drawer ? 'is-open' : ''}`} aria-label="Navigasi">
        <div className="sidebar__top">
          <Logo subtitle={subtitle} />
          <button className="icon-btn icon-btn--inverse sidebar__close" aria-label="Tutup menu" onClick={() => setDrawer(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="nav">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}>
              {it.icon}
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__spacer" />
        <UserCard />
      </aside>
      {drawer && <div className="drawer-backdrop" onClick={() => setDrawer(false)} />}
      <main className="console__main">
        <Outlet />
      </main>
    </div>
  )
}

export function PageHeader({ title, subtitle, children, badge }: { title: string; subtitle: string; children?: ReactNode; badge?: ReactNode }) {
  return (
    <div className="page-header">
      <div className="page-header__text">
        <div className="page-header__title">
          <h1 className="h-l">{title}</h1>
          {badge}
        </div>
        <p className="text-muted">{subtitle}</p>
      </div>
      {children && <div className="page-header__actions">{children}</div>}
    </div>
  )
}
