import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import { useAuth } from '../../hooks/useAuth'
import { getUserById } from '../../api/users'
import styles from './DashboardPage.module.css'

const POSITION_LABELS = {
  GOALKEEPER: 'Portero',
  DEFENDER: 'Defensa',
  MIDFIELDER: 'Centrocampista',
  FORWARD: 'Delantero',
}

function Avatar({ name }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?'
  return <div className={styles.avatar}>{initials}</div>
}

function ProfileCard({ profile }) {
  return (
    <div className={`${styles.card} ${styles.card1}`}>
      <h2 className={styles.cardTitle}>Mi perfil deportivo</h2>
      <div className={styles.avatarRow}>
        <Avatar name={profile.name} />
        <span className={styles.playerName}>{profile.name}</span>
      </div>
      <div className={styles.infoList}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Posición principal</span>
          <span className={styles.infoValue}>
            {POSITION_LABELS[profile.mainPosition] ?? '—'}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Número de camiseta</span>
          <span className={styles.jerseyBadge}>
            #{profile.jerseyNumber ?? '—'}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Disponibilidad</span>
          <span className={profile.available ? styles.badgeAvailable : styles.badgeUnavailable}>
            {profile.available ? 'Disponible' : 'No disponible'}
          </span>
        </div>
      </div>
    </div>
  )
}

function TournamentCard() {
  return (
    <div className={`${styles.card} ${styles.card2}`}>
      <h2 className={styles.cardTitle}>Estado del torneo</h2>
      <p className={styles.tournamentStatus}>El torneo está en curso</p>
      <div className={styles.positionBlock}>
        <span className={styles.positionNumber}>3</span>
        <span className={styles.positionLabel}>posición en tabla</span>
      </div>
      <Link to="/standings" className={styles.cardLink}>
        Ver tabla de posiciones
      </Link>
    </div>
  )
}

function ActionsCard() {
  return (
    <div className={`${styles.card} ${styles.card3}`}>
      <h2 className={styles.cardTitle}>Acciones rápidas</h2>
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statNumber}>100</span>
          <span className={styles.statLabel}>Goles</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNumber}>50</span>
          <span className={styles.statLabel}>Asistencias</span>
        </div>
      </div>
      <div className={styles.quickLinks}>
        <Link to="/standings" className={styles.quickLink}>
          Ver tabla de posiciones <span className={styles.arrow}>&#8594;</span>
        </Link>
        <Link to="/players" className={styles.quickLink}>
          Buscar jugadores <span className={styles.arrow}>&#8594;</span>
        </Link>
        <Link to="/profile" className={styles.quickLink}>
          Editar mi perfil <span className={styles.arrow}>&#8594;</span>
        </Link>
      </div>
    </div>
  )
}

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

  return (
    <PageLayout>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.welcome}>
            Bienvenido, {profile?.name ?? user?.email ?? '—'}
          </h1>
          <p className={styles.season}>TechCupFútbol — Temporada 2026</p>
        </div>
      </div>

      {loading && <p className={styles.loading}>Cargando...</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {!loading && (
        <div className={styles.grid}>
          <ProfileCard profile={profile ?? { name: user?.email ?? '—', mainPosition: null, jerseyNumber: null, available: false }} />
          <TournamentCard />
          <ActionsCard />
        </div>
      )}
    </PageLayout>
  )
}
