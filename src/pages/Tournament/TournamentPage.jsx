import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import { getTournament, getTopScorers, getAllTournaments, getTournamentReferees } from '../../api/tournament'
import styles from './TournamentPage.module.css'

const STATUS_LABELS = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  IN_PROGRESS: 'En progreso',
  FINISHED: 'Finalizado',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatCurrency(amount) {
  if (!amount) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)
}

export default function TournamentPage() {
  const [tournament, setTournament] = useState(null)
  const [scorers, setScorers]       = useState([])
  const [referees, setReferees]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const listRes = await getAllTournaments()
        const tournaments = listRes.data ?? []
        const active = tournaments.find((t) => t.status !== 'FINISHED') ?? tournaments[0] ?? null
        
        if (!active) {
          setError('No hay un torneo activo en este momento.')
          setLoading(false)
          return
        }

        const [tRes, sRes, rRes] = await Promise.allSettled([
          getTournament(active.id), 
          getTopScorers(active.id),
          getTournamentReferees(active.id)
        ])

        if (tRes.status === 'fulfilled') setTournament(tRes.value.data)
        if (sRes.status === 'fulfilled') setScorers(sRes.value.data ?? [])
        if (rRes.status === 'fulfilled') setReferees(rRes.value.data ?? [])
        
        if (tRes.status === 'rejected') setError('No se pudo cargar la información del torneo.')
      } catch (err) {
        setError('Ocurrió un error al cargar los datos.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Torneo — TechCupFútbol {tournament?.startDate ? new Date(tournament.startDate).getFullYear() : '2026'}</h1>
        <p className={styles.sub}>Consulta toda la información oficial y estadísticas del torneo</p>
      </div>

      {loading && <p className={styles.loading}>Cargando...</p>}
      {error   && <p className={styles.error}>{error}</p>}

      {!loading && tournament && (
        <div className={styles.grid}>
          {/* ── Left Column: Tournament info ── */}
          <div className={styles.leftCol}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Estado del torneo</h2>

              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>Estado actual</span>
                <span className={`${styles.statusValue} ${styles[`status_${tournament.status}`]}`}>
                  {STATUS_LABELS[tournament.status] ?? 'Sin datos'}
                </span>
              </div>

              <div className={styles.infoList}>
                {[
                  { label: 'Inicio',   value: formatDate(tournament.startDate) },
                  { label: 'Final',    value: formatDate(tournament.endDate) },
                  { label: 'Equipos',  value: `${tournament.teamCount ?? tournament.teamsCount ?? 0} registrados` },
                  { label: 'Costo',    value: formatCurrency(tournament.costPerTeam) },
                  { label: 'Ganador',  value: tournament.winner?.name ?? 'En progreso' },
                ].map(({ label, value }) => (
                  <div key={label} className={styles.infoRow}>
                    <span className={styles.infoLabel}>{label}</span>
                    <span className={styles.infoValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Regulation Card ── */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Reglamento</h2>
              {tournament.hasRegulationPdf ? (
                <div className={styles.pdfArea}>
                  <div className={styles.pdfIcon}>📄</div>
                  <div className={styles.pdfDesc}>
                    <span className={styles.pdfName}>{tournament.regulationPdfName ?? 'reglamento_oficial.pdf'}</span>
                    <a
                      href={`/api/tournaments/${tournament.id}/regulation-pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.pdfBtn}
                    >
                      Descargar Reglamento
                    </a>
                  </div>
                </div>
              ) : (
                <p className={styles.emptyMsg}>El reglamento oficial aún no ha sido cargado por los organizadores.</p>
              )}
            </div>

            {/* ── Referees Card ── */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Árbitros Oficiales</h2>
              {referees.length === 0 ? (
                <p className={styles.emptyMsg}>No se han asignado árbitros para este torneo.</p>
              ) : (
                <ul className={styles.refList}>
                  {referees.map((r) => (
                    <li key={r.id} className={styles.refItem}>
                      <span className={styles.refAvatar}>{r.name?.[0] || 'A'}</span>
                      <span className={styles.refName}>{r.name ?? 'Árbitro Oficial'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Right Column: Top scorers ── */}
          <div className={styles.rightCol}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Máximos goleadores</h2>
              {scorers.length === 0 ? (
                <p className={styles.emptyMsg}>Aún no se han registrado goles en el torneo.</p>
              ) : (
                <ol className={styles.scorerList}>
                  {scorers.slice(0, 10).map((s, i) => (
                    <li key={s.playerId ?? i} className={styles.scorerItem}>
                      <span className={styles.scorerRank}>{i + 1}</span>
                      <div className={styles.scorerInfo}>
                        <span className={styles.scorerName}>{s.playerName}</span>
                        <span className={styles.scorerTeam}>{s.teamName}</span>
                      </div>
                      <span className={styles.scorerGoals}>{s.goals}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
