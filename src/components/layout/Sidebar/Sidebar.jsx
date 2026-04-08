import { NavLink } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import styles from './Sidebar.module.css'

const navItems = [
  { to: '/dashboard', label: 'Inicio', roles: null },
  { to: '/standings', label: 'Tabla de posiciones', roles: null },
  { to: '/players', label: 'Buscar jugadores', roles: ['CAPTAIN', 'ORGANIZER', 'ADMINISTRATOR'] },
  { to: '/payment', label: 'Pago inscripción', roles: ['CAPTAIN'] },
  { to: '/profile', label: 'Mi perfil', roles: null },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const userRoles = user?.roles ?? []

  const visible = navItems.filter(
    (item) => !item.roles || item.roles.some((r) => userRoles.includes(r))
  )

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src="/images/logo-copa.png" alt="TechCupFútbol" className={styles.logoImg} />
        <span className={styles.logoText}>TechCupFútbol</span>
      </div>

      <nav className={styles.nav}>
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')
            }
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
