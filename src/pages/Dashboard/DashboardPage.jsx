import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import { useAuth } from '../../hooks/useAuth'
import { getEffectiveRole } from '../../utils/roles'
import { getTournament, getTopScorers, getMatchHistory } from '../../api/tournament'
import { getRefereeMatches } from '../../api/referee'
import styles from './DashboardPage.module.css'

const STATUS_LABELS = {
  DRAFT: 'Borrador', ACTIVE: 'Activo',
  IN_PROGRESS: 'En progreso', FINISHED: 'Finalizado',
}

function Avatar({ name }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?'
  return <div className={styles.avatar}>{initials}</div>
}

/* ── Cards reutilizables ────────────────────────────────────────── */

function TournamentStatusCard({ tournament }) {
  if (!tournament) return (
    <div className={`${styles.card} ${styles.card1}`}>
      <h2 className={styles.cardTitle}>Estado del torneo</h2>
      <p className={styles.emptyMsg}>No hay torneo activo.</p>
    </div>
  )
  return (
    <div className={`${styles.card} ${styles.card1}`}>
      <h2 className={styles.cardTitle}>Estado del torneo</h2>
      <div className={styles.tournamentInfo}>
        <div className={styles.statusBadge}>
          {STATUS_LABELS[tournament.status] ?? tournament.status}
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Equipos</span>
          <span className={styles.infoValue}>{tournament.teamsCount ?? '—'} / {tournament.maxTeams ?? '—'}</span>
        </div>
        {tournament.startDate && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Inicio</span>
            <span className={styles.infoValue}>
              {new Date(tournament.startDate).toLocaleDateString('es-CO')}
            </span>
          </div>
        )}
        {tournament.winner && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Campeón</span>
            <span className={`${styles.infoValue} ${styles.winner}`}>{tournament.winner.name}</span>
          </div>
        )}
      </div>
      <Link to="/tournament" className={styles.cardLink}>Ver detalles del torneo →</Link>
    </div>
  )
}

function BestPlayerCard({ scorers }) {
  const top = scorers?.[0]
  return (
    <div className={`${styles.card} ${styles.card2}`}>
      <h2 className={styles.cardTitle}>Mejor jugador</h2>
      {top ? (
        <>
          <div className={styles.avatarRow}>
            <Avatar name={top.playerName} />
            <div>
              <p className={styles.playerName}>{top.playerName}</p>
              <p className={styles.teamName}>{top.teamName}</p>
            </div>
          </div>
          <div className={styles.goalsBlock}>
            <span className={styles.goalsNumber}>{top.goals}</span>
            <span className={styles.goalsLabel}>goles</span>
          </div>
          {scorers.slice(1, 3).map((s, i) => (
            <div key={s.playerId} className={styles.miniScorer}>
              <span className={styles.miniRank}>{i + 2}.</span>
              <span className={styles.miniName}>{s.playerName}</span>
              <span className={styles.miniGoals}>{s.goals} goles</span>
            </div>
          ))}
        </>
      ) : (
        <p className={styles.emptyMsg}>No hay datos de goleadores aún.</p>
      )}
    </div>
  )
}

function NovedadesCard({ matches }) {
  const recent = (matches ?? []).slice(-3).reverse()
  return (
    <div className={`${styles.card} ${styles.card1}`}>
      <h2 className={styles.cardTitle}>Novedades</h2>
      {recent.length > 0 ? (
        <div className={styles.novedadesList}>
          {recent.map((m, i) => (
            <div key={i} className={styles.novedadItem}>
              <span className={styles.novedadTeams}>
                {m.homeTeamName ?? m.homeTeam?.name ?? '—'} vs {m.awayTeamName ?? m.awayTeam?.name ?? '—'}
              </span>
              <span className={styles.novedadScore}>
                {m.homeScore ?? 0} – {m.awayScore ?? 0}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.emptyMsg}>Sin resultados recientes.</p>
      )}
      <Link to="/calendar" className={styles.cardLink}>Ver calendario →</Link>
    </div>
  )
}

function ProximoPartidoCard({ matches }) {
  const next = (matches ?? []).find((m) => m.status === 'SCHEDULED')
  return (
    <div className={`${styles.card} ${styles.card2}`}>
      <h2 className={styles.cardTitle}>Próximo partido a arbitrar</h2>
      {next ? (
        <div className={styles.matchBlock}>
          <div className={styles.matchTeams}>
            <span className={styles.matchTeam}>{next.homeTeam?.name ?? '—'}</span>
            <span className={styles.matchVs}>vs</span>
            <span className={styles.matchTeam}>{next.awayTeam?.name ?? '—'}</span>
          </div>
          <div className={styles.matchMeta}>
            <span>{next.matchTime ?? '—'}</span>
            <span>Cancha: {next.field?.name ?? '—'}</span>
            {next.matchDate && (
              <span>{new Date(next.matchDate).toLocaleDateString('es-CO')}</span>
            )}
          </div>
        </div>
      ) : (
        <p className={styles.emptyMsg}>No tienes partidos asignados próximamente.</p>
      )}
      <Link to="/matches" className={styles.cardLink}>Ver todos mis partidos →</Link>
    </div>
  )
}

function QuickLinksCard({ role }) {
  const links = {
    estudiante: [
      { to: '/standings', label: 'Ver tabla de posiciones' },
      { to: '/players',   label: 'Buscar jugadores' },
      { to: '/profile',   label: 'Editar mi perfil' },
    ],
    jugador: [
      { to: '/team',         label: 'Ver mi equipo' },
      { to: '/invitations',  label: 'Mis invitaciones' },
      { to: '/standings',    label: 'Tabla de posiciones' },
    ],
    capitán: [
      { to: '/team',        label: 'Gestionar equipo' },
      { to: '/invitations', label: 'Invitaciones enviadas' },
      { to: '/payments',    label: 'Estado del pago' },
    ],
    organizador: [
      { to: '/organizer/teams',       label: 'Gestionar equipos' },
      { to: '/organizer/payments',    label: 'Revisar pagos' },
      { to: '/organizer/tournaments', label: 'Administrar torneo' },
    ],
    árbitro: [
      { to: '/matches',   label: 'Mis partidos asignados' },
      { to: '/standings', label: 'Tabla de posiciones' },
    ],
    padre: [
      { to: '/standings', label: 'Tabla de posiciones' },
      { to: '/calendar',  label: 'Calendario de partidos' },
    ],
    graduado: [
      { to: '/standings', label: 'Tabla de posiciones' },
      { to: '/calendar',  label: 'Calendario de partidos' },
    ],
  }
  const items = links[role] ?? links.estudiante
  return (
    <div className={`${styles.card} ${styles.card3}`}>
      <h2 className={styles.cardTitle}>Acciones rápidas</h2>
      <div className={styles.quickLinks}>
        {items.map((l) => (
          <Link key={l.to} to={l.to} className={styles.quickLink}>
            {l.label} <span className={styles.arrow}>→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ── Main ───────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { user } = useAuth()
  const role = getEffectiveRole(user)

  const [tournament, setTournament]       = useState(null)
  const [scorers, setScorers]             = useState([])
  const [matchHistory, setMatchHistory]   = useState([])
  const [refereeMatches, setRefereeMatches] = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      
      // Envolvemos todo en un gran try/catch para que un 500 no detenga la carga de la página
      try {
        const [tRes, sRes] = await Promise.allSettled([getTournament(), getTopScorers()])
        
        if (tRes.status === 'fulfilled') {
          setTournament(tRes.value.data)
        }
        
        if (sRes.status === 'fulfilled') {
          setScorers(sRes.value.data ?? [])
        }
      } catch (err) {
        console.log('[Dashboard] Note: Tournament data not available yet.')
      }

      try {
        if (role === 'árbitro') {
          const r = await getRefereeMatches()
          setRefereeMatches(r.data ?? [])
        } else if (['jugador', 'capitán', 'organizador'].includes(role)) {
          // El 500 aquí suele ser porque no hay partidos aún
          const r = await getMatchHistory(undefined, user?.teamId)
          setMatchHistory(r.data ?? [])
        }
      } catch (err) {
        // Silencioso: es normal que no haya partidos al inicio
      }
      
      setLoading(false)
    }
    fetchAll()
  }, [role, user?.teamId])

  const greeting = user?.name
    ? `Bienvenid${user.name.toLowerCase().endsWith('a') ? 'a' : 'o'}, ${user.name}`
    : 'Bienvenido'

  return (
    <PageLayout>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.welcome}>{greeting}</h1>
          <p className={styles.season}>TechCupFútbol — Temporada 2026</p>
        </div>
        <div className={styles.roleBadge}>{role.charAt(0).toUpperCase() + role.slice(1)}</div>
      </div>

      {loading && <p className={styles.loading}>Cargando...</p>}

      {!loading && (
        <div className={styles.grid}>
          {/* ── ÁRBITRO ── */}
          {role === 'árbitro' && (
            <>
              <NovedadesCard matches={matchHistory} />
              <ProximoPartidoCard matches={refereeMatches} />
              <QuickLinksCard role={role} />
            </>
          )}

          {/* ── ESTUDIANTE (sin equipo) / PADRE / GRADUADO ── */}
          {(role === 'estudiante' || role === 'padre' || role === 'graduado') && (
            <>
              <TournamentStatusCard tournament={tournament} />
              <BestPlayerCard scorers={scorers} />
              <QuickLinksCard role={role} />
            </>
          )}

          {/* ── JUGADOR / CAPITÁN / ORGANIZADOR ── */}
          {(role === 'jugador' || role === 'capitán' || role === 'organizador') && (
            <>
              <NovedadesCard matches={matchHistory} />
              <BestPlayerCard scorers={scorers} />
              <TournamentStatusCard tournament={tournament} />
            </>
          )}
        </div>
      )}
    </PageLayout>
  )
}
