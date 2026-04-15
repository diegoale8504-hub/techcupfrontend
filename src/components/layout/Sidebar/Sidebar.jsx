import { NavLink } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import styles from './Sidebar.module.css'

/**
 * Construye los ítems de navegación según el rol y teamId del usuario.
 * Se recalcula automáticamente cuando AuthContext cambia (p.ej. PLAYER → CAPTAIN).
 */
function buildNavItems(user) {
  const role   = user?.role   ?? ''
  const teamId = user?.teamId ?? null

  if (role === 'CAPTAIN') {
    const teamBase = teamId ? [
      { to: `/teams/${teamId}`,         label: 'Mi Equipo' },
      { to: `/teams/${teamId}/manage`,  label: 'Gestionar Equipo' },
      { to: `/teams/${teamId}/payment`, label: 'Pagos' },
      { to: `/teams/${teamId}/lineups`, label: 'Alineaciones' },
    ] : []
    return [
      { to: '/dashboard',    label: 'Inicio' },
      ...teamBase,
      { to: '/tournament',   label: 'Torneo' },
      { to: '/calendar',     label: 'Calendario' },
      { to: '/standings',    label: 'Tabla' },
      { to: '/invitations',  label: 'Invitaciones' },
      { to: '/profile',      label: 'Mi perfil' },
    ]
  }

  if (role === 'PLAYER') {
    return [
      { to: '/dashboard',    label: 'Inicio' },
      { to: '/teams/create', label: 'Crear Equipo' },
      { to: '/invitations',  label: 'Mis Invitaciones' },
      ...(teamId ? [{ to: `/teams/${teamId}`, label: 'Mi Equipo' }] : []),
      { to: '/tournament',   label: 'Torneo' },
      { to: '/calendar',     label: 'Calendario' },
      { to: '/standings',    label: 'Tabla' },
      { to: '/profile',      label: 'Mi perfil' },
    ]
  }

  if (role === 'REFEREE') {
    return [
      { to: '/dashboard', label: 'Inicio' },
      { to: '/matches',   label: 'Partidos' },
      { to: '/calendar',  label: 'Calendario' },
      { to: '/standings', label: 'Tabla' },
      { to: '/profile',   label: 'Mi perfil' },
    ]
  }

  if (role === 'ADMINISTRATIVE' || role === 'ADMINISTRATOR') {
    return [
      { to: '/dashboard',  label: 'Inicio' },
      { to: '/tournament', label: 'Torneo' },
      { to: '/calendar',   label: 'Calendario' },
      { to: '/standings',  label: 'Tabla' },
      { to: '/settings',   label: 'Configuración' },
      { to: '/profile',    label: 'Mi perfil' },
    ]
  }

  if (role === 'FAMILY_MEMBER') {
    return [
      { to: '/dashboard',  label: 'Inicio' },
      { to: '/tournament', label: 'Torneo' },
      { to: '/calendar',   label: 'Calendario' },
      { to: '/standings',  label: 'Tabla' },
      { to: '/profile',    label: 'Mi perfil' },
    ]
  }

  // Default: STUDENT, GRADUATE, PROFESSOR y cualquier rol no mapeado
  return [
    { to: '/dashboard',  label: 'Inicio' },
    { to: '/tournament', label: 'Torneo' },
    { to: '/calendar',   label: 'Calendario' },
    { to: '/standings',  label: 'Tabla' },
    { to: '/profile',    label: 'Mi perfil' },
  ]
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navItems = buildNavItems(user)

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src="/images/logoFinalFinal.png" alt="TechCupFútbol" className={styles.logoImg} />
        <span className={styles.logoText}>TechCupFútbol</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item, i) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')
            }
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        {user && (
          <p className={styles.userEmail} title={user.email}>
            {user.name ?? user.email}
          </p>
        )}
        <button className={styles.logoutBtn} onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
