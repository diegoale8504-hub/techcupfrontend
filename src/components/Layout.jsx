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
 * teamId is used only for specific conditional links.
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

  const normalizedRole = role?.toUpperCase()

  // --- CAPTAIN MENU ---
  if (normalizedRole === 'CAPTAIN') {
    const menu = [...common]
    
    // Use the teamId if we have it, otherwise use 'my' as a placeholder 
    // or let the ManageTeam page handle the resolution.
    const effectiveId = teamId || 'null'
    const teamBase = `/teams/${effectiveId}`

    if (teamId) {
      menu.push(
        { to: `${teamBase}`,               icon: '👥', label: 'Mi Equipo' },
        { to: `${teamBase}/manage`,        icon: '⚙️', label: 'Gestionar Equipo' },
        { to: `${teamBase}/payment`,       icon: '💳', label: 'Comprobante de Pago' },
        { to: `${teamBase}/lineups`,       icon: '📋', label: 'Alineaciones' }
      )
    } else {
      // CAPTAIN role but no ID yet - Show a way to get to the team page
      menu.push({ to: '/teams/create', icon: '➕', label: 'Crear/Vincular Equipo', highlight: true })
      // Even without ID, show the manage link - the page itself has fallback logic
      menu.push({ to: '/teams/null/manage', icon: '⚙️', label: 'Gestionar Equipo (Pendiente)' })
    }

    menu.push(...tournament)
    return menu
  }

  // --- PLAYER MENU ---
  else if (normalizedRole === 'PLAYER') {
    const menu = [...common]
    // Only show team link if teamId exists
    if (teamId) {
      menu.push({ to: `/teams/${teamId}`, icon: '👥', label: 'Mi Equipo' })
    }
    menu.push({ to: '/invitations', icon: '📩', label: 'Mis Invitaciones' })
    menu.push(...tournament)
    // Only show create if NO teamId
    if (!teamId) {
      menu.push({ to: '/teams/create', icon: '➕', label: 'Crear Equipo', highlight: true })
    }
    return menu
  }

  // --- OTHER ROLES ---
  else if (normalizedRole === 'REFEREE') {
    return [
      ...common,
      { to: '/matches', icon: '🎯', label: 'Mis Partidos' },
      ...tournament
    ]
  }

  else if (normalizedRole === 'ORGANIZER') {
    return [
      { to: '/dashboard',             icon: '🏠', label: 'Dashboard' },
      { to: '/notifications',         icon: '🔔', label: 'Notificaciones', badge: unreadCount },
      { to: '/organizer/users',       icon: '👥', label: 'Usuarios' },
      { to: '/organizer/teams',       icon: '🛡️', label: 'Equipos' },
      { to: '/organizer/tournaments', icon: '🏆', label: 'Torneos' },
      { to: '/organizer/payments',    icon: '💰', label: 'Pagos' },
      { to: '/organizer/referees',    icon: '🦺', label: 'Árbitros' },
    ]
  }

  else if (normalizedRole === 'ADMINISTRATIVE' || normalizedRole === 'ADMINISTRATOR') {
    return [
      ...common,
      ...tournament,
      { to: '/settings', icon: '🛠️', label: 'Configuración' },
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
        // Silently fail if no team or forbidden
        console.log('[Layout] My-team fetch failed or user has no team:', err.response?.status)
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
        ☰
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
