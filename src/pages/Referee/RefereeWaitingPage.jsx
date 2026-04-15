import { useAuth } from '../../hooks/useAuth'
import styles from './RefereeWaitingPage.module.css'

/**
 * Pantalla temporal para árbitros recién registrados.
 * Confirma visualmente que el rol fue asignado correctamente
 * y sirve de punto de partida para la pantalla definitiva de árbitro.
 */
export default function RefereeWaitingPage() {
  const { user, logout } = useAuth()

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>🟢</span>
        </div>

        <h1 className={styles.title}>Acceso de Árbitro</h1>
        <p className={styles.subtitle}>
          Tu cuenta fue autenticada correctamente con Google.
        </p>

        {/* Bloque de validación de rol */}
        <div className={styles.roleBlock}>
          <p className={styles.roleLabel}>Rol asignado</p>
          <span className={`${styles.roleBadge} ${user?.role === 'REFEREE' ? styles.roleBadgeOk : styles.roleBadgeWarn}`}>
            {user?.role ?? '(sin rol)'}
          </span>
          {user?.role !== 'REFEREE' && (
            <p className={styles.roleWarning}>
              ⚠️ Se esperaba <strong>REFEREE</strong> pero se recibió <strong>{user?.role}</strong>.
              Verifica la configuración del backend.
            </p>
          )}
        </div>

        {/* Datos del usuario para debug */}
        <div className={styles.debugBlock}>
          <p className={styles.debugTitle}>Datos recibidos del token</p>
          <table className={styles.debugTable}>
            <tbody>
              {[
                ['id',    user?.id],
                ['name',  user?.name],
                ['email', user?.email],
                ['role',  user?.role],
              ].map(([key, val]) => (
                <tr key={key}>
                  <td className={styles.debugKey}>{key}</td>
                  <td className={styles.debugVal}>{val ?? <em>(vacío)</em>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={styles.pending}>
          La pantalla de árbitro está en construcción. Pronto podrás gestionar tus partidos aquí.
        </p>

        <button className={styles.logoutBtn} onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
