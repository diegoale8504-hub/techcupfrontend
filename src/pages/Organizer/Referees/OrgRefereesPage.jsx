import { useState, useEffect } from 'react'
import PageLayout from '../../../components/layout/PageLayout/PageLayout'
import { getReferees } from '../../../api/users'
import { inviteReferee } from '../../../api/organizer'
import styles from './OrgRefereesPage.module.css'

export default function OrgRefereesPage() {
  const [referees, setReferees] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting]       = useState(false)
  const [inviteError, setInviteError] = useState(null)
  const [inviteSuccess, setInviteSuccess] = useState(null)

  useEffect(() => {
    getReferees()
      .then((res) => setReferees(res.data ?? []))
      .catch(() => setError('No se pudo cargar la lista de árbitros.'))
      .finally(() => setLoading(false))
  }, [])

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(null)
    try {
      await inviteReferee({ email: inviteEmail.trim() })
      setInviteSuccess(`Invitación enviada a ${inviteEmail.trim()}`)
      setInviteEmail('')
    } catch (err) {
      setInviteError(err.userMessage ?? 'No se pudo enviar la invitación.')
    } finally {
      setInviting(false)
    }
  }

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Árbitros</h1>
        <p className={styles.sub}>Árbitros registrados e invitaciones</p>
      </div>

      {/* Invite section */}
      <div className={styles.inviteSection}>
        <h2 className={styles.sectionTitle}>Invitar árbitro</h2>
        <p className={styles.sectionDesc}>
          Ingresa el correo Gmail del árbitro. Al iniciar sesión con Google, su cuenta se promoverá automáticamente al rol de Árbitro.
        </p>
        <form onSubmit={handleInvite} className={styles.inviteForm}>
          <input
            type="email"
            className={styles.emailInput}
            placeholder="correo@gmail.com"
            value={inviteEmail}
            onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); setInviteSuccess(null) }}
            disabled={inviting}
          />
          <button type="submit" className={styles.btnInvite} disabled={inviting || !inviteEmail.trim()}>
            {inviting ? 'Enviando...' : 'Enviar invitación'}
          </button>
        </form>
        {inviteSuccess && <p className={styles.successMsg}>{inviteSuccess}</p>}
        {inviteError   && <p className={styles.errorMsg}>{inviteError}</p>}
      </div>

      {/* Referees list */}
      <div className={styles.listSection}>
        <h2 className={styles.sectionTitle}>
          Árbitros activos {!loading && <span className={styles.count}>({referees.length})</span>}
        </h2>

        {loading && <p className={styles.loading}>Cargando árbitros...</p>}
        {error   && <p className={styles.error}>{error}</p>}

        {!loading && !error && referees.length === 0 && (
          <p className={styles.emptyMsg}>No hay árbitros registrados aún. Envía una invitación para agregar el primero.</p>
        )}

        {!loading && referees.length > 0 && (
          <ul className={styles.refereeList}>
            {referees.map((r) => (
              <li key={r.id} className={styles.refereeItem}>
                <span className={styles.avatar}>{r.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                <div className={styles.refereeInfo}>
                  <span className={styles.refName}>{r.name}</span>
                  <span className={styles.refEmail}>{r.email}</span>
                </div>
                <span className={styles.roleBadge}>Árbitro</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageLayout>
  )
}
