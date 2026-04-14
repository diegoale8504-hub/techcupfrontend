import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useRegistration } from '../../../hooks/useRegistration'
import Stepper from '../../../components/ui/Stepper/Stepper'
import Input from '../../../components/ui/Input/Input'
import Button from '../../../components/ui/Button/Button'
import { validate, required, numeric } from '../../../utils/validators'
import styles from './RegistrationStep1Page.module.css'

const STEPS = ['Datos personales', 'Datos institucionales', 'Perfil deportivo']

const DOC_OPTIONS = [
  { value: '',                 label: 'Selecciona tipo de documento' },
  { value: 'CEDULA',           label: 'Cédula de ciudadanía' },
  { value: 'CEDULA_EXTRANJERA',label: 'Cédula de extranjería' },
  { value: 'PASAPORTE',        label: 'Pasaporte' },
  { value: 'CEDULA_DIGITAL',   label: 'Cédula digital' },
]

const GENDER_OPTIONS = [
  { value: '',           label: 'Selecciona género' },
  { value: 'Masculino',  label: 'Masculino' },
  { value: 'Femenino',   label: 'Femenino' },
  { value: 'Otro',       label: 'Otro' },
]

const RULES = {
  firstName:    [required()],
  lastName:     [required()],
  documentType: [required('*Selecciona un tipo de documento')],
  idNumber:     [required(), numeric()],
  age:          [required()],
  gender:       [required('*Selecciona un género')],
}

export default function RegistrationStep1Page() {
  const { sessionId, saveStep1, isSubmitting, error } = useRegistration()

  const [form, setForm] = useState({
    firstName: '', lastName: '', documentType: '', idNumber: '', age: '', gender: '',
  })
  const [errors, setErrors] = useState({})

  if (!sessionId) return <Navigate to="/register" replace />

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setErrors((p) => ({ ...p, [e.target.name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { isValid, errors: fieldErrors } = validate(form, RULES)
    if (!isValid) { setErrors(fieldErrors); return }
    try {
      await saveStep1({ ...form, age: parseInt(form.age, 10) })
    } catch { /* error shown via context */ }
  }

  return (
    <div className={`${styles.root} page-enter`}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="/images/logofinal.png" alt="TechCupFútbol" className={styles.logoImg} />
          <h1 className={styles.title}>Registro</h1>
        </div>
        <Stepper steps={STEPS} currentStep={0} />

        <h2 className={styles.stepTitle}>Datos personales</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.fields}>
            <div className={styles.row}>
              <Input label="Nombres" name="firstName" value={form.firstName} onChange={handleChange} error={errors.firstName} placeholder="Ej: Carlos Andrés" required />
              <Input label="Apellidos" name="lastName" value={form.lastName} onChange={handleChange} error={errors.lastName} placeholder="Ej: Rodríguez Gómez" required />
            </div>
            <div className={styles.row}>
              <Input label="Tipo de documento" name="documentType" type="select" value={form.documentType} onChange={handleChange} error={errors.documentType} options={DOC_OPTIONS} required />
              <Input label="Número de documento" name="idNumber" value={form.idNumber} onChange={handleChange} error={errors.idNumber} placeholder="Ej: 1234567890" required />
            </div>
            <div className={styles.row}>
              <Input label="Edad" name="age" type="number" value={form.age} onChange={handleChange} error={errors.age} placeholder="Ej: 21" required />
              <Input label="Género" name="gender" type="select" value={form.gender} onChange={handleChange} error={errors.gender} options={GENDER_OPTIONS} required />
            </div>
          </div>

          {error && <p className={styles.apiError}>{error}</p>}

          <div className={styles.actions}>
            <a href="/register" className={styles.backLink}>← Cambiar tipo</a>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Continuar →
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
