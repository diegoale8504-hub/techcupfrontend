import { useState, useEffect, useMemo } from 'react'
import PageLayout from '../../../components/layout/PageLayout/PageLayout'
import Badge from '../../../components/ui/Badge/Badge'
import { getAllTeams, validateTeam, unlockTeam } from '../../../api/teams'
import { getAllTournaments } from '../../../api/tournament'
import styles from './OrgTeamsPage.module.css'

const FILTERS = ['Todos', 'Validados', 'Pendientes']

export default function OrgTeamsPage() {
  const [teams, setTeams]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filter, setFilter]   = useState('Todos')
  const [processing, setProcessing] = useState({}) 
  const [actionErrors, setActionErrors] = useState({})
  const [activeTournament, setActiveTournament] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsRes, tourRes] = await Promise.all([
          getAllTeams(),
          getAllTournaments()
        ])
        setTeams(teamsRes.data ?? [])
        
        const tournaments = tourRes.data ?? []
        const active = tournaments.find((t) => t.status !== 'FINISHED') ?? null
        setActiveTournament(active)
      } catch (err) {
        setError('No se pudo cargar la información.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const isValidated = (t) => t.status === 'REGISTERED' || t.status === 'LOCKED'
  
  // Un equipo solo se considera "Cerrado/Bloqueado" si hay un torneo activo
  const isCurrentlyLocked = (t) => activeTournament !== null && isValidated(t)

  const filtered = useMemo(() => {
    if (filter === 'Validados') return teams.filter(isValidated)
    if (filter === 'Pendientes') return teams.filter((t) => !isValidated(t))
    return teams
  }, [teams, filter])

  const stats = useMemo(() => ({
    total:     teams.length,
    validated: teams.filter(isValidated).length,
    pending:   teams.filter((t) => !isValidated(t)).length,
  }), [teams])

  const handleValidate = async (teamId) => {
    setProcessing((p) => ({ ...p, [teamId]: true }))
    setActionErrors((p) => ({ ...p, [teamId]: null }))
    const previousTeams = [...teams]

    try {
      setTeams((prev) =>
        prev.map((t) => t.id === teamId ? { ...t, status: 'REGISTERED' } : t)
      )
      await validateTeam(teamId)
      setTimeout(async () => {
        const res = await getAllTeams()
        setTeams(res.data ?? [])
      }, 500)
    } catch (err) {
      setTeams(previousTeams)
      setActionErrors((p) => ({ ...p, [teamId]: err.userMessage ?? 'No se pudo validar.' }))
    } finally {
      setProcessing((p) => ({ ...p, [teamId]: false }))
    }
  }

  const handleUnlock = async (teamId) => {
    setProcessing((p) => ({ ...p, [teamId]: true }))
    setActionErrors((p) => ({ ...p, [teamId]: null }))
    const previousTeams = [...teams]

    try {
      setTeams((prev) =>
        prev.map((t) => t.id === teamId ? { ...t, status: 'DRAFT' } : t)
      )
      await unlockTeam(teamId)
      setTimeout(async () => {
        const res = await getAllTeams()
        setTeams(res.data ?? [])
      }, 500)
    } catch (err) {
      setTeams(previousTeams)
      setActionErrors((p) => ({ ...p, [teamId]: err.userMessage ?? 'No se pudo desbloquear.' }))
    } finally {
      setProcessing((p) => ({ ...p, [teamId]: false }))
    }
  }

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Equipos</h1>
        <p className={styles.sub}>Gestiona y valida los equipos inscritos en el torneo</p>
      </div>

      {loading && <p className={styles.loading}>Cargando equipos...</p>}
      {error   && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <>
          <div className={styles.statsRow}>
            {[
              { label: 'Total',     value: stats.total },
              { label: 'Validados', value: stats.validated },
              { label: 'Pendientes',value: stats.pending },
            ].map(({ label, value }) => (
              <div key={label} className={styles.statBox}>
                <span className={styles.statValue}>{value}</span>
                <span className={styles.statLabel}>{label}</span>
              </div>
            ))}
          </div>

          <div className={styles.filterBar}>
            {FILTERS.map((f) => (
              <button
                key={f}
                className={filter === f ? styles.tabActive : styles.tab}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className={styles.emptyMsg}>No hay equipos en esta categoría.</p>
          ) : (
            <div className={styles.teamGrid}>
              {filtered.map((team) => (
                <div key={team.id} className={styles.teamCard}>
                  <div className={styles.cardTop}>
                    <div className={styles.teamName}>{team.name}</div>
                    <Badge status={team.status ?? 'pending'} />
                  </div>
                  <div className={styles.teamMeta}>
                    <span>Miembros: <strong>{team.memberCount ?? '—'}</strong></span>
                    {team.captainId && <span>Cap. ID: <strong>{team.captainId}</strong></span>}
                  </div>
                  
                  <div className={styles.cardActions}>
                    {!isValidated(team) ? (
                      <button
                        className={styles.btnValidate}
                        disabled={processing[team.id]}
                        onClick={() => handleValidate(team.id)}
                      >
                        {processing[team.id] ? 'Procesando...' : 'Validar equipo'}
                      </button>
                    ) : (
                      <button
                        className={styles.btnUnlock}
                        disabled={processing[team.id]}
                        onClick={() => handleUnlock(team.id)}
                      >
                        {processing[team.id] ? 'Procesando...' : 'Desbloquear / Abrir Nómina'}
                      </button>
                    )}
                    
                    {actionErrors[team.id] && (
                      <p className={styles.cardError}>{actionErrors[team.id]}</p>
                    )}
                  </div>

                  {isValidated(team) && !processing[team.id] && (
                    <p className={styles.validatedMsg}>
                      {isCurrentlyLocked(team) ? 'Equipo cerrado' : 'Equipo validado'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </PageLayout>
  )
}

