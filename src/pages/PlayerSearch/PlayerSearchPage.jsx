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
  const isCaptain = user?.roles?.includes('CAPTAIN')

  const [query, setQuery] = useState('')
  const [position, setPosition] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [players, setPlayers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState({}) // { [playerId]: 'loading' | 'done' }

  const fetchPlayers = useCallback(() => {
    setLoading(true)
    const params = {
      ...(query ? { name: query } : {}),
      ...(position ? { position } : {}),
      ...(availableOnly ? { available: true } : {}),
      page,
      size: PAGE_SIZE,
    }
    searchUsers(params)
      .then((res) => {
        const data = res.data
        setPlayers(Array.isArray(data) ? data : data.content ?? [])
        setTotal(data.totalElements ?? (Array.isArray(data) ? data.length : 0))
      })
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false))
  }, [query, position, availableOnly, page])

  // Debounce query changes
  useEffect(() => {
    const timer = setTimeout(fetchPlayers, 300)
    return () => clearTimeout(timer)
  }, [fetchPlayers])

  const handleInvite = async (playerId) => {
    if (!user?.teamId) return
    setInviting((p) => ({ ...p, [playerId]: 'loading' }))
    try {
      await invitePlayer(user.teamId, playerId)
      setInviting((p) => ({ ...p, [playerId]: 'done' }))
    } catch {
      setInviting((p) => ({ ...p, [playerId]: null }))
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Buscar jugadores</h1>
        <p className={styles.sub}>Encuentra y invita jugadores disponibles a tu equipo.</p>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar por nombre o correo..."
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
          Solo disponibles
        </label>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHead}>
              <th className={styles.nameCol}>Jugador</th>
              <th>Posición</th>
              <th>Equipo</th>
              <th>Estado</th>
              {isCaptain && <th>Acción</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={isCaptain ? 5 : 4} className={styles.loadingCell}>Buscando...</td></tr>
            )}
            {!loading && players.length === 0 && (
              <tr><td colSpan={isCaptain ? 5 : 4} className={styles.emptyCell}>No se encontraron jugadores.</td></tr>
            )}
            {!loading && players.map((player) => (
              <tr key={player.id} className={styles.row}>
                <td className={styles.nameCell}>
                  <div className={styles.playerName}>{player.name}</div>
                  <div className={styles.playerEmail}>{player.email}</div>
                </td>
                <td>{POSITION_LABELS[player.mainPosition] ?? '—'}</td>
                <td>{player.teamName ?? '—'}</td>
                <td>
                  <Badge status={player.available ? 'available' : 'in-team'} />
                </td>
                {isCaptain && (
                  <td>
                    {player.available ? (
                      inviting[player.id] === 'done' ? (
                        <span className={styles.sent}>Enviada ✓</span>
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
                    ) : (
                      <Button variant="secondary" size="sm">
                        Ver perfil
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
