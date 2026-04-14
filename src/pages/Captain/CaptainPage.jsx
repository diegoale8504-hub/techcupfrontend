import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import { useAuth } from '../../hooks/useAuth'
import { getEffectiveRole } from '../../utils/roles'
import { createTeam } from '../../api/teams'
import styles from './CaptainPage.module.css'

export default function CaptainPage() {
  const { user, setTeamId } = useAuth()
  const navigate = useNavigate()
  const role = getEffectiveRole(user)

  const [name, setName]       = useState('')
  const [nameErr, setNameErr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)

  // If already captain, redirect to team
  useEffect(() => {
    if (role === 'capitán') navigate('/team', { replace: true })
  }, [role, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setNameErr('*El nombre del equipo es requerido'); return }

    setLoading(true)
    setApiError(null)
    try {
      const res = await createTeam({ name: name.trim() })
      const teamId = res.data?.id
      if (teamId) setTeamId(teamId)
      navigate('/team')
    } catch (err) {
      setApiError(err.userMessage ?? 'No se pudo crear el equipo. Intenta de nuevo.')
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
          <span className={styles.shieldIcon}>🛡️</span>
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
