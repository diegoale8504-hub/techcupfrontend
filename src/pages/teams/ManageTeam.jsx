import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  getTeam, getMyTeam, getTeamInvitations, getTeamLeaveRequests,
  invitePlayer, removePlayer, respondLeaveRequest,
  validateTeam, dissolveTeam, uploadTeamLogo, cancelInvitation,
} from '../../api/teams'
import { getUserById } from '../../api/users'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Button from '../../components/ui/Button/Button'
import styles from './ManageTeam.module.css'

// Opciones de etiquetas para posiciones
const POSITION_LABELS = {
  GOALKEEPER: 'Portero',
  DEFENDER: 'Defensa',
  MIDFIELDER: 'Centrocampista',
  FORWARD: 'Delantero',
}

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
  const [successMsg,   setSuccessMsg]    = useState(null)

  // Estado para modales de confirmación
  const [confirm, setConfirm] = useState({ open: false, type: '', data: null })

  // ── Fetch member details ──────────────────────────────────────────
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
      if (id && id !== 'null' && id !== 'undefined') {
        try { const res = await getTeam(id); teamData = res.data } catch (e) { /* fallback */ }
      }
      if (!teamData) {
        try { const res = await getMyTeam(); teamData = res.data } catch (e) { /* fallback */ }
      }

      if (!teamData) {
        setError('No se pudo encontrar tu equipo.')
        setLoading(false)
        return
      }

      setTeam(teamData)
      if (teamData.id && user && user.teamId !== teamData.id) {
        updateUser({ teamId: teamData.id, role: 'CAPTAIN' })
      }
      
      await fetchMembers(teamData.memberIds || [])
      const [invRes, leaveRes] = await Promise.all([
        getTeamInvitations(teamData.id),
        getTeamLeaveRequests(teamData.id),
      ])
      setInvitations(invRes.data || [])
      setLeaveRequests(leaveRes.data || [])
    } catch (err) {
      setError(err.userMessage ?? 'Error al cargar los datos del equipo.')
    } finally {
      setLoading(false)
    }
  }, [id, user, fetchMembers, updateUser])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Helper para notificaciones ────────────────────────────────────
  const notify = (msg, isError = false) => {
    if (isError) setError(msg)
    else setSuccessMsg(msg)
    setTimeout(() => { setError(null); setSuccessMsg(null) }, 5000)
  }

  // ── Acciones de Equipo con Confirmación Interna ────────────────────
  const handleAction = async () => {
    const { type, data } = confirm
    setConfirm({ open: false, type: '', data: null })

    try {
      if (type === 'dissolve') {
        await dissolveTeam(team.id)
        updateUser({ role: 'PLAYER', teamId: null })
        navigate('/dashboard', { replace: true })
      } 
      else if (type === 'removeMember') {
        await removePlayer(team.id, data)
        notify('Jugador eliminado correctamente.')
        fetchData()
      }
      else if (type === 'cancelInv') {
        await cancelInvitation(data)
        notify('Invitación cancelada.')
        fetchData()
      }
    } catch (err) {
      notify(err.userMessage ?? 'Ocurrió un error al procesar la acción.', true)
    }
  }

  const handleValidate = async () => {
    try {
      await validateTeam(team.id)
      notify('Equipo validado correctamente.')
      fetchData()
    } catch (err) {
      notify(err.userMessage ?? 'Error al validar el equipo.', true)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      await uploadTeamLogo(team.id, formData)
      notify('Logo actualizado con éxito.')
      fetchData()
    } catch (err) {
      notify(err.userMessage ?? 'Error al subir el logo. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP) de máx. 5 MB.', true)
    }
  }

  if (loading) return <PageLayout><div className={styles.loading}>Cargando...</div></PageLayout>

  const isLocked = team?.status === 'LOCKED'

  return (
    <PageLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>Panel de Gestión de Equipo</h1>

        {/* Banners de Notificación */}
        {successMsg && (
          <div className={`${styles.banner} ${styles.bannerSuccess}`}>
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)}>×</button>
          </div>
        )}
        {error && (
          <div className={`${styles.banner} ${styles.bannerError}`}>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* SECTION: Team Header */}
        <header className={styles.teamHeader}>
          <div className={styles.logoWrapper}>
            {team?.logo ? (
              <img src={team.logo} alt="Logo" className={styles.logoImg} />
            ) : (
              <div className={styles.logoPlaceholder}></div>
            )}
            {!isLocked && (
              <label className={styles.uploadBtn} title="Cambiar logo">
                Cambiar logo
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
        </header>

        <div className={styles.grid}>
          {/* SECTION: Members List */}
          <section className={styles.card}>
            <h3>Miembros del Equipo ({members.length})</h3>
            <div className={styles.memberList}>
              {members.map(member => {
                const isCaptain = member.id === team.captainId
                return (
                  <div key={member.id} className={styles.memberItem}>
                    <div className={styles.memberMain}>
                      <div className={styles.memberNumber}>#{member.playerNumber || '—'}</div>
                      <div className={styles.memberInfo}>
                        <h4>{member.name}</h4>
                        <div className={styles.memberMeta}>
                          <span className={`${styles.roleBadge} ${isCaptain ? styles.roleCaptain : styles.rolePlayer}`}>
                            {isCaptain ? 'Capitán' : 'Jugador'}
                          </span>
                          <span className={styles.playerPos}>
                            • {POSITION_LABELS[member.mainPosition] || 'Sin posición'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!isLocked && !isCaptain && (
                      <button
                        className={styles.btnDanger}
                        onClick={() => setConfirm({ open: true, type: 'removeMember', data: member.id })}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* SECTION: Invitations & Actions */}
          <div className={styles.inviteSection}>
            <section className={styles.card}>
              <h3>Invitar Jugadores</h3>
              <p className={styles.modalText}>Busca nuevos talentos para tu equipo.</p>
              <Button 
                variant="primary" 
                fullWidth 
                onClick={() => navigate('/players')}
                className={styles.btnSearchInvite}
              >
                Ir al Mercado de Jugadores
              </Button>
              
              <h4 style={{marginTop: 20, marginBottom: 10, fontSize: 14}}>Invitaciones Pendientes</h4>
              <ul className={styles.memberList}>
                {invitations.filter(i => i.status === 'PENDING').map(inv => (
                  <div key={inv.id} className={styles.memberItem}>
                    <div style={{display:'flex', flexDirection:'column'}}>
                      <span style={{fontSize: 13, fontWeight: 700}}>{inv.playerName || inv.playerId}</span>
                      <span style={{fontSize: 11, color: '#888'}}>{new Date(inv.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button 
                      className={styles.btnDanger} 
                      style={{padding: '4px 8px', fontSize: '11px'}}
                      onClick={() => setConfirm({ open: true, type: 'cancelInv', data: inv.id })}
                    >
                      Cancelar
                    </button>
                  </div>
                ))}
                {invitations.filter(i => i.status === 'PENDING').length === 0 && (
                  <p style={{fontSize: 12, color: '#999'}}>No hay invitaciones pendientes.</p>
                )}
              </ul>
            </section>

            <section className={styles.card}>
              <h3>Acciones de Control</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                <Button variant="accent" fullWidth onClick={handleValidate} disabled={isLocked}>
                  Validar y Cerrar Nómina
                </Button>
                <button 
                  className={styles.btnDanger} 
                  style={{width: '100%'}}
                  onClick={() => setConfirm({ open: true, type: 'dissolve' })}
                  disabled={isLocked}
                >
                  Disolver Equipo
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN INTERNO */}
      {confirm.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalIcon}>
              {confirm.type === 'dissolve' ? '!' : confirm.type === 'cancelInv' ? 'INV' : 'JUG'}
            </div>
            <h3 className={styles.modalTitle}>
              {confirm.type === 'dissolve' ? '¿Disolver equipo?' : 
               confirm.type === 'cancelInv' ? '¿Cancelar invitación?' : 
               '¿Eliminar jugador?'}
            </h3>
            <p className={styles.modalText}>
              {confirm.type === 'cancelInv' 
                ? 'El jugador dejará de ver esta propuesta en su buzón.' 
                : 'Esta acción no se puede deshacer. ¿Estás seguro de que deseas continuar?'}
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setConfirm({ open: false, type: '', data: null })}>
                Cerrar
              </button>
              <button className={styles.btnDanger} onClick={handleAction}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
