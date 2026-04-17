import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Button from '../../components/ui/Button/Button'
import api from '../../api/axiosInstance'
import styles from './NotificationsPage.module.css'

const ICON_MAP = {
  INVITATION_RECEIVED: '✉️',
  INVITATION_ACCEPTED: '✅',
  INVITATION_REJECTED: '❌',
  PLAYER_REMOVED: '🚫',
  TEAM_DISSOLVED: '💥',
  SYSTEM: '⚙️',
  TOURNAMENT_STARTED: '🏆',
  TEAM_APPROVED: '👍',
  MATCH_SCHEDULED: '⚽',
  PAYMENT_APPROVED: '💰',
  PAYMENT_REJECTED: '⚠️'
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/notifications')
      setNotifications(res.data || [])
    } catch (err) {
      console.error('Error cargando notificaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  const handleNotificationClick = async (n) => {
    // 1. Mark as read if it's unread
    if (!n.read) {
      try {
        await api.patch(`/api/notifications/${n.id}/read`)
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))
      } catch (e) { /* silent */ }
    }

    // 2. Navigate based on type
    switch (n.type) {
      case 'INVITATION_RECEIVED':
        navigate('/invitations')
        break
      case 'INVITATION_ACCEPTED':
      case 'INVITATION_REJECTED':
      case 'TEAM_APPROVED':
      case 'PAYMENT_APPROVED':
      case 'PAYMENT_REJECTED':
        navigate('/dashboard')
        break
      case 'MATCH_SCHEDULED':
      case 'TOURNAMENT_STARTED':
        navigate('/tournaments/active')
        break
      default:
        // Stay here or go to dashboard
        break
    }
  }

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (e) { /* silent */ }
  }

  return (
    <PageLayout>
      <div className={styles.container}>
        <div className={styles.topCard}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Centro de Actividad</h1>
              <p className={styles.sub}>Historial de movimientos, invitaciones y cambios en tu equipo.</p>
            </div>
            {notifications.some(n => !n.read) && (
              <Button variant="ghost" onClick={markAllRead}>Marcar todas como leídas</Button>
            )}
          </div>
        </div>

        {loading ? (
          <p className={styles.loading}>Cargando historial...</p>
        ) : (
          <div className={styles.list}>
            {notifications.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🔔</span>
                <p>No tienes notificaciones por ahora.</p>
              </div>
            )}
            
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`${styles.item} ${!n.read ? styles.unread : ''}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className={styles.icon}>{ICON_MAP[n.type] || '—'}</div>
                <div className={styles.content}>
                  <p className={styles.message}>{n.message}</p>
                  <span className={styles.date}>
                    {new Date(n.createdAt).toLocaleString('es-CO', { 
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                    })}
                  </span>
                </div>
                {!n.read && <div className={styles.dot} title="Nueva" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
