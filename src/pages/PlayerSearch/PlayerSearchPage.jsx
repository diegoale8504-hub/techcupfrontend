import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Badge from '../../components/ui/Badge/Badge'
import Button from '../../components/ui/Button/Button'
import { searchUsers } from '../../api/users'
import { invitePlayer, getTeamInvitations } from '../../api/teams'
import { useAuth } from '../../hooks/useAuth'
import styles from './PlayerSearchPage.module.css'

const POSITION_OPTIONS = [
  { value: '', label: 'Todas las posiciones' },
  { value: 'GOALKEEPER', label: 'Portero' },
  { value: 'DEFENDER', label: 'Defensa' },
  { value: 'MIDFIELDER', label: 'Centrocampista' },
  { value: 'FORWARD', label: 'Delantero' },
]

const POSITION_LABELS = {
  GOALKEEPER: 'Portero',
  DEFENDER: 'Defensa',
  MIDFIELDER: 'Centrocampista',
  FORWARD: 'Delantero',
}

export default function PlayerSearchPage() {
  const { user } = useAuth()
  const isCaptain = user?.role === 'CAPTAIN'

  const [query, setQuery] = useState('')
  const [position, setPosition] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [semester, setSemester] = useState('')

  const [players, setPlayers] = useState([])
  const [sentInvitations, setSentInvitations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inviting, setInviting] = useState({}) 
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  const fetchSentInvitations = useCallback(async () => {
    if (isCaptain && user?.teamId) {
      try {
        const res = await getTeamInvitations(user.teamId)
        setSentInvitations(res.data || [])
      } catch (e) { console.warn('No se pudieron cargar invitaciones') }
    }
  }, [isCaptain, user?.teamId])

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    const params = {}
    if (availableOnly) params.available = true
    if (position) params.position = position
    const s = parseInt(semester, 10); if (!isNaN(s)) params.semester = s

    if (query && query.trim() !== '') {
      if (/^\d+$/.test(query.trim())) params.idNumber = query.trim()
      else params.name = query.trim()
    }

    try {
      const res = await searchUsers(params)
      const data = res.data
      const content = Array.isArray(data) ? data : (data.content || [])
      
      // Filtrado Final:
      // 1. Quitarme a mí
      // 2. Solo Rol PLAYER
      // 3. Si availableOnly está activo, quitar cualquiera que tenga teamId
      const filtered = content.filter(p => {
        const isNotMe = p.id !== user?.id
        const isPlayer = p.role === 'PLAYER' || p.userType === 'PLAYER'
        
        // Si pide solo libres, el backend debería filtrarlo, pero reforzamos aquí
        const isFree = !p.teamId && !p.teamName 
        if (availableOnly && !isFree) return false

        return isNotMe && isPlayer
      })

      setPlayers(filtered)
      await fetchSentInvitations()
    } catch (err) {
      setError('Error al cargar el mercado.')
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [query, position, availableOnly, semester, user?.id, user?.teamId, fetchSentInvitations])

  useEffect(() => {
    const timer = setTimeout(fetchPlayers, 400)
    return () => clearTimeout(timer)
  }, [fetchPlayers])

  const handleInvite = async (playerId) => {
    if (!user?.teamId) return
    setInviting((p) => ({ ...p, [playerId]: 'loading' }))
    try {
      await invitePlayer(user.teamId, playerId)
      setInviting((p) => ({ ...p, [playerId]: 'done' }))
      fetchSentInvitations()
    } catch (err) {
      alert(err.userMessage || 'Error al invitar.')
      setInviting((p) => ({ ...p, [playerId]: null }))
    }
  }

  const isAlreadyInvited = (playerId) => {
    return sentInvitations.some(inv => inv.playerId === playerId && inv.status === 'PENDING')
  }

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Mercado de Jugadores</h1>
        <p className={styles.sub}>Gestiona las incorporaciones de tu equipo.</p>
      </div>

      <div className={styles.filtersGrid}>
        <div className={styles.mainSearch}>
          <input className={styles.searchInput} type="text" placeholder="Nombre o Documento..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className={styles.advancedFilters}>
          <select className={styles.select} value={position} onChange={(e) => setPosition(e.target.value)}>
            {POSITION_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
          <input className={styles.miniInput} type="number" placeholder="Sem" value={semester} onChange={(e) => setSemester(e.target.value)} />
          <label className={styles.availableFilter}>
            <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} /> Solo Libres
          </label>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHead}>
              <th>Jugador</th>
              <th>Posición</th>
              <th>Situación</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className={styles.loadingCell}>Buscando...</td></tr>
            ) : (
              players.map((p) => {
                const isInMyTeam = p.teamId === user?.teamId
                const hasOtherTeam = p.teamId && p.teamId !== user?.teamId
                const alreadySent = isAlreadyInvited(p.id) || inviting[p.id] === 'done'
                
                return (
                  <tr key={p.id} className={styles.row}>
                    <td>
                      <div className={styles.playerName}>{p.name}</div>
                      <div className={styles.playerEmail}>{p.idNumber || p.document}</div>
                    </td>
                    <td>{POSITION_LABELS[p.mainPosition] || POSITION_LABELS[p.position] || '—'}</td>
                    <td>
                      {isInMyTeam ? (
                        <span className={styles.myTeamBadge}>En tu equipo</span>
                      ) : hasOtherTeam ? (
                        <span className={styles.inTeamLabel}>En equipo: <strong>{p.teamName || 'Registrado'}</strong></span>
                      ) : (
                        <Badge status="available" />
                      )}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedPlayer(p)}>Ver</Button>
                        {isCaptain && !p.teamId && !p.teamName && (
                          alreadySent ? (
                            <span className={styles.sent}>✓ Invitado</span>
                          ) : (
                            <Button variant="accent" size="sm" loading={inviting[p.id] === 'loading'} onClick={() => handleInvite(p.id)}>Invitar</Button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedPlayer && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPlayer(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setSelectedPlayer(null)}>×</button>
            <h3 style={{margin:0, fontSize: '24px'}}>{selectedPlayer.name}</h3>
            <p style={{marginBottom:20, color: '#666'}}>{selectedPlayer.email}</p>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}><label>Documento</label><span>{selectedPlayer.idNumber || '—'}</span></div>
              <div className={styles.infoItem}><label>Posición</label><span>{POSITION_LABELS[selectedPlayer.mainPosition] || '—'}</span></div>
              <div className={styles.infoItem}><label>Estado</label>
                <span style={{fontWeight:700, color: selectedPlayer.teamId ? '#ef4444' : '#16a34a'}}>
                  {selectedPlayer.teamName ? `En equipo: ${selectedPlayer.teamName}` : 'Libre'}
                </span>
              </div>
            </div>
            <div style={{marginTop:30, display:'flex', gap:10}}>
              {isCaptain && !selectedPlayer.teamId && !isAlreadyInvited(selectedPlayer.id) && (
                <Button variant="primary" fullWidth loading={inviting[selectedPlayer.id] === 'loading'} onClick={() => handleInvite(selectedPlayer.id)}>Enviar Invitación</Button>
              )}
              <Button variant="ghost" fullWidth onClick={() => setSelectedPlayer(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
