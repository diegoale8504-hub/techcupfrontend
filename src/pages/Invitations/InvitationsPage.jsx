import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Button from '../../components/ui/Button/Button'
import { useAuth } from '../../hooks/useAuth'
import { getMyInvitations, respondInvitation, getTeamInvitations } from '../../api/teams'
import styles from './InvitationsPage.module.css'

const STATUS_LABELS = { PENDING: 'Pendiente', ACCEPTED: 'Aceptada', REJECTED: 'Rechazada' }
const STATUS_CSS    = { PENDING: styles.pending, ACCEPTED: styles.accepted, REJECTED: styles.rejected }

export default function InvitationsPage() {
  const { user, updateUser } = useAuth()
  
  // Normalizar rol
  const role = user?.role?.toUpperCase()
  const isCapitan = role === 'CAPTAIN'

  // Resolver teamId (encontrar de AuthContext o Layout ya lo resolvió)
  const teamId = user?.teamId

  const [invitations, setInvitations] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [responding, setResponding]   = useState(null)
  const [msg, setMsg]                 = useState(null)

  useEffect(() => {
    const fetchInvs = async () => {
      setLoading(true)
      try {
        const fetchFn = isCapitan && teamId
          ? () => getTeamInvitations(teamId)
          : () => getMyInvitations()

        const r = await fetchFn()
        setInvitations(r.data ?? [])
      } catch {
        setError('No se pudieron cargar las invitaciones.')
      } finally {
        setLoading(false)
      }
    }
    fetchInvs()
  }, [isCapitan, teamId])

  const handleRespond = async (invitationId, accepted) => {
    setResponding(invitationId)
    setMsg(null)
    try {
      const r = await respondInvitation(invitationId, accepted)
      setInvitations((prev) =>
        prev.map((inv) => inv.id === invitationId ? { ...inv, status: r.data.status || (accepted ? 'ACCEPTED' : 'REJECTED') } : inv)
      )
      if (accepted) {
        // Sincronizar teamId en el contexto global si aceptó
        if (r.data.teamId) {
          updateUser({ teamId: r.data.teamId })
        }
        setMsg('¡Invitación aceptada! Ahora eres parte del equipo.')
      } else {
        setMsg('Invitación rechazada.')
      }
    } catch (err) {
      setMsg(err.userMessage ?? 'No se pudo procesar la respuesta.')
    } finally {
      setResponding(null)
    }
  }

  const pending = invitations.filter((i) => (i.status || i.estado) === 'PENDING')
  const past    = invitations.filter((i) => (i.status || i.estado) !== 'PENDING')

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Invitaciones</h1>
        <p className={styles.sub}>
          {isCapitan ? 'Invitaciones enviadas a jugadores' : 'Invitaciones recibidas de equipos'}
        </p>
      </div>

      {loading && <p className={styles.loading}>Cargando...</p>}
      {error   && <p className={styles.errorMsg}>{error}</p>}
      {msg     && <p className={styles.infoMsg}>{msg}</p>}

      {!loading && invitations.length === 0 && !error && (
        <div className={styles.card}>
          <p className={styles.emptyMsg}>
            {isCapitan ? 'No has enviado ninguna invitación aún.' : 'No tienes invitaciones pendientes.'}
          </p>
        </div>
      )}

      {/* Pending */}
      {!loading && pending.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Pendientes</h2>
          <div className={styles.inviteList}>
            {pending.map((inv) => (
              <div key={inv.id} className={styles.inviteRow}>
                <div className={styles.inviteInfo}>
                  <span className={styles.inviteName}>
                    {isCapitan ? (inv.nombreJugador || inv.playerName) : (inv.nombreEquipo || inv.teamName)}
                  </span>
                  <span className={styles.inviteDate}>
                    {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('es-CO') : '—'}
                  </span>
                </div>
                {!isCapitan ? (
                  <div className={styles.actions}>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={responding === inv.id}
                      onClick={() => handleRespond(inv.id, true)}
                    >
                      Aceptar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={responding === inv.id}
                      onClick={() => handleRespond(inv.id, false)}
                    >
                      Rechazar
                    </Button>
                  </div>
                ) : (
                  <span className={`${styles.statusBadge} ${STATUS_CSS.PENDING}`}>
                    {STATUS_LABELS.PENDING}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {!loading && past.length > 0 && (
        <div className={`${styles.card} ${styles.cardMuted}`}>
          <h2 className={styles.cardTitle}>Historial</h2>
          <div className={styles.inviteList}>
            {past.map((inv) => {
              const status = inv.status || inv.estado
              return (
                <div key={inv.id} className={styles.inviteRow}>
                  <div className={styles.inviteInfo}>
                    <span className={styles.inviteName}>
                      {isCapitan ? (inv.nombreJugador || inv.playerName) : (inv.nombreEquipo || inv.teamName)}
                    </span>
                    <span className={styles.inviteDate}>
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('es-CO') : '—'}
                    </span>
                  </div>
                  <span className={`${styles.statusBadge} ${STATUS_CSS[status]}`}>
                    {STATUS_LABELS[status] ?? status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </PageLayout>
  )
}
