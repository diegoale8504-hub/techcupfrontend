import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import { useAuth } from '../../hooks/useAuth'
import { getEffectiveRole } from '../../utils/roles'
import { createTeam, getAllTeams } from '../../api/teams'
import styles from './CaptainPage.module.css'

export default function CaptainPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const role = getEffectiveRole(user)

  const [name, setName]       = useState('')
  const [nameErr, setNameErr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)

  // If already captain, redirect to their team management page
  useEffect(() => {
    if (role === 'capitán' && user?.teamId) navigate(`/teams/${user.teamId}/manage`, { replace: true })
  }, [role, user?.teamId, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setNameErr('*El nombre del equipo es requerido'); return }

    setLoading(true)
    setApiError(null)
    try {
      const res = await createTeam({ name: name.trim(), primaryColor: '#16A34A', secondaryColor: '#ffffff' })
      const teamId = res.data?.id
      if (teamId) {
        updateUser({ teamId, role: 'CAPTAIN' })
      }
      // Navigation is intentionally delegated to the useEffect below.
    } catch (err) {
      if (err.response?.status === 422 || err.response?.status === 409) {
        try {
          const res = await api.get(`/api/users/${user?.id}`)
          const profile = res.data
          const teamId = profile.teamId || profile.team?.id
          if (teamId) {
            updateUser({ teamId, role: 'CAPTAIN' })
            return
          }
        } catch { /* ignorar error de recuperación */ }
      }
      setApiError(err.userMessage ?? 'No se pudo crear el equipo. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Crear equipo</h1>
        <p className={styles.sub}>Conviértete en capitán y lidera tu equipo al torneo</p>
      </div>

      <div className={styles.card}>
        <div className={styles.iconRow}>
        </div>
        <h2 className={styles.cardTitle}>Nuevo equipo</h2>
        <p className={styles.cardDesc}>
          Al crear un equipo te conviertes en su capitán. Podrás invitar jugadores,
          gestionar el pago de inscripción y enviar la alineación para cada partido.
        </p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            label="Nombre del equipo"
            name="name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameErr(null) }}
            error={nameErr}
            placeholder="Ej: Hackers FC"
            required
          />

          {apiError && <p className={styles.error}>{apiError}</p>}

          <Button type="submit" variant="primary" fullWidth loading={loading}>
            Crear equipo y ser capitán
          </Button>
        </form>

        <div className={styles.requirements}>
          <p className={styles.reqTitle}>Requisitos para participar:</p>
          <ul className={styles.reqList}>
            <li>Mínimo 7 jugadores, máximo 12</li>
            <li>Al menos 50% deben ser estudiantes del programa</li>
            <li>El pago de inscripción debe ser aprobado</li>
          </ul>
        </div>
      </div>
    </PageLayout>
  )
}
