import { useState, useEffect, useMemo } from 'react'
import PageLayout from '../../../components/layout/PageLayout/PageLayout'
import Badge from '../../../components/ui/Badge/Badge'
import { getAllTeams, validateTeam } from '../../../api/teams'
import styles from './OrgTeamsPage.module.css'

const FILTERS = ['Todos', 'Validados', 'Pendientes']

export default function OrgTeamsPage() {
  const [teams, setTeams]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filter, setFilter]   = useState('Todos')
  const [validating, setValidating] = useState({}) // { [teamId]: true }
  const [validateErrors, setValidateErrors] = useState({})

  useEffect(() => {
    getAllTeams()
      .then((res) => setTeams(res.data ?? []))
      .catch(() => setError('No se pudo cargar la lista de equipos.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'Validados') return teams.filter((t) => t.status === 'VALIDATED' || t.status === 'ACTIVE')
    if (filter === 'Pendientes') return teams.filter((t) => t.status !== 'VALIDATED' && t.status !== 'ACTIVE')
    return teams
  }, [teams, filter])

  const stats = useMemo(() => ({
    total:     teams.length,
    validated: teams.filter((t) => t.status === 'VALIDATED' || t.status === 'ACTIVE').length,
    pending:   teams.filter((t) => t.status !== 'VALIDATED' && t.status !== 'ACTIVE').length,
  }), [teams])

  const handleValidate = async (teamId) => {
    setValidating((p) => ({ ...p, [teamId]: true }))
    setValidateErrors((p) => ({ ...p, [teamId]: null }))
    try {
      await validateTeam(teamId)
      setTeams((prev) =>
        prev.map((t) => t.id === teamId ? { ...t, status: 'VALIDATED' } : t)
      )
    } catch (err) {
      setValidateErrors((p) => ({
        ...p,
        [teamId]: err.userMessage ?? 'No se pudo validar el equipo.',
      }))
    } finally {
      setValidating((p) => ({ ...p, [teamId]: false }))
    }
  }

  const isValidated = (t) => t.status === 'VALIDATED' || t.status === 'ACTIVE'

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
                  {!isValidated(team) && (
                    <div className={styles.cardActions}>
                      <button
                        className={styles.btnValidate}
                        disabled={validating[team.id]}
                        onClick={() => handleValidate(team.id)}
                      >
                        {validating[team.id] ? 'Validando...' : 'Validar equipo'}
                      </button>
                      {validateErrors[team.id] && (
                        <p className={styles.cardError}>{validateErrors[team.id]}</p>
                      )}
                    </div>
                  )}
                  {isValidated(team) && (
                    <p className={styles.validatedMsg}>Equipo validado</p>
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
