import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStandingsPreview } from '../../api/landing'

const MEDAL_CLS = {
  1: 'landing-medal--gold',
  2: 'landing-medal--silver',
  3: 'landing-medal--bronze',
}

function TableSkeleton() {
  return (
    <div className="landing-ranking__skeleton">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="landing-skeleton landing-skeleton--row" />
      ))}
    </div>
  )
}

function RankingEmpty() {
  return (
    <div className="landing-empty">
      <p className="landing-empty__title">La tabla de posiciones no está disponible</p>
      <p className="landing-empty__text">Se publicará cuando el torneo dé inicio.</p>
    </div>
  )
}

export default function RankingPreview() {
  const [standings, setStandings] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getStandingsPreview()
      .then((res) => setStandings(res.data ?? []))
      .catch((err) => {
        console.error(err)
        setError(err.userMessage ?? 'No se pudo cargar el ranking.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <section className="landing-section landing-section--light" id="ranking">
      <div className="landing-container landing-container--narrow">
        <h2 className="landing-section__title">Ranking</h2>
        <p className="landing-section__subtitle">Top 5 equipos — Temporada 2026</p>

        {loading && <TableSkeleton />}

        {!loading && error && (
          <div className="landing-error">
            <p>{error}</p>
            <button className="landing-btn landing-btn--primary" onClick={load}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && standings.length === 0 && <RankingEmpty />}

        {!loading && !error && standings.length > 0 && (
          <>
            <div className="landing-ranking__table-wrap">
              <table className="landing-ranking__table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th className="landing-ranking__team-col">Equipo</th>
                    <th>PJ</th>
                    <th>G</th>
                    <th>E</th>
                    <th>P</th>
                    <th className="landing-ranking__pts-col">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => {
                    const pos = row.pos ?? row.position ?? 0
                    return (
                      <tr key={pos} className={pos <= 3 ? 'landing-ranking__row--top' : ''}>
                        <td>
                          {MEDAL_CLS[pos] ? (
                            <span className={`landing-medal ${MEDAL_CLS[pos]}`}>{pos}</span>
                          ) : pos}
                        </td>
                        <td className="landing-ranking__team-name">
                          {row.team ?? row.teamName ?? '—'}
                        </td>
                        <td>{row.pj ?? row.played   ?? '—'}</td>
                        <td>{row.pg ?? row.won      ?? '—'}</td>
                        <td>{row.pe ?? row.drawn    ?? '—'}</td>
                        <td>{row.pp ?? row.lost     ?? '—'}</td>
                        <td className="landing-ranking__pts">{row.pts ?? row.points ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="landing-ranking__footer">
              <Link to="/login" className="landing-link">
                Ver tabla completa
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
