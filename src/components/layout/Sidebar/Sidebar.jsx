import { NavLink } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import styles from './Sidebar.module.css'

const navItems = [
  { to: '/dashboard', label: 'Inicio',                roles: null },
  { to: '/tournament', label: 'Torneo',               roles: null },
  { to: '/calendar',   label: 'Calendario',           roles: null },
  { to: '/standings',  label: 'Tabla de posiciones',  roles: null },
  { to: '/profile',    label: 'Mi perfil',            roles: null },
  { to: '/players',    label: 'Jugador',              roles: null },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src="/images/logofinal.png" alt="TechCupFútbol" className={styles.logoImg} />
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
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        {user && (
          <p className={styles.userEmail} title={user.email}>
            {user.email}
          </p>
        )}
        <button className={styles.logoutBtn} onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
