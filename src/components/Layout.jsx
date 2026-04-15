import { useEffect, useState, useRef, useCallback } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axiosInstance'
import styles from './Layout.module.css'

/**
 * REUSABLE NAVIGATION ITEM
 * Classes: nav-item, nav-item--active, nav-item--highlight (mapped from styles)
 */
const NavItem = ({ icon, label, to, badge, highlight, onClick }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        styles.navItem,
        isActive ? styles.navItemActive : '',
        highlight ? styles.navItemHighlight : '',
      ]
        .filter(Boolean)
        .join(' ')
    }
    onClick={onClick}
  >
    <span className={styles.navIcon}>{icon}</span>
    <span className={styles.navLabel}>{label}</span>
    {badge > 0 && (
      <span className={styles.navItemBadge}>{badge}</span>
    )}
  </NavLink>
)

/**
 * MENU BUILDER BY ROLE
 */
function buildMenu(role, teamId, userId, unreadCount) {
  const common = [
    { to: '/dashboard',         icon: '🏠', label: 'Dashboard' },
    { to: `/profile/${userId}`, icon: '👤', label: 'Mi Perfil' },
    { to: '/notifications',     icon: '🔔', label: 'Notificaciones', badge: unreadCount },
  ]

  const tournament = [
    { to: '/tournaments/active',            icon: '🏆', label: 'Torneo Activo' },
    { to: '/tournaments/active/statistics', icon: '📊', label: 'Estadísticas' },
  ]

  // --- PLAYER MENU ---
  if (role === 'PLAYER') {
    const menu = [...common]
    if (teamId) {
      menu.push({ to: `/teams/${teamId}`, icon: '👥', label: 'Mi Equipo' })
    }
    menu.push({ to: '/invitations', icon: '📩', label: 'Mis Invitaciones' })
    menu.push(...tournament)
    if (!teamId) {
      menu.push({ to: '/teams/create', icon: '➕', label: 'Crear Equipo', highlight: true })
    }
    return menu
  }

  // --- CAPTAIN MENU ---
  if (role === 'CAPTAIN') {
    return [
      ...common,
      { to: `/teams/${teamId}`,               icon: '👥', label: 'Mi Equipo' },
      { to: `/teams/${teamId}/manage`,        icon: '⚙️', label: 'Gestionar Equipo' },
      { to: `/teams/${teamId}/manage#invite`, icon: '📨', label: 'Invitar Jugadores' },
      { to: `/teams/${teamId}/manage#leave`,  icon: '🚪', label: 'Solicitudes de Salida' },
      { to: `/teams/${teamId}/payment`,       icon: '💳', label: 'Comprobante de Pago' },
      { to: `/teams/${teamId}/lineups`,       icon: '📋', label: 'Alineaciones' },
      ...tournament
    ]
  }

  // --- OTHER ROLES (Fallback) ---
  if (role === 'REFEREE') {
    return [
      ...common,
      { to: '/matches', icon: '🎯', label: 'Mis Partidos' },
      ...tournament
    ]
  }

  if (role === 'ADMINISTRATIVE' || role === 'ADMINISTRATOR') {
    return [
      ...common,
      ...tournament,
      { to: '/settings', icon: '🛠️', label: 'Configuración' },
    ]
  }

  return [...common, ...tournament]
}

export default function Layout() {
  const { user, logout } = useAuth()

  // State
  const [myTeamId, setMyTeamId] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pollRef = useRef(null)

  // 1. FETCH TEAM ID ON MOUNT
  useEffect(() => {
    if (!user?.id) return
    api.get(`/api/users/${user.id}`)
      .then((res) => {
        // Extract teamId from profile
        const tid = res.data.teamId ?? res.data.team?.id ?? null
        setMyTeamId(tid)
      })
      .catch(() => {
        // Silently fail if user not found or other API error
      })
  }, [user?.id])

  // 2. NOTIFICATIONS POLLING (Every 60s)
  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications/unread')
      const data = res.data
      const count = Array.isArray(data) ? data.length : (data?.count ?? data?.total ?? 0)
      setUnreadCount(count)
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    fetchUnread()
    pollRef.current = setInterval(fetchUnread, 60000)
    return () => clearInterval(pollRef.current)
  }, [fetchUnread])

  // Menu generation
  const menu = buildMenu(user?.role, myTeamId, user?.id, unreadCount)

  // UI Helpers
  const initial = (user?.name ?? user?.email ?? 'U')[0].toUpperCase()
  const roleKey = user?.role?.toLowerCase() ?? 'player'

  return (
    <div className={styles.layout}>
      {/* Dynamic override for sidebar background as per requirements */}
      <style>{`
        .${styles.sidebar} { background-color: #1e1e2e !important; }
      `}</style>

      {/* Hamburger button for mobile */}
      <button
        className={styles.hamburger}
        onClick={() => setSidebarOpen(v => !v)}
        aria-label="Abrir menú"
      >
        ☰
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* FIXED SIDEBAR (260px) */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logoSection}>
          <img src="/images/logoFinalFinal.png" alt="TechCupFútbol" className={styles.logoImg} />
          <span className={styles.logoText}>TechCupFútbol</span>
        </div>

        {/* SIDEBAR HEADER: User Info */}
        <div className={styles.sidebarHeader}>
          <div className={styles.avatarCircle}>{initial}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName} title={user?.name ?? user?.email}>
              {user?.name ?? user?.email}
            </span>
            <span className={`${styles.roleBadge} ${styles[`role--${roleKey}`]}`}>
              {user?.role ?? '—'}
            </span>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className={styles.nav}>
          {menu.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* SIDEBAR FOOTER: Logout */}
        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT (margin-left: 260px) */}
      <main className={styles.layoutMain}>
        <Outlet />
      </main>
    </div>
  )
}
