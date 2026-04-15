import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  getTeam, getMyTeam, getAllTeams, getTeamInvitations, getTeamLeaveRequests,
  invitePlayer, removePlayer, respondLeaveRequest,
  validateTeam, dissolveTeam, uploadTeamLogo,
} from '../../api/teams'
import { getUserById } from '../../api/users'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import styles from './ManageTeam.module.css'

export default function ManageTeam() {
  const { id } = useParams()
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [team,         setTeam]         = useState(null)
  const [members,      setMembers]       = useState([])
  const [invitations,  setInvitations]   = useState([])
  const [leaveRequests,setLeaveRequests] = useState([])
  const [loading,      setLoading]       = useState(true)
  const [error,        setError]         = useState(null)
  const [invitePlayerId, setInvitePlayerId] = useState('')
  const [isSubmitting, setIsSubmitting]  = useState(false)

  // ── Fetch member details from memberIds array ─────────────────────
  const fetchMembers = useCallback(async (memberIds = []) => {
    if (!memberIds.length) { setMembers([]); return }
    const results = await Promise.allSettled(memberIds.map(mid => getUserById(mid)))
    setMembers(
      results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value.data)
    )
  }, [])

  // ── Main data load ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let teamData = null
      
      // 1. Try with ID from URL if valid
      if (id && id !== 'null' && id !== 'undefined') {
        try {
          const res = await getTeam(id)
          teamData = res.data
        } catch (err) {
          console.warn('Could not fetch team by ID, trying my-team...', err)
        }
      }

      // 2. Try getMyTeam if no data yet (or as verification for non-admins)
      if (!teamData) {
        try {
          const res = await getMyTeam()
          teamData = res.data
          // Update local state if it was missing
          if (teamData?.id && user && user.teamId !== teamData.id) {
            updateUser({ teamId: teamData.id, role: 'CAPTAIN' })
          }
        } catch (err) {
          console.error('Could not fetch my-team:', err)
        }
      }

      if (!teamData) {
        setError('No se pudo encontrar tu equipo. Si eres capitán, asegúrate de haber creado uno.')
        setLoading(false)
        return
      }

      setTeam(teamData)
      const teamId = teamData.id
      
      await fetchMembers(teamData?.memberIds || [])

      try {
        const [invRes, leaveRes] = await Promise.all([
          getTeamInvitations(teamId),
          getTeamLeaveRequests(teamId),
        ])
        setInvitations(invRes.data || [])
        setLeaveRequests(leaveRes.data || [])
      } catch (secondaryErr) {
        console.warn('ManageTeam: Error fetching secondary lists', secondaryErr)
      }
    } catch (err) {
      console.error('ManageTeam: Error fetching team data:', err)
      setError(err.userMessage ?? 'Error al cargar los datos del equipo.')
    } finally {
      setLoading(false)
    }
  }, [id, user, fetchMembers, updateUser])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Invite ────────────────────────────────────────────────────────
  const handleInvite = async (e) => {
    e.preventDefault()
    if (!invitePlayerId.trim() || !team?.id) return
    setIsSubmitting(true)
    try {
      await invitePlayer(team.id, invitePlayerId.trim())
      setInvitePlayerId('')
      const invRes = await getTeamInvitations(team.id)
      setInvitations(invRes.data || [])
    } catch (err) {
      alert(err.userMessage ?? 'No se pudo enviar la invitación.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Remove member ─────────────────────────────────────────────────
  const handleRemoveMember = async (playerId) => {
    if (!team?.id) return
    if (!window.confirm('¿Estás seguro de eliminar a este jugador del equipo?')) return
    try {
      await removePlayer(team.id, playerId)
      fetchData()
    } catch (err) {
      alert(err.userMessage ?? 'No se pudo eliminar al jugador.')
    }
  }

  // ── Leave requests ────────────────────────────────────────────────
  const handleRespondLeave = async (requestId, approve) => {
    try {
      await respondLeaveRequest(requestId, approve)
      const leaveRes = await getTeamLeaveRequests(team.id)
      setLeaveRequests(leaveRes.data || [])
    } catch (err) {
      alert(err.userMessage ?? 'No se pudo responder a la solicitud.')
    }
  }

  // ── Team actions ──────────────────────────────────────────────────
  const handleValidate = async () => {
    if (!team?.id) return
    try {
      await validateTeam(team.id)
      alert('Equipo validado correctamente.')
      fetchData()
    } catch (err) {
      alert(err.userMessage ?? 'Error al validar el equipo.')
    }
  }

  const handleDissolve = async () => {
    if (!team?.id) return
    if (!window.confirm('¿Estás seguro de disolver el equipo? Esta acción no se puede deshacer.')) return
    try {
      await dissolveTeam(team.id)
      navigate('/dashboard')
    } catch (err) {
      alert(err.userMessage ?? 'No se pudo disolver el equipo.')
    }
  }

  // ── Logo ──────────────────────────────────────────────────────────
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !team?.id) return
    const formData = new FormData()
    formData.append('logo', file)
    try {
      await uploadTeamLogo(team.id, formData)
      alert('Logo actualizado con éxito.')
      fetchData()
    } catch (err) {
      alert(err.userMessage ?? 'Error al subir el logo.')
    }
  }

  if (loading) return (
    <PageLayout>
      <div className={styles.loading}>Cargando datos del equipo...</div>
    </PageLayout>
  )

  if (error) return (
    <PageLayout>
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.btnSecondary} onClick={() => navigate('/dashboard')}>
          Volver al Dashboard
        </button>
      </div>
    </PageLayout>
  )

  const isLocked     = team?.status === 'LOCKED'
  const isRegistered = team?.status === 'REGISTERED'

  return (
    <PageLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>Gestionar Equipo</h1>

        {/* SECTION: Team Info */}
        <section className={styles.section}>
          <div className={styles.teamHeader}>
            <div className={styles.logoWrapper}>
              {team?.logo ? (
                <img src={team.logo} alt="Logo" className={styles.logoImg} />
              ) : (
                <div className={styles.logoPlaceholder}>⚽</div>
              )}
              {!isLocked && (
                <label className={styles.uploadBtn}>
                  Subir Logo
                  <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                </label>
              )}
            </div>
            <div className={styles.info}>
              <h2>{team?.name}</h2>
              <span className={`${styles.status} ${styles[`status--${team?.status}`]}`}>
                {team?.status}
              </span>
            </div>
          </div>
        </section>

        <div className={styles.grid}>
          {/* SECTION: Members */}
          <section className={styles.card}>
            <h3>Miembros del Equipo ({team?.memberCount ?? members.length})</h3>
            <ul className={styles.list}>
              {members.map(member => (
                <li key={member.id} className={styles.listItem}>
                  <span>{member.name}</span>
                  {!isLocked && member.id !== user?.id && (
                    <button
                      className={styles.btnDelete}
                      onClick={() => handleRemoveMember(member.id)}
                      title="Eliminar del equipo"
                    >
                      🗑️
                    </button>
                  )}
                </li>
              ))}
              {members.length === 0 && <p className={styles.empty}>No hay miembros todavía.</p>}
            </ul>
          </section>

          {/* SECTION: Invite */}
          <section className={styles.card}>
            <h3>Invitar Jugador</h3>
            {!isLocked && (
              <form onSubmit={handleInvite} className={styles.inviteForm}>
                <input
                  type="text"
                  placeholder="ID del jugador"
                  value={invitePlayerId}
                  onChange={(e) => setInvitePlayerId(e.target.value)}
                  className={styles.input}
                  required
                />
                <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Invitar'}
                </button>
              </form>
            )}

            <h4 className={styles.subTitle}>Invitaciones Enviadas</h4>
            <ul className={styles.list}>
              {invitations.map(inv => (
                <li key={inv.id} className={styles.listItem}>
                  <span className={styles.email}>{inv.playerId}</span>
                  <span className={`${styles.tag} ${styles[`tag--${inv.status}`]}`}>
                    {inv.status}
                  </span>
                </li>
              ))}
              {invitations.length === 0 && <p className={styles.empty}>No hay invitaciones.</p>}
            </ul>
          </section>

          {/* SECTION: Leave Requests */}
          <section className={styles.card}>
            <h3>Solicitudes de Salida</h3>
            <ul className={styles.list}>
              {leaveRequests.map(req => (
                <li key={req.id} className={styles.listItem}>
                  <div>
                    <span>{req.playerId}</span>
                    {req.reason && <span className={styles.reason}> — {req.reason}</span>}
                  </div>
                  {req.status === 'PENDING' && (
                    <div className={styles.actions}>
                      <button className={styles.btnApprove} onClick={() => handleRespondLeave(req.id, true)}>
                        Aprobar
                      </button>
                      <button className={styles.btnReject} onClick={() => handleRespondLeave(req.id, false)}>
                        Rechazar
                      </button>
                    </div>
                  )}
                </li>
              ))}
              {leaveRequests.length === 0 && <p className={styles.empty}>No hay solicitudes pendientes.</p>}
            </ul>
          </section>

          {/* SECTION: Actions */}
          <section className={styles.card}>
            <h3>Acciones del Equipo</h3>
            <div className={styles.actionGrid}>
              <button className={styles.btnValidate} onClick={handleValidate}>
                Validar Equipo
              </button>
              {!isLocked && !isRegistered && (
                <button className={styles.btnDissolve} onClick={handleDissolve}>
                  Disolver Equipo
                </button>
              )}
            </div>
            {isLocked && (
              <p className={styles.warning}>El equipo está bloqueado. No se puede modificar.</p>
            )}
            {!isLocked && isRegistered && (
              <p className={styles.warning}>El equipo está registrado. No se puede disolver.</p>
            )}
          </section>
        </div>
      </div>
    </PageLayout>
  )
}
