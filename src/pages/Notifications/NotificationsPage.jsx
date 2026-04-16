import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Button from '../../components/ui/Button/Button'
import api from '../../api/axiosInstance'
import styles from './NotificationsPage.module.css'

const ICON_MAP = {
  INVITATION_RECEIVED: 'INV',
  INVITATION_ACCEPTED: 'OK',
  INVITATION_REJECTED: 'NO',
  PLAYER_REMOVED: 'REM',
  TEAM_DISSOLVED: 'DIS',
  SYSTEM: 'SIS'
}

export default function NotificationsPage() {
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
  }, [])

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (e) { /* silent */ }
  }

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (e) { /* silent */ }
  }

  return (
    <PageLayout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Centro de Actividad</h1>
          <p className={styles.sub}>Historial de movimientos, invitaciones y cambios en tu equipo.</p>
        </div>
        {notifications.some(n => !n.read) && (
          <Button variant="ghost" onClick={markAllRead}>Marcar todas como leídas</Button>
        )}
      </div>

      {loading ? (
        <p className={styles.loading}>Cargando historial...</p>
      ) : (
        <div className={styles.list}>
          {notifications.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}></span>
              <p>No tienes notificaciones por ahora.</p>
            </div>
          )}
          
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className={`${styles.item} ${!n.read ? styles.unread : ''}`}
              onClick={() => !n.read && markAsRead(n.id)}
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
    </PageLayout>
  )
}
