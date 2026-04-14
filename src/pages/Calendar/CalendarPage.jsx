import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import { useAuth } from '../../hooks/useAuth'
import { getEffectiveRole } from '../../utils/roles'
import { getMatchSchedules } from '../../api/tournament'
import styles from './CalendarPage.module.css'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CO', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
}

const STATUS_LABELS = {
  SCHEDULED:   'Programado',
  IN_PROGRESS: 'En curso',
  FINISHED:    'Finalizado',
}

const STATUS_CSS = {
  SCHEDULED:   styles.statusScheduled,
  IN_PROGRESS: styles.statusInProgress,
  FINISHED:    styles.statusFinished,
}

function MatchCard({ match, highlight }) {
  return (
    <div className={`${styles.matchCard} ${highlight ? styles.matchHighlight : ''}`}>
      {highlight && <span className={styles.myMatchBadge}>Tu partido</span>}
      <div className={styles.matchTime}>{match.matchTime ?? '—'}</div>
      <div className={styles.matchTeams}>
        <span className={styles.team}>{match.homeTeam?.name ?? '—'}</span>
        <span className={styles.vs}>vs</span>
        <span className={styles.team}>{match.awayTeam?.name ?? '—'}</span>
      </div>
      <div className={styles.matchMeta}>
        <span className={styles.field}>Cancha: {match.field?.name ?? '—'}</span>
        <span className={`${styles.status} ${STATUS_CSS[match.status] ?? ''}`}>
          {STATUS_LABELS[match.status] ?? match.status}
        </span>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const { user } = useAuth()
  const role = getEffectiveRole(user)

  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getMatchSchedules()
      .then((r) => setMatches(r.data ?? []))
      .catch(() => setError('No se pudo cargar el calendario.'))
      .finally(() => setLoading(false))
  }, [])

  // Group matches by date
  const grouped = matches.reduce((acc, m) => {
    const key = m.matchDate ?? 'Sin fecha'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  const today = new Date().toISOString().split('T')[0]

  // Determine if a match should be highlighted (referee sees their assigned matches)
  const shouldHighlight = (match) => {
    if (role === 'árbitro') return match.refereeId === user?.id
    if (role === 'capitán' || role === 'jugador') {
      const teamId = user?.teamId
      return teamId && (match.homeTeam?.id === teamId || match.awayTeam?.id === teamId)
    }
    return false
  }

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Calendario</h1>
        <p className={styles.sub}>Partidos del torneo TechCupFútbol 2026</p>
      </div>

      {loading && <p className={styles.loading}>Cargando calendario...</p>}
      {error   && <p className={styles.error}>{error}</p>}

      {!loading && matches.length === 0 && !error && (
        <div className={styles.card}>
          <p className={styles.emptyMsg}>No hay partidos programados aún.</p>
        </div>
      )}

      {!loading && Object.keys(grouped).sort().map((dateKey) => {
        const isToday = dateKey === today
        return (
          <div key={dateKey} className={`${styles.dayGroup} ${isToday ? styles.todayGroup : ''}`}>
            <div className={styles.dayHeader}>
              <span className={styles.dayLabel}>
                {isToday ? 'Hoy — ' : ''}{formatDate(dateKey)}
              </span>
              {isToday && <span className={styles.todayBadge}>HOY</span>}
            </div>
            <div className={styles.matchGrid}>
              {grouped[dateKey].map((m) => (
                <MatchCard key={m.id} match={m} highlight={shouldHighlight(m)} />
              ))}
            </div>
          </div>
        )
      })}

      <div className={styles.bracketHint}>
        <span className={styles.bracketIcon}>🏆</span>
        <span>Fase de llaves — Round Robin</span>
        <a href="/standings" className={styles.bracketLink}>Ver tabla de posiciones</a>
      </div>
    </PageLayout>
  )
}
