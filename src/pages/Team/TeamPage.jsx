import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Button from '../../components/ui/Button/Button'
import { useAuth } from '../../hooks/useAuth'
import { getEffectiveRole } from '../../utils/roles'
import { getTeam, removePlayer, invitePlayer } from '../../api/teams'
import { searchUsers } from '../../api/users'
import styles from './TeamPage.module.css'

function Avatar({ name }) {
  const initials = name?.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() ?? '?'
  return <div className={styles.avatar}>{initials}</div>
}

export default function TeamPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const role = getEffectiveRole(user)
  const isCapitan = role === 'capitán'
  const teamId = user?.teamId

  const [team, setTeam]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [removing, setRemoving]       = useState(null)
  const [inviteSearch, setInviteSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching]     = useState(false)
  const [inviting, setInviting]       = useState(null)
  const [inviteMsg, setInviteMsg]     = useState(null)

  useEffect(() => {
    if (!teamId) { setLoading(false); return }
    getTeam(teamId)
      .then((r) => setTeam(r.data))
      .catch(() => setError('No se pudo cargar el equipo.'))
      .finally(() => setLoading(false))
  }, [teamId])

  const handleRemove = async (playerId) => {
    if (!window.confirm('¿Retirar a este jugador del equipo?')) return
    setRemoving(playerId)
    try {
      await removePlayer(teamId, playerId)
      setTeam((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== playerId),
      }))
    } catch {
      setError('No se pudo retirar al jugador.')
    } finally {
      setRemoving(null)
    }
  }

  const handleSearch = async () => {
    if (!inviteSearch.trim()) return
    setSearching(true)
    try {
      const r = await searchUsers({ name: inviteSearch, available: true })
      setSearchResults(r.data ?? [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleInvite = async (playerId) => {
    setInviting(playerId)
    setInviteMsg(null)
    try {
      await invitePlayer(teamId, playerId)
      setInviteMsg('Invitación enviada correctamente.')
      setSearchResults((prev) => prev.filter((p) => p.id !== playerId))
    } catch (err) {
      setInviteMsg(err.userMessage ?? 'No se pudo enviar la invitación.')
    } finally {
      setInviting(null)
    }
  }

  if (!teamId) {
    return (
      <PageLayout>
        <div className={styles.noTeam}>
          <h1 className={styles.heading}>Mi equipo</h1>
          <p className={styles.noTeamMsg}>No perteneces a ningún equipo aún.</p>
          <Button variant="primary" onClick={() => navigate('/captain')}>
            Crear equipo
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>{isCapitan ? 'Gestión de equipo' : 'Mi equipo'}</h1>
        {team && <p className={styles.sub}>{team.name}</p>}
      </div>

      {loading && <p className={styles.loading}>Cargando...</p>}
      {error   && <p className={styles.errorMsg}>{error}</p>}

      {!loading && team && (
        <div className={styles.grid}>
          {/* ── Members ── */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              Jugadores del equipo
              <span className={styles.memberCount}>{team.members?.length ?? 0} / 12</span>
            </h2>

            <div className={styles.memberList}>
              {(team.members ?? []).map((m) => (
                <div key={m.id} className={styles.memberRow}>
                  <Avatar name={m.name} />
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{m.name}</span>
                    <span className={styles.memberRole}>{m.userType ?? '—'}</span>
                  </div>
                  <span className={styles.jersey}>#{m.jerseyNumber ?? '—'}</span>
                  {isCapitan && m.id !== user?.id && (
                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemove(m.id)}
                      disabled={removing === m.id}
                      title="Retirar del equipo"
                    >
                      {removing === m.id ? '...' : '✕'}
                    </button>
                  )}
                </div>
              ))}
              {(team.members ?? []).length === 0 && (
                <p className={styles.emptyMsg}>No hay jugadores registrados aún.</p>
              )}
            </div>
          </div>

          {/* ── Invite (captain only) ── */}
          {isCapitan && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Invitar jugador</h2>
              <div className={styles.searchRow}>
                <input
                  className={styles.searchInput}
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={inviteSearch}
                  onChange={(e) => setInviteSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="primary" onClick={handleSearch} loading={searching} size="sm">
                  Buscar
                </Button>
              </div>

              {inviteMsg && (
                <p className={inviteMsg.includes('correctamente') ? styles.success : styles.errorMsg}>
                  {inviteMsg}
                </p>
              )}

              <div className={styles.resultList}>
                {searchResults.map((p) => (
                  <div key={p.id} className={styles.resultRow}>
                    <Avatar name={p.name} />
                    <div className={styles.memberInfo}>
                      <span className={styles.memberName}>{p.name}</span>
                      <span className={styles.memberRole}>{p.mainPosition ?? '—'}</span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={inviting === p.id}
                      onClick={() => handleInvite(p.id)}
                    >
                      Invitar
                    </Button>
                  </div>
                ))}
              </div>

              <div className={styles.cardNote}>
                También puedes buscar jugadores en la sección <a href="/players">Jugador</a>.
              </div>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  )
}
