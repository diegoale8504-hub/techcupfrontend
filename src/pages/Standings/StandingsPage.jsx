import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import { getAllTournaments, getTournamentGroups, getGroupStandings } from '../../api/tournament'
import styles from './StandingsPage.module.css'

export default function StandingsPage() {
  const [groups,    setGroups]    = useState([])   // [{ id, name, standings: [] }]
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [tournYear, setTournYear] = useState(null)
  const [phase,     setPhase]     = useState(null) // 'DRAFT' | 'ACTIVE' | 'IN_PROGRESS' | 'FINISHED' | null

  useEffect(() => {
    const load = async () => {
      try {
        const listRes = await getAllTournaments()
        const tournaments = listRes.data ?? []
        const active = tournaments.find((t) => t.status !== 'FINISHED') ?? tournaments[0] ?? null

        if (!active) {
          setLoading(false)
          return
        }

        setPhase(active.status)
        if (active.startDate) setTournYear(new Date(active.startDate).getFullYear())

        if (active.status === 'DRAFT' || active.status === 'ACTIVE') {
          setLoading(false)
          return
        }

        const groupRes = await getTournamentGroups(active.id)
        const groupList = groupRes.data ?? []

        if (groupList.length === 0) {
          setLoading(false)
          return
        }

        const standingsResults = await Promise.allSettled(
          groupList.map((g) => getGroupStandings(g.id, active.id))
        )

        const enriched = groupList.map((g, i) => ({
          id: g.id,
          name: g.name ?? `Grupo ${i + 1}`,
          standings: standingsResults[i].status === 'fulfilled'
            ? (standingsResults[i].value.data ?? [])
            : [],
        }))

        setGroups(enriched)
      } catch {
        setError('No se pudo cargar la tabla de posiciones.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getRowClass = (position) => {
    if (position === 1) return styles.rowGold
    if (position <= 4) return styles.rowTop
    return position % 2 === 0 ? styles.rowAlt : styles.rowNormal
  }

  const noDataMessage = () => {
    if (phase === 'DRAFT' || phase === 'ACTIVE') {
      return 'Las posiciones se mostrarán cuando el torneo esté en progreso.'
    }
    if (phase === 'IN_PROGRESS' && groups.length === 0) {
      return 'Aún no hay grupos ni resultados registrados.'
    }
    if (!phase) {
      return 'No hay ningún torneo activo.'
    }
    return null
  }

  const msg = noDataMessage()

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Tabla de posiciones</h1>
        <p className={styles.sub}>
          {tournYear ? `Temporada ${tournYear} — TechCupFútbol` : 'TechCupFútbol'}
        </p>
      </div>

      {loading && <p className={styles.loadingMsg}>Cargando posiciones...</p>}
      {error   && <p className={styles.errorMsg}>{error}</p>}

      {!loading && !error && msg && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}></span>
          <p className={styles.emptyText}>{msg}</p>
        </div>
      )}

      {!loading && !error && groups.map((group) => (
        <div key={group.id} className={styles.groupBlock}>
          {groups.length > 1 && <h2 className={styles.groupTitle}>{group.name}</h2>}

          {group.standings.length === 0 ? (
            <p className={styles.groupEmpty}>Sin resultados registrados en este grupo.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHead}>
                    <th className={styles.thPos}>Pos</th>
                    <th className={styles.teamCol}>Equipo</th>
                    <th>PJ</th>
                    <th>PG</th>
                    <th>PE</th>
                    <th>PP</th>
                    <th>GF</th>
                    <th>GC</th>
                    <th>DG</th>
                    <th className={styles.pts}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {group.standings.map((row) => (
                    <tr key={row.teamId} className={getRowClass(row.position)}>
                      <td className={styles.pos}>
                        {row.position}
                      </td>
                      <td className={styles.teamName}>
                        <img
                          src={`/api/teams/${row.teamId}/logo`}
                          alt=""
                          className={styles.teamLogo}
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                        {row.teamName}
                      </td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.drawn}</td>
                      <td>{row.lost}</td>
                      <td>{row.goalsFor}</td>
                      <td>{row.goalsAgainst}</td>
                      <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                      <td className={styles.pts}>{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {!loading && !error && groups.length > 0 && (
        <p className={styles.legend}>
          <span className={styles.legendGold}>■</span> Campeón &nbsp;
          <span className={styles.legendTop}>■</span> Zona de honor
        </p>
      )}
    </PageLayout>
  )
}
