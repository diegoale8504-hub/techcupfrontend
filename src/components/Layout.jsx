import { useEffect, useState, useRef, useCallback } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axiosInstance'
import styles from './Layout.module.css'

/**
 * REUSABLE NAVIGATION ITEM
 * Classes: nav-item, nav-item--active, nav-item--highlight (mapped from styles)
 */
const NavItem = ({ label, icon, to, badge, highlight, onClick, end, collapsed }) => (
  <NavLink
    to={to}
    end={end}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      [
        styles.navItem,
        isActive ? styles.navItemActive : '',
        highlight ? styles.navItemHighlight : '',
        collapsed ? styles.navItemCollapsed : '',
      ]
        .filter(Boolean)
        .join(' ')
    }
    onClick={onClick}
  >
    <span className={styles.navIcon}>{icon}</span>
    {!collapsed && <span className={styles.navLabel}>{label}</span>}
    {!collapsed && badge > 0 && (
      <span className={styles.navItemBadge}>{badge}</span>
    )}
    {collapsed && badge > 0 && (
      <span className={styles.navItemBadgeDot} />
    )}
  </NavLink>
)

/**
 * MENU BUILDER BY ROLE
 * teamId is used only for specific conditional links.
 */
function buildMenu(role, teamId, userId, unreadCount) {
  const common = [
    { to: '/dashboard',         label: 'Dashboard',       icon: '🏠' },
    { to: `/profile/${userId}`, label: 'Mi Perfil',       icon: '👤' },
    { to: '/notifications',     label: 'Notificaciones',  icon: '🔔', badge: unreadCount },
  ]

  const tournament = [
    { to: '/tournaments/active',            label: 'Torneo Activo', icon: '🏆' },
    { to: '/tournaments/active/statistics', label: 'Estadísticas',  icon: '📊' },
  ]

  const normalizedRole = role?.toUpperCase()

  // --- CAPTAIN MENU ---
  if (normalizedRole === 'CAPTAIN') {
    const menu = [...common]
    const effectiveId = teamId || 'null'
    const teamBase = `/teams/${effectiveId}`

    if (teamId) {
      menu.push(
        { to: `${teamBase}`,         label: 'Mi Equipo',           icon: '⚽', end: true },
        { to: `${teamBase}/manage`,  label: 'Gestionar Equipo',    icon: '⚙️' },
        { to: `${teamBase}/payment`, label: 'Comprobante de Pago', icon: '💳' },
        { to: `${teamBase}/lineups`, label: 'Alineaciones',        icon: '📋' }
      )
    } else {
      menu.push({ to: '/teams/create',      label: 'Crear/Vincular Equipo',       icon: '➕', highlight: true })
      menu.push({ to: '/teams/null/manage', label: 'Gestionar Equipo (Pendiente)', icon: '⚙️' })
    }

    menu.push(...tournament)
    return menu
  }

  // --- PLAYER MENU ---
  else if (normalizedRole === 'PLAYER') {
    const menu = [...common]
    if (teamId) {
      menu.push({ to: `/teams/${teamId}`, label: 'Mi Equipo',       icon: '⚽', end: true })
    }
    menu.push({ to: '/invitations', label: 'Mis Invitaciones', icon: '✉️' })
    menu.push(...tournament)
    if (!teamId) {
      menu.push({ to: '/teams/create', label: 'Crear Equipo', icon: '➕', highlight: true })
    }
    return menu
  }

  // --- OTHER ROLES ---
  else if (normalizedRole === 'REFEREE') {
    return [
      ...common,
      { to: '/matches', label: 'Mis Partidos', icon: '🎮' },
      ...tournament
    ]
  }

  else if (normalizedRole === 'ORGANIZER') {
    return [
      { to: '/dashboard',             label: 'Dashboard',    icon: '🏠' },
      { to: '/notifications',         label: 'Notificaciones', icon: '🔔', badge: unreadCount },
      { to: '/organizer/users',       label: 'Usuarios',     icon: '👥' },
      { to: '/organizer/teams',       label: 'Equipos',      icon: '⚽' },
      { to: '/organizer/tournaments', label: 'Torneos',      icon: '🏆' },
      { to: '/organizer/payments',    label: 'Pagos',        icon: '💰' },
      { to: '/organizer/referees',    label: 'Árbitros',     icon: '🟡' },
    ]
  }

  else if (normalizedRole === 'ADMINISTRATIVE' || normalizedRole === 'ADMINISTRATOR') {
    return [
      ...common,
      ...tournament,
      { to: '/settings', label: 'Configuración', icon: '⚙️' },
    ]
  }

  return [...common, ...tournament]
}

export default function Layout() {
  const { user, logout, updateUser } = useAuth()

  // State
  const [myTeamId, setMyTeamId] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar_collapsed') === 'true'
  )
  const pollRef = useRef(null)

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      localStorage.setItem('sidebar_collapsed', String(!prev))
      return !prev
    })
  }

  // Debugging
  useEffect(() => {
    console.log('ROLE:', user?.role);
    console.log('TEAM ID (local):', myTeamId, '| user.teamId:', user?.teamId);
  }, [user?.role, myTeamId, user?.teamId])

  // 1. RESOLVE team info + SYNC ROLE from backend
  useEffect(() => {
    if (!user?.id) return

    console.log('[Layout] Resolving team info for user:', user.id)

    // A. FETCH USER PROFILE (Updated: backend now includes teamId in UserResponse)
    api.get(`/api/users/${user.id}`)
      .then((res) => {
        const profile = res.data
        const foundTeamId = profile.teamId || profile.team?.id

        if (foundTeamId) {
          console.log('[Layout] Found teamId in profile:', foundTeamId)
          setMyTeamId(foundTeamId)
          if (user.teamId !== foundTeamId) {
            updateUser({ teamId: foundTeamId })
          }
        } else {
          // El perfil no tiene equipo — limpiar estado local si quedó sucio
          console.log('[Layout] Profile has no teamId — clearing local team state')
          setMyTeamId(null)
          if (user.teamId) updateUser({ teamId: null })
        }
      })
      .catch((err) => {
        console.error('[Layout] Profile fetch failed:', err.message)
      })

    // B. FETCH MY TEAM (New endpoint: returns details of the team the user belongs to)
    api.get('/api/teams/my-team')
      .then((res) => {
        const myTeam = res.data
        if (myTeam?.id) {
          console.log('[Layout] Found team via /api/teams/my-team:', myTeam.id)
          setMyTeamId(myTeam.id)

          // Auto-promote to CAPTAIN if backend says user is captain of this team
          const captainId = myTeam.captainId ?? myTeam.captain?.id
          if (captainId === user.id && user.role !== 'CAPTAIN') {
            updateUser({ role: 'CAPTAIN', teamId: myTeam.id })
          } else if (user.teamId !== myTeam.id) {
            updateUser({ teamId: myTeam.id })
          }
        }
      })
      .catch((err) => {
        // 404 = usuario sin equipo → limpiar estado
        if (err.response?.status === 404 || err.response?.status === 403) {
          console.log('[Layout] No team found — clearing local team state')
          setMyTeamId(null)
          if (user.teamId) updateUser({ teamId: null })
        } else {
          console.log('[Layout] My-team fetch failed:', err.response?.status)
        }
      })
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 2. NOTIFICATIONS POLLING
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
    pollRef.current = setInterval(fetchUnread, 30000) // Reducido a 30s
    return () => clearInterval(pollRef.current)
  }, [fetchUnread])

  // Prefer API-resolved teamId; fall back to user.teamId so the sidebar
  // re-renders immediately after updateUser({ teamId, role:'CAPTAIN' })
  // without waiting for the /api/equipos resolution on next mount.
  const effectiveTeamId = myTeamId || user?.teamId
  const menu = buildMenu(user?.role, effectiveTeamId, user?.id, unreadCount)

  // UI Helpers
  const initial = (user?.name ?? user?.email ?? 'U')[0].toUpperCase()
  const roleKey = user?.role?.toLowerCase() ?? 'player'

  return (
    <div className={styles.layout}>
      <style>{`
        .${styles.sidebar} { background-color: #1e1e2e !important; }
      `}</style>

      {/* Hamburger button for mobile */}
      <button
        className={styles.hamburger}
        onClick={() => setSidebarOpen(v => !v)}
        aria-label="Abrir menú"
      >
        Menu
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar renders immediately */}
      <aside className={[
        styles.sidebar,
        sidebarOpen  ? styles.sidebarOpen : '',
        collapsed    ? styles.sidebarCollapsed : '',
      ].filter(Boolean).join(' ')}>

        {/* Logo + toggle button */}
        <div className={styles.logoSection}>
          <img src="/images/logoFinalFinal.png" alt="TechCupFútbol" className={styles.logoImg} />
          {!collapsed && <span className={styles.logoText}>TechCupFútbol</span>}
        </div>

        {/* Desktop collapse toggle */}
        <button
          className={styles.collapseBtn}
          onClick={toggleCollapsed}
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {collapsed ? '▶' : '◀'}
        </button>

        {/* User Info Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.avatarCircle}>
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.name} className={styles.avatarImg} />
            ) : (
              initial
            )}
          </div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <span className={styles.userName} title={user?.name ?? user?.email}>
                {user?.name ?? user?.email}
              </span>
              <span className={`${styles.roleBadge} ${styles[`role--${roleKey}`]}`}>
                {user?.role ?? '—'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {menu.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className={`${styles.logoutBtn} ${collapsed ? styles.logoutBtnCollapsed : ''}`}
            onClick={logout}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            {collapsed ? '🚪' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      <main className={`${styles.layoutMain} ${collapsed ? styles.layoutMainCollapsed : ''}`}>
        <Outlet />
      </main>
    </div>
  )
}
