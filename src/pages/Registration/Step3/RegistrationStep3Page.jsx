import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useRegistration } from '../../../hooks/useRegistration'
import Stepper from '../../../components/ui/Stepper/Stepper'
import Input from '../../../components/ui/Input/Input'
import Button from '../../../components/ui/Button/Button'
import { validate, required } from '../../../utils/validators'
import styles from './RegistrationStep3Page.module.css'

const STEPS = ['Datos personales', 'Datos institucionales', 'Perfil deportivo']

const POSITION_OPTIONS = [
  { value: '', label: 'Selecciona tu posición' },
  { value: 'GOALKEEPER', label: 'Portero' },
  { value: 'DEFENDER', label: 'Defensa' },
  { value: 'MIDFIELDER', label: 'Centrocampista' },
  { value: 'FORWARD', label: 'Delantero' },
]

const ALL_POSITIONS = [
  { value: 'GOALKEEPER', label: 'Portero' },
  { value: 'DEFENDER', label: 'Defensa' },
  { value: 'MIDFIELDER', label: 'Centrocampista' },
  { value: 'FORWARD', label: 'Delantero' },
]

const RULES = {
  mainPosition: [required('*Selecciona una posición')],
  jerseyNumber: [required()],
}

export default function RegistrationStep3Page() {
  const { sessionId, saveStep3, isSubmitting, error } = useRegistration()

  const [form, setForm] = useState({
    mainPosition: '',
    jerseyNumber: '',
    available: true,
  })
  const [secondaryPositions, setSecondaryPositions] = useState([])
  const [errors, setErrors] = useState({})

  if (!sessionId) return <Navigate to="/register" replace />

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
    setErrors((p) => ({ ...p, [name]: null }))
  }

  const toggleSecondary = (pos) => {
    setSecondaryPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { isValid, errors: fieldErrors } = validate(form, RULES)
    if (!isValid) { setErrors(fieldErrors); return }
    try {
      await saveStep3({
        ...form,
        jerseyNumber: parseInt(form.jerseyNumber, 10),
        secondaryPositions,
      })
    } catch {
      // error shown via context
    }
  }

  return (
    <div className={`${styles.root} page-enter`}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="/images/logofinal.png" alt="TechCupFútbol" className={styles.logoImg} />
          <h1 className={styles.title}>Registro</h1>
        </div>
        <Stepper steps={STEPS} currentStep={2} />

        <h2 className={styles.stepTitle}>Perfil deportivo</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.fields}>
            <Input
              label="Posición principal"
              name="mainPosition"
              type="select"
              value={form.mainPosition}
              onChange={handleChange}
              error={errors.mainPosition}
              options={POSITION_OPTIONS}
              required
            />
            <Input
              label="Número de camiseta preferido"
              name="jerseyNumber"
              type="number"
              value={form.jerseyNumber}
              onChange={handleChange}
              error={errors.jerseyNumber}
              placeholder="Ej: 10"
              required
            />

            <div className={styles.checkGroup}>
              <p className={styles.checkLabel}>Posiciones secundarias (opcional)</p>
              <div className={styles.checkRow}>
                {ALL_POSITIONS.map((pos) => (
                  <label key={pos.value} className={styles.checkItem}>
                    <input
                      type="checkbox"
                      checked={secondaryPositions.includes(pos.value)}
                      onChange={() => toggleSecondary(pos.value)}
                      disabled={pos.value === form.mainPosition}
                    />
                    {pos.label}
                  </label>
                ))}
              </div>
            </div>

            <label className={styles.availableRow}>
              <input
                type="checkbox"
                name="available"
                checked={form.available}
                onChange={handleChange}
              />
              <span>Disponible para recibir invitaciones de equipos</span>
            </label>
          </div>

          {error && <p className={styles.apiError}>{error}</p>}

          <div className={styles.actions}>
            <a href="/register/step2" className={styles.backLink}>← Anterior</a>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Finalizar registro
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
