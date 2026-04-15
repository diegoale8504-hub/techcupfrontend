import { useEffect, useState, useRef, useCallback } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axios'
import styles from './Layout.module.css'

// ── Construcción del menú por rol ──────────────────────────────────────────
function buildMenu(role, teamId, userId, unreadCount) {
  const notifItem = {
    to: '/notifications',
    icon: '🔔',
    label: 'Notificaciones',
    badge: unreadCount > 0 ? unreadCount : 0,
  }

  const shared = [
    { to: '/dashboard',                  icon: '🏠', label: 'Dashboard' },
    { to: `/profile/${userId}`,          icon: '👤', label: 'Mi Perfil' },
    notifItem,
  ]

  const tournament = [
    { to: '/tournaments/active',               icon: '🏆', label: 'Torneo Activo' },
    { to: '/tournaments/active/statistics',    icon: '📊', label: 'Estadísticas' },
  ]

  if (role === 'CAPTAIN') {
    const teamItems = teamId ? [
      { to: `/teams/${teamId}`,                icon: '👥', label: 'Mi Equipo' },
      { to: `/teams/${teamId}/manage`,         icon: '⚙️', label: 'Gestionar Equipo' },
      { to: `/teams/${teamId}/manage#invite`,  icon: '📨', label: 'Invitar Jugadores' },
      { to: `/teams/${teamId}/manage#leave`,   icon: '🚪', label: 'Solicitudes de Salida' },
      { to: `/teams/${teamId}/payment`,        icon: '💳', label: 'Comprobante de Pago' },
      { to: `/teams/${teamId}/lineups`,        icon: '📋', label: 'Alineaciones' },
    ] : []
    return [...shared, ...teamItems, ...tournament]
  }

  if (role === 'PLAYER') {
    const teamItem = teamId
      ? [{ to: `/teams/${teamId}`, icon: '👥', label: 'Mi Equipo' }]
      : []
    const createItem = !teamId
      ? [{ to: '/teams/create', icon: '➕', label: 'Crear Equipo', highlight: true }]
      : []
    return [
      ...shared,
      ...teamItem,
      { to: '/invitations', icon: '📩', label: 'Mis Invitaciones' },
      ...createItem,
      ...tournament,
    ]
  }

  if (role === 'REFEREE') {
    return [
      ...shared,
      { to: '/matches',  icon: '🎯', label: 'Mis Partidos' },
      ...tournament,
    ]
  }

  if (role === 'ADMINISTRATIVE' || role === 'ADMINISTRATOR') {
    return [
      ...shared,
      ...tournament,
      { to: '/settings', icon: '🛠️', label: 'Configuración' },
    ]
  }

  // Default
  return [...shared, ...tournament]
}

// ── Componente ─────────────────────────────────────────────────────────────
export default function Layout() {
  const { user, token, logout } = useAuth()

  const [myTeamId,    setMyTeamId]    = useState(user?.teamId ?? null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pollRef = useRef(null)

  // Obtener perfil completo → teamId actualizado desde el servidor
  useEffect(() => {
    if (!user?.id) return
    api.get(`/api/users/${user.id}`)
      .then((res) => {
        const tid = res.data.teamId ?? res.data.team?.id ?? null
        if (tid) setMyTeamId(tid)
      })
      .catch(() => {})
  }, [user?.id])

  // Si el AuthContext ya tiene teamId (p.ej. recién creó equipo), úsalo de inmediato
  useEffect(() => {
    if (user?.teamId && !myTeamId) setMyTeamId(user.teamId)
  }, [user?.teamId])

  // Polling de notificaciones cada 60 s
  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications/unread')
      const data = res.data
      setUnreadCount(Array.isArray(data) ? data.length : (data?.count ?? data?.total ?? 0))
    } catch { /* silencioso */ }
  }, [])

  useEffect(() => {
    fetchUnread()
    pollRef.current = setInterval(fetchUnread, 60_000)
    return () => clearInterval(pollRef.current)
  }, [fetchUnread])

  const effectiveTeamId = myTeamId ?? user?.teamId ?? null
  const menu = buildMenu(user?.role, effectiveTeamId, user?.id, unreadCount)

  const initial = (user?.name ?? user?.email ?? 'U')[0].toUpperCase()
  const roleKey = user?.role?.toLowerCase() ?? 'player'

  return (
    <div className={styles.layout}>
      {/* ── Botón hamburguesa (móvil) ── */}
      <button
        className={styles.hamburger}
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Abrir menú"
      >
        ☰
      </button>

      {/* ── Overlay móvil ── */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo de la app */}
        <div className={styles.logoSection}>
          <img src="/images/logoFinalFinal.png" alt="TechCupFútbol" className={styles.logoImg} />
          <span className={styles.logoText}>TechCupFútbol</span>
        </div>

        {/* Info del usuario */}
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

        {/* Navegación */}
        <nav className={styles.nav}>
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  styles.navItem,
                  isActive            ? styles.navItemActive    : '',
                  item.highlight      ? styles.navItemHighlight : '',
                ]
                  .filter(Boolean)
                  .join(' ')
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.badge > 0 && (
                <span className={styles.navItemBadge}>{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer del sidebar */}
        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <main className={styles.layoutMain}>
        <Outlet />
      </main>
    </div>
  )
}
