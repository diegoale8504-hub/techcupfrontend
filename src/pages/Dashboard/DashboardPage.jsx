import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import { useAuth } from '../../hooks/useAuth'
import { getUserById } from '../../api/users'
import Badge from '../../components/ui/Badge/Badge'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    getUserById(user.id)
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err.userMessage ?? 'Error al cargar el perfil'))
      .finally(() => setLoading(false))
  }, [user?.id])

  const POSITION_LABELS = {
    GOALKEEPER: 'Portero',
    DEFENDER: 'Defensa',
    MIDFIELDER: 'Centrocampista',
    FORWARD: 'Delantero',
  }

  return (
    <PageLayout>
      <div className={styles.welcome}>
        <h1 className={styles.heading}>
          Bienvenido, {profile?.name ?? user?.email ?? '—'}
        </h1>
        <p className={styles.sub}>TechCupFútbol — Temporada 2026</p>
      </div>

      {loading && <p className={styles.loading}>Cargando...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && profile && (
        <div className={styles.grid}>
          <div className={styles.cardBox}>
            <h2 className={styles.cardTitle}>Mi perfil deportivo</h2>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Posición principal</span>
              <span>{POSITION_LABELS[profile.mainPosition] ?? '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Número de camiseta</span>
              <span>#{profile.jerseyNumber ?? '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Disponibilidad</span>
              <Badge status={profile.available ? 'available' : 'in-team'} />
            </div>
          </div>

          <div className={styles.cardBox}>
            <h2 className={styles.cardTitle}>Estado del torneo</h2>
            <p className={styles.tournamentMsg}>
              El torneo está en curso. Consulta la{' '}
              <a href="/standings">tabla de posiciones</a> para ver el ranking.
            </p>
          </div>

          <div className={styles.cardBox}>
            <h2 className={styles.cardTitle}>Acciones rápidas</h2>
            <div className={styles.quickLinks}>
              <a href="/standings" className={styles.quickLink}>Ver tabla de posiciones →</a>
              <a href="/players" className={styles.quickLink}>Buscar jugadores →</a>
              <a href="/profile" className={styles.quickLink}>Editar mi perfil →</a>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
