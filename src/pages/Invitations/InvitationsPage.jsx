import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Button from '../../components/ui/Button/Button'
import { useAuth } from '../../hooks/useAuth'
import { getMyInvitations, respondInvitation } from '../../api/teams'
import styles from './InvitationsPage.module.css'

const STATUS_LABELS = { PENDING: 'Pendiente', ACCEPTED: 'Aceptada', REJECTED: 'Rechazada', CANCELED: 'Cancelada' }
const STATUS_CSS = { PENDING: styles.pending, ACCEPTED: styles.accepted, REJECTED: styles.rejected, CANCELED: styles.rejected }

export default function InvitationsPage() {
  const { updateUser } = useAuth()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(null)
  const [msg, setMsg] = useState(null)

  const fetchInvites = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMyInvitations()
      // Ordenar: Pendientes primero, luego por fecha descendente
      const data = res.data || []
      data.sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
      setInvitations(data)
    } catch (e) {
      console.error('Error fetching invites')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvites()
  }, [fetchInvites])

  const handleRespond = async (invitationId, accepted) => {
    setResponding(invitationId)
    try {
      const r = await respondInvitation(invitationId, accepted)
      if (accepted) {
        if (r.data.teamId) updateUser({ teamId: r.data.teamId })
        setMsg('¡Felicidades! Te has unido al equipo.')
      } else {
        setMsg('Has rechazado la invitación.')
      }
      fetchInvites() // Recargar lista completa
    } catch (err) {
      setMsg(err.userMessage || 'No se pudo procesar la respuesta.')
    } finally {
      setResponding(null)
    }
  }

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>Buzón de Reclutamiento</h1>
        <p className={styles.sub}>Historial completo de propuestas y contratos.</p>
      </div>

      {msg && <div className={styles.banner}>{msg}</div>}

      {loading ? <p className={styles.loading}>Cargando propuestas...</p> : (
        <div className={styles.invitesGrid}>
          {invitations.length === 0 && <p className={styles.empty}>No tienes movimientos en tu buzón.</p>}
          {invitations.map((inv) => (
            <div key={inv.id} className={styles.inviteCard}>
              <div className={styles.cardHeader}>
                <div className={styles.teamLogo}></div>
                <div className={styles.teamInfo}>
                  <h3>{inv.teamName || 'Equipo Universitario'}</h3>
                  <p>Propuesta de vinculación</p>
                </div>
                <span className={`${styles.statusBadge} ${STATUS_CSS[inv.status]}`}>
                  {STATUS_LABELS[inv.status]}
                </span>
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.detailRow}>
                  <span>Estado:</span>
                  <strong>{STATUS_LABELS[inv.status]}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Fecha:</span>
                  <strong>{new Date(inv.createdAt || Date.now()).toLocaleDateString()}</strong>
                </div>
              </div>

              {inv.status === 'PENDING' && (
                <div className={styles.cardActions}>
                  <Button variant="primary" fullWidth loading={responding === inv.id} onClick={() => handleRespond(inv.id, true)}>
                    Aceptar
                  </Button>
                  <Button variant="secondary" fullWidth loading={responding === inv.id} onClick={() => handleRespond(inv.id, false)}>
                    Rechazar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
