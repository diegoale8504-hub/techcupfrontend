import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getTeam, getMyTeam } from '../../api/teams'
import { getUserById } from '../../api/users'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Button from '../../components/ui/Button/Button'
import styles from './TeamPage.module.css'

const STATUS_CONFIG = {
  FORMING:   { label: 'En Formación', color: '#92400e', bg: '#fef3c7' },
  COMPLETE:  { label: 'Completo',     color: '#1e40af', bg: '#dbeafe' },
  LOCKED:    { label: 'Bloqueado',    color: '#991b1b', bg: '#fee2e2' },
  VALIDATED: { label: 'Validado',     color: '#166534', bg: '#dcfce7' },
}

const POSITION_LABELS = {
  GOALKEEPER: 'Portero',
  DEFENDER:   'Defensa',
  MIDFIELDER: 'Centrocampista',
  FORWARD:    'Delantero',
}

function Avatar({ name, size = 46 }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'
  return (
    <div
      className={styles.avatar}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.35) }}
    >
      {initials}
    </div>
  )
}

function StatCard({ icon, label, value, highlight }) {
  return (
    <div className={`${styles.statCard} ${highlight ? styles.statCardHighlight : ''}`}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value ?? '—'}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

function ProgressBar({ current, max = 12 }) {
  const pct = Math.min((current / max) * 100, 100)
  const isReady = current >= 7
  const thresholdPct = (7 / max) * 100

  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressHeader}>
        <span className={styles.progressLabel}>Progreso del plantel</span>
        <span className={`${styles.progressCount} ${isReady ? styles.progressReady : ''}`}>
          {current} / {max} jugadores
        </span>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${isReady ? styles.progressFillReady : ''}`}
          style={{ width: `${pct}%` }}
        />
        <div className={styles.progressMark} style={{ left: `${thresholdPct}%` }} />
      </div>
      <div className={styles.progressLegend}>
        <span>0</span>
        <span className={styles.progressMin}>Mínimo: 7</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export default function TeamPage() {
  const { id }     = useParams()
  const { user }   = useAuth()
  const navigate   = useNavigate()

  // Si hay ID en la URL lo usamos, si no, usamos el del usuario (mi equipo)
  const isViewingSpecific = !!id && id !== 'null' && id !== 'undefined'
  const teamId = isViewingSpecific ? id : user?.teamId

  const [team,    setTeam]    = useState(null)
  const [members, setMembers] = useState([])
  const [captain, setCaptain] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchMembers = useCallback(async (memberIds = [], captainId) => {
    if (!memberIds.length) { setMembers([]); return }
    
    // Resolvemos los nombres de los usuarios concurrentemente
    const results = await Promise.allSettled(memberIds.map(mid => getUserById(mid)))
    const resolved = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value.data)
    
    setMembers(resolved)
    setCaptain(resolved.find(m => m.id === captainId) ?? null)
  }, [])

  const fetchData = useCallback(async () => {
    if (!teamId) { 
      setLoading(false)
      return 
    }
    
    setLoading(true)
    setError(null)
    try {
      // Si estamos viendo "mi equipo" sin ID, usamos getMyTeam
      const res  = isViewingSpecific ? await getTeam(teamId) : await getMyTeam()
      const data = res.data
      setTeam(data)
      
      // Resolvemos los IDs de los miembros a objetos de usuario
      await fetchMembers(data.memberIds ?? [], data.captainId)
    } catch (err) {
      setError(err.userMessage ?? 'No se pudo cargar la información del equipo.')
    } finally {
      setLoading(false)
    }
  }, [teamId, isViewingSpecific, fetchMembers])

  useEffect(() => { 
    fetchData() 
  }, [fetchData])

  /* ── LOADING STATE ── */
  if (loading) {
    return (
      <PageLayout>
        <div className={styles.container}>
          <div className={styles.skeletonHero} />
          <div className={styles.skeletonGrid}>
            {[1, 2, 3, 4].map(i => <div key={i} className={styles.skeletonCard} />)}
          </div>
          <div className={styles.skeletonBlock} />
        </div>
      </PageLayout>
    )
  }

  /* ── NO TEAM STATE ── */
  if (!teamId && !loading) {
    return (
      <PageLayout>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>⚽</span>
            <h2 className={styles.emptyTitle}>Sin equipo</h2>
            <p className={styles.emptyText}>Parece que aún no perteneces a ningún equipo en esta temporada.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Button variant="primary" onClick={() => navigate('/teams/create')}>
                Crear equipo
              </Button>
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                Volver al inicio
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    )
  }

  /* ── ERROR STATE ── */
  if (error) {
    return (
      <PageLayout>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <span className={styles.errorIcon}>⚠️</span>
            <p className={styles.errorText}>{error}</p>
            <Button variant="primary" onClick={fetchData}>Intentar de nuevo</Button>
          </div>
        </div>
      </PageLayout>
    )
  }

  const statusCfg    = STATUS_CONFIG[team?.status] ?? STATUS_CONFIG.FORMING
  const memberCount  = members.length
  const isCaptain    = user?.id === team?.captainId
  
  // Cálculo de antigüedad
  const ageMs        = team?.createdAt ? Date.now() - new Date(team.createdAt) : 0
  const ageDays      = Math.floor(ageMs / 86_400_000)
  const ageLabel     = ageDays === 0 ? 'Hoy' : ageDays === 1 ? '1 día' : `${ageDays} días`

  // Fondo del Hero basado en los colores del equipo
  const heroBg = team?.primaryColor && team?.secondaryColor
    ? `linear-gradient(135deg, ${team.primaryColor} 0%, ${team.secondaryColor} 100%)`
    : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'

  return (
    <PageLayout>
      <div className={styles.container}>
        
        {/* ── HEADER / HERO ── */}
        <header className={styles.hero} style={{ background: heroBg }}>
          <div className={styles.heroLogo}>
            {team?.logo
              ? <img src={team.logo} alt={team.name} className={styles.logoImg} />
              : <span className={styles.logoFallback}>⚽</span>
            }
          </div>

          <div className={styles.heroBody}>
            <h1 className={styles.heroName}>{team?.name}</h1>

            <div className={styles.heroBadges}>
              <span
                className={styles.statusBadge}
                style={{ color: statusCfg.color, background: statusCfg.bg }}
              >
                {statusCfg.label}
              </span>

              {team?.primaryColor && (
                <div className={styles.swatches}>
                  <div
                    className={styles.swatch}
                    style={{ background: team.primaryColor }}
                    title={`Color principal: ${team.primaryColor}`}
                  />
                  <div
                    className={styles.swatch}
                    style={{ background: team.secondaryColor }}
                    title={`Color secundario: ${team.secondaryColor}`}
                  />
                </div>
              )}
            </div>

            {team?.createdAt && (
              <p className={styles.heroDate}>
                Miembro desde el{' '}
                {new Date(team.createdAt).toLocaleDateString('es-CO', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            )}
          </div>
        </header>

        {/* ── RESUMEN EN CARDS ── */}
        <div className={styles.statsGrid}>
          <StatCard
            icon="👥"
            label="Plantilla"
            value={`${memberCount} / 12`}
            highlight={memberCount >= 7}
          />
          <StatCard icon="🏆" label="Estado"  value={statusCfg.label} />
          <StatCard icon="👑" label="Capitán" value={captain?.name || 'Por definir'} />
          <StatCard icon="📅" label="Tiempo"  value={ageLabel} />
        </div>

        {/* ── PROGRESO DE INSCRIPCIÓN ── */}
        <section className={styles.card}>
          <ProgressBar current={memberCount} />
        </section>

        {/* ── LISTA DE MIEMBROS (PLANTILLA) ── */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>👥 Plantilla Actual</h2>
            <span className={styles.statLabel}>{memberCount} Jugadores</span>
          </div>

          <div className={styles.rosterGrid}>
            {members.map(m => {
              const isCap = m.id === team?.captainId
              return (
                <div
                  key={m.id}
                  className={`${styles.memberCard} ${isCap ? styles.memberCardCaptain : ''}`}
                >
                  <Avatar name={m.name} size={42} />
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{m.name}</span>
                    <div className={styles.memberMeta}>
                      {isCap && <span className={styles.captainBadge}>Capitán</span>}
                      <span className={styles.posLabel}>
                        {POSITION_LABELS[m.mainPosition] || 'Jugador'}
                      </span>
                    </div>
                  </div>
                  {m.playerNumber && (
                    <span className={styles.jersey}>#{m.playerNumber}</span>
                  )}
                </div>
              )
            })}

            {members.length === 0 && (
              <p className={styles.emptyText} style={{ gridColumn: '1/-1' }}>
                No hay jugadores registrados en la plantilla.
              </p>
            )}
          </div>
        </section>

        {/* ── ACCIONES SECUNDARIAS ── */}
        <div className={styles.actions}>
          <Link to="/tournament" className={styles.actionBtn}>
            <span>🏆</span> Ver Torneo
          </Link>
          <Link to="/standings" className={styles.actionBtn}>
            <span>📊</span> Ver Estadísticas
          </Link>
          {isCaptain && (
            <Link
              to={`/teams/${team.id}/manage`}
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            >
              <span>⚙️</span> Gestionar Equipo
            </Link>
          )}
        </div>

      </div>
    </PageLayout>
  )
}
