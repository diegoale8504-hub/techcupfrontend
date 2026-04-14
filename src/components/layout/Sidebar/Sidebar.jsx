import { NavLink } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { getEffectiveRole } from '../../../utils/roles'
import styles from './Sidebar.module.css'

const menuConfig = {
  estudiante: [
    { to: '/dashboard',   label: 'Inicio' },
    { to: '/tournament',  label: 'Torneo' },
    { to: '/calendar',    label: 'Calendario' },
    { to: '/standings',   label: 'Tabla' },
    { to: '/profile',     label: 'Mi perfil' },
    { to: '/players',     label: 'Jugador' },
    { to: '/captain',     label: 'Capitán', disabled: true, tooltip: 'Crea un equipo para ser capitán' },
  ],
  jugador: [
    { to: '/dashboard',    label: 'Inicio' },
    { to: '/tournament',   label: 'Torneo' },
    { to: '/team',         label: 'Mi equipo' },
    { to: '/calendar',     label: 'Calendario' },
    { to: '/standings',    label: 'Tabla' },
    { to: '/invitations',  label: 'Invitaciones' },
    { to: '/profile',      label: 'Mi perfil' },
    { to: '/captain',      label: 'Capitán' },
  ],
  capitán: [
    { to: '/dashboard',    label: 'Inicio' },
    { to: '/tournament',   label: 'Torneo' },
    { to: '/payments',     label: 'Pagos' },
    { to: '/calendar',     label: 'Calendario' },
    { to: '/standings',    label: 'Tabla' },
    { to: '/team',         label: 'Equipo' },
    { to: '/profile',      label: 'Mi perfil' },
    { to: '/invitations',  label: 'Invitaciones' },
    { to: '/captain',      label: 'Capitán', disabled: true, tooltip: 'Ya eres capitán' },
  ],
  organizador: [
    { to: '/dashboard',   label: 'Inicio' },
    { to: '/tournament',  label: 'Torneo' },
    { to: '/payments',    label: 'Pagos' },
    { to: '/calendar',    label: 'Calendario' },
    { to: '/standings',   label: 'Tabla' },
    { to: '/profile',     label: 'Mi perfil' },
    { to: '/settings',    label: 'Configuración' },
  ],
  árbitro: [
    { to: '/dashboard',  label: 'Inicio' },
    { to: '/matches',    label: 'Partidos' },
    { to: '/calendar',   label: 'Calendario' },
    { to: '/standings',  label: 'Tabla' },
    { to: '/profile',    label: 'Mi perfil' },
  ],
  padre: [
    { to: '/dashboard',  label: 'Inicio' },
    { to: '/tournament', label: 'Torneo' },
    { to: '/calendar',   label: 'Calendario' },
    { to: '/standings',  label: 'Tabla' },
    { to: '/profile',    label: 'Mi perfil' },
  ],
  graduado: [
    { to: '/dashboard',  label: 'Inicio' },
    { to: '/tournament', label: 'Torneo' },
    { to: '/calendar',   label: 'Calendario' },
    { to: '/standings',  label: 'Tabla' },
    { to: '/profile',    label: 'Mi perfil' },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const effectiveRole = getEffectiveRole(user)
  const navItems = menuConfig[effectiveRole] ?? menuConfig.estudiante

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src="/images/logofinal.png" alt="TechCupFútbol" className={styles.logoImg} />
        <span className={styles.logoText}>TechCupFútbol</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item, i) =>
          item.disabled ? (
            <span
              key={item.label}
              className={`${styles.link} ${styles.disabled}`}
              style={{ animationDelay: `${i * 0.06}s` }}
              title={item.tooltip}
            >
              {item.label}
            </span>
          ) : (
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
          )
        )}
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
