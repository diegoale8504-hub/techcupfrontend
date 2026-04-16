import { useEffect, useState, useRef, useCallback } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axiosInstance'
import styles from './Layout.module.css'

/**
 * REUSABLE NAVIGATION ITEM
 * Classes: nav-item, nav-item--active, nav-item--highlight (mapped from styles)
 */
const NavItem = ({ label, to, badge, highlight, onClick, end }) => (
  <NavLink
    to={to}
    end={end}
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
    <span className={styles.navLabel}>{label}</span>
    {badge > 0 && (
      <span className={styles.navItemBadge}>{badge}</span>
    )}
  </NavLink>
)

/**
 * MENU BUILDER BY ROLE
 * teamId is used only for specific conditional links.
 */
function buildMenu(role, teamId, userId, unreadCount) {
  const common = [
    { to: '/dashboard',         label: 'Dashboard' },
    { to: `/profile/${userId}`, label: 'Mi Perfil' },
    { to: '/notifications',     label: 'Notificaciones', badge: unreadCount },
  ]

  const tournament = [
    { to: '/tournaments/active',            label: 'Torneo Activo' },
    { to: '/tournaments/active/statistics', label: 'Estadísticas' },
  ]

  const normalizedRole = role?.toUpperCase()

  // --- CAPTAIN MENU ---
  if (normalizedRole === 'CAPTAIN') {
    const menu = [...common]
    const effectiveId = teamId || 'null'
    const teamBase = `/teams/${effectiveId}`

    if (teamId) {
      menu.push(
        { to: `${teamBase}`,         label: 'Mi Equipo', end: true },
        { to: `${teamBase}/manage`,  label: 'Gestionar Equipo' },
        { to: `${teamBase}/payment`, label: 'Comprobante de Pago' },
        { to: `${teamBase}/lineups`, label: 'Alineaciones' }
      )
    } else {
      menu.push({ to: '/teams/create',      label: 'Crear/Vincular Equipo', highlight: true })
      menu.push({ to: '/teams/null/manage', label: 'Gestionar Equipo (Pendiente)' })
    }

    menu.push(...tournament)
    return menu
  }

  // --- PLAYER MENU ---
  else if (normalizedRole === 'PLAYER') {
    const menu = [...common]
    if (teamId) {
      menu.push({ to: `/teams/${teamId}`, label: 'Mi Equipo', end: true })
    }
    menu.push({ to: '/invitations', label: 'Mis Invitaciones' })
    menu.push(...tournament)
    if (!teamId) {
      menu.push({ to: '/teams/create', label: 'Crear Equipo', highlight: true })
    }
    return menu
  }

  // --- OTHER ROLES ---
  else if (normalizedRole === 'REFEREE') {
    return [
      ...common,
      { to: '/matches', label: 'Mis Partidos' },
      ...tournament
    ]
  }

  else if (normalizedRole === 'ORGANIZER') {
    return [
      { to: '/dashboard',             label: 'Dashboard' },
      { to: '/notifications',         label: 'Notificaciones', badge: unreadCount },
      { to: '/organizer/users',       label: 'Usuarios' },
      { to: '/organizer/teams',       label: 'Equipos' },
      { to: '/organizer/tournaments', label: 'Torneos' },
      { to: '/organizer/payments',    label: 'Pagos' },
      { to: '/organizer/referees',    label: 'Árbitros' },
    ]
  }

  else if (normalizedRole === 'ADMINISTRATIVE' || normalizedRole === 'ADMINISTRATOR') {
    return [
      ...common,
      ...tournament,
      { to: '/settings', label: 'Configuración' },
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
  const pollRef = useRef(null)

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
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logoSection}>
          <img src="/images/logoFinalFinal.png" alt="TechCupFútbol" className={styles.logoImg} />
          <span className={styles.logoText}>TechCupFútbol</span>
        </div>

        {/* User Info Header */}
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

        {/* Navigation - Always renders items based on current data */}
        <nav className={styles.nav}>
          {menu.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className={styles.layoutMain}>
        <Outlet />
      </main>
    </div>
  )
}
