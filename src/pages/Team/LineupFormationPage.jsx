import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import { useAuth } from '../../hooks/useAuth'
import { getMyTeam, getTeam } from '../../api/teams'
import { getUserById } from '../../api/users'
import { getAllTournaments, getMatchSchedules } from '../../api/tournament'
import { createLineup, updateLineup, getMatchLineups } from '../../api/lineup'
import styles from './LineupFormationPage.module.css'

// ── Formaciones disponibles para fútbol 8 (GK + 7 jugadores de campo) ──
// Formato slots: { id, role, label, position, fieldX, fieldY }
// fieldX/Y: 0=izquierda/arriba — 1=derecha/abajo. GK siempre en Y≈0.88

const mkGk  = ()                          => ({ id: 1, role: 'GK',  label: 'Portero',         position: 'GOALKEEPER', fieldX: 0.5,  fieldY: 0.88 })
const mkDef = (id, label, x, y = 0.68)   => ({ id,    role: 'DEF', label,                    position: 'DEFENDER',   fieldX: x,    fieldY: y    })
const mkMid = (id, label, x, y = 0.46)   => ({ id,    role: 'MID', label,                    position: 'MIDFIELDER', fieldX: x,    fieldY: y    })
const mkFwd = (id, label, x, y = 0.20)   => ({ id,    role: 'FWD', label,                    position: 'FORWARD',    fieldX: x,    fieldY: y    })

export const FORMATIONS = {
  '2-3-2': [
    mkGk(),
    mkDef(2, 'Defensa Izq',     0.28), mkDef(3, 'Defensa Der',     0.72),
    mkMid(4, 'Medio Izq',       0.18, 0.47), mkMid(5, 'Medio Cen', 0.5, 0.43), mkMid(6, 'Medio Der', 0.82, 0.47),
    mkFwd(7, 'Delantero Izq',   0.33, 0.19), mkFwd(8, 'Delantero Der', 0.67, 0.19),
  ],
  '2-2-3': [
    mkGk(),
    mkDef(2, 'Defensa Izq',     0.28), mkDef(3, 'Defensa Der',     0.72),
    mkMid(4, 'Medio Izq',       0.28, 0.47), mkMid(5, 'Medio Der', 0.72, 0.47),
    mkFwd(6, 'Delantero Izq',   0.22, 0.19), mkFwd(7, 'Delantero Cen', 0.5, 0.14), mkFwd(8, 'Delantero Der', 0.78, 0.19),
  ],
  '3-2-2': [
    mkGk(),
    mkDef(2, 'Def Izq',         0.18, 0.70), mkDef(3, 'Def Cen', 0.5, 0.66), mkDef(4, 'Def Der', 0.82, 0.70),
    mkMid(5, 'Medio Izq',       0.3,  0.46), mkMid(6, 'Medio Der', 0.7, 0.46),
    mkFwd(7, 'Delantero Izq',   0.33, 0.19), mkFwd(8, 'Delantero Der', 0.67, 0.19),
  ],
  '3-3-1': [
    mkGk(),
    mkDef(2, 'Def Izq',         0.18, 0.70), mkDef(3, 'Def Cen', 0.5, 0.66), mkDef(4, 'Def Der', 0.82, 0.70),
    mkMid(5, 'Medio Izq',       0.18, 0.47), mkMid(6, 'Medio Cen', 0.5, 0.43), mkMid(7, 'Medio Der', 0.82, 0.47),
    mkFwd(8, 'Delantero',       0.5,  0.14),
  ],
  '2-4-1': [
    mkGk(),
    mkDef(2, 'Defensa Izq',     0.28), mkDef(3, 'Defensa Der',     0.72),
    mkMid(4, 'Medio Izq',       0.15, 0.46), mkMid(5, 'Medio CIzq', 0.4, 0.43), mkMid(6, 'Medio CDer', 0.6, 0.43), mkMid(7, 'Medio Der', 0.85, 0.46),
    mkFwd(8, 'Delantero',       0.5,  0.14),
  ],
  '1-4-2': [
    mkGk(),
    mkDef(2, 'Defensa Cen',     0.5,  0.70),
    mkMid(3, 'Medio Izq',       0.15, 0.46), mkMid(4, 'Medio CIzq', 0.4, 0.43), mkMid(5, 'Medio CDer', 0.6, 0.43), mkMid(6, 'Medio Der', 0.85, 0.46),
    mkFwd(7, 'Delantero Izq',   0.33, 0.19), mkFwd(8, 'Delantero Der', 0.67, 0.19),
  ],
  '4-2-1': [
    mkGk(),
    mkDef(2, 'Def Izq',         0.13, 0.70), mkDef(3, 'Def CIzq', 0.37, 0.68), mkDef(4, 'Def CDer', 0.63, 0.68), mkDef(5, 'Def Der', 0.87, 0.70),
    mkMid(6, 'Medio Izq',       0.33, 0.46), mkMid(7, 'Medio Der', 0.67, 0.46),
    mkFwd(8, 'Delantero',       0.5,  0.14),
  ],
  '3-1-3': [
    mkGk(),
    mkDef(2, 'Def Izq',         0.18, 0.70), mkDef(3, 'Def Cen', 0.5, 0.66), mkDef(4, 'Def Der', 0.82, 0.70),
    mkMid(5, 'Medio Cen',       0.5,  0.46),
    mkFwd(6, 'Delantero Izq',   0.18, 0.20), mkFwd(7, 'Delantero Cen', 0.5, 0.14), mkFwd(8, 'Delantero Der', 0.82, 0.20),
  ],
}

const DEFAULT_FORMATION = '2-3-2'

const ROLE_COLOR = { GK: '#f59e0b', DEF: '#3b82f6', MID: '#10b981', FWD: '#ef4444' }

const ROLE_LABEL = { GK: 'Portero', DEF: 'Defensa', MID: 'Mediocampista', FWD: 'Delantero' }

function formatMatchDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function LineupFormationPage() {
  const { id: paramTeamId } = useParams()
  const { user } = useAuth()

  const [team,           setTeam]           = useState(null)
  const [players,        setPlayers]        = useState([])
  const [matches,        setMatches]        = useState([])
  const [selectedMatch,  setSelectedMatch]  = useState(null)
  const [formation,      setFormation]      = useState(DEFAULT_FORMATION)
  const [assigned,       setAssigned]       = useState({})   // slotId → player
  const [existingLineup, setExistingLineup] = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)
  const [error,          setError]          = useState(null)
  const [draggedPlayer,  setDraggedPlayer]  = useState(null)
  const dragSource = useRef(null)

  const slots = FORMATIONS[formation] ?? FORMATIONS[DEFAULT_FORMATION]

  // ── Carga inicial ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        let teamData = null
        const tid = paramTeamId ?? user?.teamId
        if (tid && tid !== 'null' && tid !== 'undefined') {
          try { teamData = (await getTeam(tid)).data } catch { /* fallback */ }
        }
        if (!teamData) {
          try { teamData = (await getMyTeam()).data } catch { /* nada */ }
        }
        if (!teamData) { setError('No se encontró el equipo.'); setLoading(false); return }
        setTeam(teamData)

        // Jugadores
        const memberIds = teamData.memberIds ?? []
        const results = await Promise.allSettled(memberIds.map((mid) => getUserById(mid)))
        setPlayers(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value.data)
            .map((u) => ({ id: u.id, name: u.name, jerseyNumber: u.jerseyNumber, mainPosition: u.mainPosition }))
        )

        // Partidos del torneo activo
        const tournaments = (await getAllTournaments()).data ?? []
        const activeTournament = tournaments.find((t) => t.status !== 'FINISHED') ?? null
        if (activeTournament) {
          const allMatches = (await getMatchSchedules(activeTournament.id)).data ?? []
          const teamMatches = allMatches.filter(
            (m) => m.homeTeamId === teamData.id || m.awayTeamId === teamData.id
          )
          setMatches(teamMatches)
          if (teamMatches.length > 0) setSelectedMatch(teamMatches[0])
        }
      } catch {
        setError('No se pudieron cargar los datos. Inténtalo de nuevo.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [paramTeamId, user?.teamId])

  // ── Cargar alineación guardada al cambiar partido ──────────────────
  useEffect(() => {
    if (!selectedMatch || !team) return
    const matchId = selectedMatch.id ?? selectedMatch.matchScheduleId
    const localKey = `lineup_draft_${team.id}_${matchId}`

    const load = async () => {
      try {
        // 1. Intentar cargar del localStorage primero (prioridad front solicitado)
        const localData = localStorage.getItem(localKey)
        let savedLineup = null

        if (localData) {
          savedLineup = JSON.parse(localData)
        } else {
          // 2. Si no hay en local, intentar backend
          const lineups = (await getMatchLineups(matchId)).data ?? []
          savedLineup = lineups.find((l) => l.teamId === team.id)
        }

        if (savedLineup) {
          setExistingLineup(savedLineup)
          setFormation(savedLineup.formation && FORMATIONS[savedLineup.formation] ? savedLineup.formation : DEFAULT_FORMATION)
          const activeSlots = FORMATIONS[savedLineup.formation && FORMATIONS[savedLineup.formation] ? savedLineup.formation : DEFAULT_FORMATION]
          const newAssigned = {}
          savedLineup.starters.forEach((s) => {
            const slot = activeSlots.find(
              (sl) => sl.position === s.position &&
                Math.abs(sl.fieldX - s.fieldX) < 0.15 &&
                Math.abs(sl.fieldY - s.fieldY) < 0.15
            ) ?? activeSlots.find((sl) => sl.position === s.position && !newAssigned[sl.id])
            if (slot) newAssigned[slot.id] = { id: s.playerId, name: s.playerName ?? '', jerseyNumber: null }
          })
          setAssigned(newAssigned)
        } else {
          setExistingLineup(null)
          setAssigned({})
        }
      } catch {
        setExistingLineup(null)
        setAssigned({})
      }
    }
    load()
  }, [selectedMatch, team])

  // ── Cambiar formación ─────────────────────────────────────────────
  const handleFormationChange = (newFormation) => {
    setFormation(newFormation)
    setAssigned({})
    setExistingLineup(null)
    setSaved(false)
    setError(null)
  }

  // ── Drag & Drop ───────────────────────────────────────────────────
  const handleDragStartFromList = (player) => {
    setDraggedPlayer(player)
    dragSource.current = 'list'
  }

  const handleDragStartFromSlot = (slotId) => {
    const player = assigned[slotId]
    if (!player) return
    setDraggedPlayer(player)
    dragSource.current = slotId
  }

  const handleDropOnSlot = (slotId) => {
    if (!draggedPlayer) return
    setAssigned((prev) => {
      const next = { ...prev }
      if (typeof dragSource.current === 'number') delete next[dragSource.current]
      next[slotId] = draggedPlayer
      return next
    })
    setDraggedPlayer(null)
    dragSource.current = null
  }

  const handleDropOnList = () => {
    if (draggedPlayer && typeof dragSource.current === 'number') {
      setAssigned((prev) => {
        const next = { ...prev }
        delete next[dragSource.current]
        return next
      })
    }
    setDraggedPlayer(null)
    dragSource.current = null
  }

  const removeFromSlot = (slotId) => {
    setAssigned((prev) => { const n = { ...prev }; delete n[slotId]; return n })
  }

  // ── Guardar ───────────────────────────────────────────────────────
  const handleSave = async () => {
    const starters = slots
      .filter((s) => assigned[s.id])
      .map((s) => ({ 
        playerId: assigned[s.id].id, 
        playerName: assigned[s.id].name,
        position: s.position, 
        fieldX: s.fieldX, 
        fieldY: s.fieldY 
      }))

    if (starters.length < slots.length) { 
      setError(`Debes completar la alineación con los ${slots.length} jugadores.`); 
      return; 
    }

    const matchId = selectedMatch?.id ?? selectedMatch?.matchScheduleId
    const body = { formation, starters, reserveIds: [] }
    // Si no hay matchId, usamos una clave general para el equipo
    const localKey = matchId 
      ? `lineup_draft_${team.id}_${matchId}` 
      : `lineup_draft_${team.id}_general`

    setSaving(true); setError(null); setSaved(false)
    try {
      // Guardar en Front (localStorage)
      localStorage.setItem(localKey, JSON.stringify(body))
      
      // Intentar guardar en Backend solo si hay un partido
      if (matchId) {
        try {
          if (existingLineup?.id) {
            await updateLineup(matchId, existingLineup.id, body)
          } else {
            const res = await createLineup(matchId, body)
            setExistingLineup(res.data)
          }
        } catch (apiErr) {
          console.warn('No se pudo sincronizar con el servidor, pero se guardó localmente.', apiErr)
        }
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('No se pudo guardar la alineación en el navegador.')
    } finally {
      setSaving(false)
    }
  }

  const handleClear = () => { 
    setAssigned({}); 
    setExistingLineup(null); 
    setSaved(false); 
    setError(null);
    if (team) {
      const matchId = selectedMatch?.id ?? selectedMatch?.matchScheduleId
      const localKey = matchId 
        ? `lineup_draft_${team.id}_${matchId}` 
        : `lineup_draft_${team.id}_general`
      localStorage.removeItem(localKey)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────
  const filledCount   = Object.values(assigned).filter(p => p && p.id).length
  const assignedIds   = new Set(Object.values(assigned).map((p) => p?.id).filter(Boolean))
  const available     = players.filter((p) => !assignedIds.has(p.id))
  const inField       = players.filter((p) => assignedIds.has(p.id))
  const canSave       = filledCount === slots.length && !saving

  // ── Render ────────────────────────────────────────────────────────
  if (loading) return <PageLayout><p className={styles.stateMsg}>Cargando alineación...</p></PageLayout>

  return (
    <PageLayout>

      {/* ── Cabecera ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {team?.logo
            ? <img src={team.logo} alt={team.name} className={styles.teamLogo} />
            : <div className={styles.teamLogoPlaceholder}></div>
          }
          <div>
            <h1 className={styles.heading}>Formación del Equipo</h1>
            <p className={styles.sub}>{team?.name}</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.formationBadge}>{formation}</span>
          <span className={styles.filledCount}>{filledCount}/{slots.length} jugadores</span>
        </div>
      </div>

      {/* ── Selector de formación ── */}
      <div className={styles.formationSelector}>
        <span className={styles.formationSelectorLabel}>Formación:</span>
        <div className={styles.formationButtons}>
          {Object.keys(FORMATIONS).map((f) => (
            <button
              key={f}
              className={`${styles.fBtn} ${formation === f ? styles.fBtnActive : ''}`}
              onClick={() => handleFormationChange(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Leyenda de colores ── */}
      <div className={styles.legend}>
        {Object.entries(ROLE_LABEL).map(([role, label]) => (
          <span key={role} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: ROLE_COLOR[role] }} />
            {label}
          </span>
        ))}
      </div>

      {/* ── Selector de partido ── */}
      <div className={styles.matchSelector}>
        <label className={styles.matchLabel}>Partido:</label>
        {matches.length === 0
          ? <span className={styles.noMatches}>No hay partidos programados para tu equipo.</span>
          : (
            <select
              className={styles.matchSelect}
              value={selectedMatch?.id ?? selectedMatch?.matchScheduleId ?? ''}
              onChange={(e) => {
                const m = matches.find((mx) => (mx.id ?? mx.matchScheduleId) === e.target.value)
                setSelectedMatch(m ?? null)
                setAssigned({})
                setExistingLineup(null)
              }}
            >
              {matches.map((m) => {
                const mid = m.id ?? m.matchScheduleId
                return (
                  <option key={mid} value={mid}>
                    {m.homeTeamName ?? 'Local'} vs {m.awayTeamName ?? 'Visitante'} — {formatMatchDate(m.matchDate ?? m.scheduledDate)}
                  </option>
                )
              })}
            </select>
          )
        }
        {existingLineup && <span className={styles.existingBadge}>✓ Guardada</span>}
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}
      {saved && <p className={styles.successMsg}>Alineación guardada correctamente.</p>}

      {/* ── Layout principal ── */}
      <div className={styles.content}>

        {/* ── CAMPO ── */}
        <div className={styles.fieldWrapper}>
          <div className={styles.field}>
            {/* Líneas decorativas */}
            <div className={styles.fieldLines}>
              <div className={styles.centerLine} />
              <div className={styles.centerCircle} />
              <div className={styles.penaltyTop} />
              <div className={styles.penaltyBottom} />
              <div className={styles.goalTop} />
              <div className={styles.goalBottom} />
            </div>

            {/* Posiciones */}
            {slots.map((slot) => {
              const player = assigned[slot.id]
              return (
                <div
                  key={slot.id}
                  className={`${styles.slot} ${player ? styles.slotFilled : styles.slotEmpty}`}
                  style={{ left: `calc(${slot.fieldX * 100}% - 36px)`, top: `calc(${slot.fieldY * 100}% - 36px)`, '--role-color': ROLE_COLOR[slot.role] }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnSlot(slot.id)}
                >
                  {player ? (
                    <div
                      className={styles.playerPin}
                      draggable
                      onDragStart={() => handleDragStartFromSlot(slot.id)}
                    >
                      <span className={styles.pinNumber}>#{player.jerseyNumber ?? '?'}</span>
                      <span className={styles.pinName}>{player.name?.split(' ')[0] ?? '—'}</span>
                      <button className={styles.pinRemove} onClick={() => removeFromSlot(slot.id)} title="Quitar">×</button>
                    </div>
                  ) : (
                    <div className={styles.emptySlot}>
                      <span className={styles.slotRole}>{slot.label}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── PANEL DERECHO ── */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Jugadores disponibles</h2>
          <p className={styles.panelHint}>Arrastra al campo o haz clic en ×</p>

          <div
            className={styles.playersList}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnList}
          >
            {available.length === 0 && players.length === 0 && (
              <p className={styles.emptyMsg}>El equipo no tiene jugadores registrados.</p>
            )}
            {available.length === 0 && players.length > 0 && (
              <p className={styles.emptyMsg}>Todos los jugadores están en el campo.</p>
            )}
            {available.map((p) => (
              <div key={p.id} className={styles.playerItem} draggable onDragStart={() => handleDragStartFromList(p)}>
                <div className={styles.playerBadge}>{p.jerseyNumber != null ? `#${p.jerseyNumber}` : '—'}</div>
                <span className={styles.playerName}>{p.name}</span>
              </div>
            ))}
            {inField.map((p) => (
              <div key={p.id} className={`${styles.playerItem} ${styles.playerInField}`}>
                <div className={styles.playerBadge}>{p.jerseyNumber != null ? `#${p.jerseyNumber}` : '—'}</div>
                <span className={styles.playerName}>{p.name}</span>
                <span className={styles.inFieldTag}>En cancha</span>
              </div>
            ))}
          </div>

          <div className={styles.actions}>
            {filledCount < slots.length && selectedMatch && (
              <p className={styles.saveHint}>
                Faltan {slots.length - filledCount} jugador{slots.length - filledCount !== 1 ? 'es' : ''} para completar la alineación
              </p>
            )}
            <button
              className={styles.btnSave}
              onClick={handleSave}
              disabled={saving || filledCount < slots.length}
            >
              {saving ? 'Guardando...' : existingLineup ? 'Actualizar alineación' : 'Guardar alineación'}
            </button>
            <button className={styles.btnClear} onClick={handleClear}>Limpiar campo</button>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
