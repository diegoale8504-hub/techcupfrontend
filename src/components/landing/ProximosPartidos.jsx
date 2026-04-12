import { useState, useEffect } from 'react'
import { getUpcomingMatches } from '../../api/landing'

const STATUS_LABELS = {
  upcoming:  'Próximo',
  live:      'En vivo',
  scheduled: 'Programado',
  postponed: 'Pospuesto',
}

const STATUS_CLASSES = {
  upcoming:  'landing-badge--upcoming',
  live:      'landing-badge--live',
  scheduled: 'landing-badge--upcoming',
  postponed: 'landing-badge--muted',
}

function MatchSkeleton() {
  return (
    <div className="landing-grid-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="landing-card landing-skeleton-card">
          <div className="landing-skeleton landing-skeleton--title" style={{ width: '50%' }} />
          <div className="landing-skeleton landing-skeleton--text" style={{ marginTop: 16 }} />
          <div className="landing-skeleton landing-skeleton--text landing-skeleton--short" style={{ marginTop: 8 }} />
        </div>
      ))}
    </div>
  )
}

function MatchEmpty() {
  return (
    <div className="landing-empty">
      <p className="landing-empty__title">No hay partidos programados</p>
      <p className="landing-empty__text">
        Los próximos encuentros aparecerán aquí en cuanto se publiquen.
      </p>
    </div>
  )
}

function MatchCard({ match }) {
  const date = match.date ? new Date(match.date) : null
  const dateStr = date
    ? date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
    : '—'
  const timeStr = date
    ? date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : (match.time ?? '—')

  const statusKey = match.status ?? 'upcoming'
  const homeTeam = match.homeTeam ?? match.home_team ?? '—'
  const awayTeam = match.awayTeam ?? match.away_team ?? '—'
  const venue    = match.fieldName ?? match.field_name ?? null

  return (
    <div className="landing-card landing-match-card">
      <div className="landing-match-card__header">
        <span className={`landing-badge ${STATUS_CLASSES[statusKey] ?? 'landing-badge--upcoming'}`}>
          {STATUS_LABELS[statusKey] ?? statusKey}
        </span>
        <span className="landing-match-card__datetime">{dateStr} · {timeStr}</span>
      </div>
      <div className="landing-match-card__teams">
        <span className="landing-match-card__team">{homeTeam}</span>
        <span className="landing-match-card__vs">vs</span>
        <span className="landing-match-card__team landing-match-card__team--away">{awayTeam}</span>
      </div>
      {venue && <p className="landing-match-card__venue">{venue}</p>}
    </div>
  )
}

export default function ProximosPartidos() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getUpcomingMatches()
      .then((res) => setMatches((res.data ?? []).slice(0, 4)))
      .catch((err) => {
        console.error(err)
        setError(err.userMessage ?? 'No se pudieron cargar los próximos partidos.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <section className="landing-section landing-section--muted" id="partidos">
      <div className="landing-container">
        <h2 className="landing-section__title">Próximos Partidos</h2>
        <p className="landing-section__subtitle">
          Los cuatro encuentros más cercanos del torneo.
        </p>

        {loading && <MatchSkeleton />}

        {!loading && error && (
          <div className="landing-error">
            <p>{error}</p>
            <button className="landing-btn landing-btn--primary" onClick={load}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && matches.length === 0 && <MatchEmpty />}

        {!loading && !error && matches.length > 0 && (
          <div className="landing-grid-2">
            {matches.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </div>
    </section>
  )
}
