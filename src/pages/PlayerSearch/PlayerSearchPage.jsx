import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Badge from '../../components/ui/Badge/Badge'
import Button from '../../components/ui/Button/Button'
import { searchUsers } from '../../api/users'
import { invitePlayer } from '../../api/teams'
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

const PAGE_SIZE = 7

export default function PlayerSearchPage() {
  const { user } = useAuth()
  const isCaptain = user?.role === 'CAPTAIN'

  const [query, setQuery] = useState('')
  const [position, setPosition] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false) // Cambiado a false para depuración inicial
  const [players, setPlayers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState({}) 
  const [selectedPlayer, setSelectedPlayer] = useState(null) // Para el detalle

  const fetchPlayers = useCallback(() => {
    setLoading(true)
    
    // Construimos los parámetros exactos que espera el backend de Spring
    const params = {
      role: 'PLAYER', // Filtro crítico: solo jugadores
      page,
      size: PAGE_SIZE,
      ...(availableOnly ? { available: true } : {}),
      ...(position ? { position } : {}),
    }

    // Si hay una consulta, la enviamos tanto para nombre como para documento 
    // para que el backend filtre por lo que coincida
    if (query) {
      if (/^\d+$/.test(query)) {
        params.document = query
      } else {
        params.name = query
      }
    }

    searchUsers(params)
      .then((res) => {
        const data = res.data
        // Manejo flexible de la respuesta (Lista directa o Page de Spring)
        const content = data.content || (Array.isArray(data) ? data : [])
        setPlayers(content)
        setTotal(data.totalElements ?? (Array.isArray(data) ? data.length : content.length))
      })
      .catch((err) => {
        console.error('Error en búsqueda:', err)
        setPlayers([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [query, position, availableOnly, page])

  // Debounce query changes
  useEffect(() => {
    const timer = setTimeout(fetchPlayers, 300)
    return () => clearTimeout(timer)
  }, [fetchPlayers])

  const handleInvite = async (playerId) => {
    if (!user?.teamId) {
      alert('Debes tener un equipo para invitar jugadores.')
      return
    }
    setInviting((p) => ({ ...p, [playerId]: 'loading' }))
    try {
      await invitePlayer(user.teamId, playerId)
      setInviting((p) => ({ ...p, [playerId]: 'done' }))
      // No cerramos el detalle si estaba abierto, solo marcamos como enviado
    } catch (err) {
      alert(err.userMessage ?? 'No se pudo enviar la invitación.')
      setInviting((p) => ({ ...p, [playerId]: null }))
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Mercado de Jugadores</h1>
        <p className={styles.sub}>Busca por nombre, documento o filtra por posición para completar tu equipo.</p>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Nombre o Documento..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0) }}
        />
        <select
          className={styles.select}
          value={position}
          onChange={(e) => { setPosition(e.target.value); setPage(0) }}
        >
          {POSITION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <label className={styles.availableFilter}>
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => { setAvailableOnly(e.target.checked); setPage(0) }}
          />
          Solo libres
        </label>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHead}>
              <th className={styles.nameCol}>Jugador</th>
              <th>Documento</th>
              <th>Posición</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className={styles.loadingCell}>Buscando...</td></tr>
            )}
            {!loading && players.length === 0 && (
              <tr><td colSpan={5} className={styles.emptyCell}>No se encontraron jugadores disponibles con esos criterios.</td></tr>
            )}
            {!loading && players.map((player) => (
              <tr key={player.id} className={styles.row}>
                <td className={styles.nameCell}>
                  <div className={styles.playerName}>{player.name}</div>
                  <div className={styles.playerEmail}>{player.email}</div>
                </td>
                <td>{player.document || '—'}</td>
                <td>{POSITION_LABELS[player.mainPosition] ?? POSITION_LABELS[player.position] ?? '—'}</td>
                <td>
                  <Badge status={player.available ? 'available' : 'in-team'} />
                </td>
                <td>
                  <div className={styles.rowActions}>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPlayer(player)}>
                      Ver Detalle
                    </Button>
                    {isCaptain && player.available && (
                      inviting[player.id] === 'done' ? (
                        <span className={styles.sent}>✓ Enviada</span>
                      ) : (
                        <Button
                          variant="accent"
                          size="sm"
                          loading={inviting[player.id] === 'loading'}
                          onClick={() => handleInvite(player.id)}
                        >
                          Invitar
                        </Button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalle (Simple) */}
      {selectedPlayer && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPlayer(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setSelectedPlayer(null)}>×</button>
            <div className={styles.modalHeader}>
              <div className={styles.modalAvatar}>{(selectedPlayer.name || 'U')[0].toUpperCase()}</div>
              <div>
                <h3>{selectedPlayer.name}</h3>
                <p>{selectedPlayer.email}</p>
              </div>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Documento</label>
                  <span>{selectedPlayer.document || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Posición</label>
                  <span>{POSITION_LABELS[selectedPlayer.mainPosition] ?? POSITION_LABELS[selectedPlayer.position] ?? '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Estado</label>
                  <Badge status={selectedPlayer.available ? 'available' : 'in-team'} />
                </div>
                <div className={styles.infoItem}>
                  <label>Teléfono</label>
                  <span>{selectedPlayer.phone || '—'}</span>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              {isCaptain && selectedPlayer.available && (
                <Button
                  variant="primary"
                  fullWidth
                  loading={inviting[selectedPlayer.id] === 'loading'}
                  disabled={inviting[selectedPlayer.id] === 'done'}
                  onClick={() => handleInvite(selectedPlayer.id)}
                >
                  {inviting[selectedPlayer.id] === 'done' ? 'Invitación enviada' : 'Enviar invitación al equipo'}
                </Button>
              )}
              <Button variant="ghost" fullWidth onClick={() => setSelectedPlayer(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.pagination}>
        <span className={styles.pageInfo}>
          Mostrando {players.length} de {total} jugadores
        </span>
        <div className={styles.pageControls}>
          <button
            className={styles.pageBtn}
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={[styles.pageBtn, i === page ? styles.pageBtnActive : ''].join(' ')}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </button>
        </div>
      </div>
    </PageLayout>
  )
}
