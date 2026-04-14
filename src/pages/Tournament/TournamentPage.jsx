import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import { getTournament, getTopScorers } from '../../api/tournament'
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
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, sRes] = await Promise.allSettled([getTournament(), getTopScorers()])
        if (tRes.status === 'fulfilled') setTournament(tRes.value.data)
        if (sRes.status === 'fulfilled') setScorers(sRes.value.data ?? [])
        if (tRes.status === 'rejected') setError('No se pudo cargar la información del torneo.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Torneo</h1>
        <p className={styles.sub}>Estado del torneo TechCupFútbol 2026</p>
      </div>

      {loading && <p className={styles.loading}>Cargando...</p>}
      {error   && <p className={styles.error}>{error}</p>}

      {!loading && (
        <div className={styles.grid}>
          {/* ── Left: Tournament info ── */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Estado del torneo</h2>

            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Estado</span>
              <span className={`${styles.statusValue} ${styles[`status_${tournament?.status ?? 'UNKNOWN'}`]}`}>
                {STATUS_LABELS[tournament?.status] ?? 'Sin datos'}
              </span>
            </div>

            <div className={styles.infoList}>
              {[
                { label: 'Inicio',   value: formatDate(tournament?.startDate) },
                { label: 'Final',    value: formatDate(tournament?.endDate) },
                { label: 'Equipos',  value: tournament ? `${tournament.teamsCount ?? 0} de ${tournament.maxTeams ?? '—'}` : '—' },
                { label: 'Costo',    value: formatCurrency(tournament?.costPerTeam) },
                { label: 'Ganador',  value: tournament?.winner?.name ?? 'En progreso' },
              ].map(({ label, value }) => (
                <div key={label} className={styles.infoRow}>
                  <span className={styles.infoLabel}>{label}</span>
                  <span className={styles.infoValue}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Top scorers ── */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Máximos goleadores</h2>
            {scorers.length === 0 ? (
              <p className={styles.emptyMsg}>No hay datos de goleadores aún.</p>
            ) : (
              <ol className={styles.scorerList}>
                {scorers.slice(0, 8).map((s, i) => (
                  <li key={s.playerId ?? i} className={styles.scorerItem}>
                    <span className={styles.scorerRank}>{i + 1}</span>
                    <span className={styles.scorerName}>{s.playerName}</span>
                    <span className={styles.scorerTeam}>{s.teamName}</span>
                    <span className={styles.scorerGoals}>{s.goals} goles</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  )
}
