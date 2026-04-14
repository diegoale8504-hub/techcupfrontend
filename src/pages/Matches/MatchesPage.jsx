import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import { getRefereeMatches } from '../../api/referee'
import styles from './MatchesPage.module.css'

const STATUS_LABELS = {
  SCHEDULED:   'Programado',
  IN_PROGRESS: 'En curso',
  FINISHED:    'Finalizado',
}

const STATUS_CSS = {
  SCHEDULED:   styles.scheduled,
  IN_PROGRESS: styles.inProgress,
  FINISHED:    styles.finished,
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' })
}

export default function MatchesPage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getRefereeMatches()
      .then((r) => setMatches(r.data ?? []))
      .catch(() => setError('No se pudieron cargar los partidos asignados.'))
      .finally(() => setLoading(false))
  }, [])

  const upcoming  = matches.filter((m) => m.status === 'SCHEDULED')
  const active    = matches.filter((m) => m.status === 'IN_PROGRESS')
  const finished  = matches.filter((m) => m.status === 'FINISHED')

  const Section = ({ title, items }) => items.length === 0 ? null : (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.matchGrid}>
        {items.map((m) => (
          <div key={m.matchScheduleId ?? m.id} className={`${styles.matchCard} ${STATUS_CSS[m.status] ?? ''}`}>
            <div className={styles.matchHeader}>
              <span className={`${styles.statusBadge} ${STATUS_CSS[m.status] ?? ''}`}>
                {STATUS_LABELS[m.status] ?? m.status}
              </span>
              <span className={styles.matchDate}>{formatDate(m.matchDate)}</span>
            </div>
            <div className={styles.matchTeams}>
              <span className={styles.team}>{m.homeTeam?.name ?? '—'}</span>
              <span className={styles.vs}>vs</span>
              <span className={styles.team}>{m.awayTeam?.name ?? '—'}</span>
            </div>
            <div className={styles.matchMeta}>
              <span>{m.matchTime ?? '—'}</span>
              <span>Cancha: {m.field?.name ?? '—'}</span>
            </div>
            {m.status === 'FINISHED' && m.homeScore != null && (
              <div className={styles.score}>
                {m.homeScore} – {m.awayScore}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Mis partidos</h1>
        <p className={styles.sub}>Partidos asignados para arbitrar</p>
      </div>

      {loading && <p className={styles.loading}>Cargando...</p>}
      {error   && <p className={styles.error}>{error}</p>}

      {!loading && matches.length === 0 && !error && (
        <div className={styles.card}>
          <p className={styles.emptyMsg}>No tienes partidos asignados aún.</p>
        </div>
      )}

      {!loading && (
        <>
          <Section title="En curso" items={active} />
          <Section title="Próximos partidos" items={upcoming} />
          <Section title="Partidos finalizados" items={finished} />
        </>
      )}
    </PageLayout>
  )
}
