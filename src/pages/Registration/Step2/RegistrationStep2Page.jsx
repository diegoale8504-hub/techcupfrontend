import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useRegistration } from '../../../hooks/useRegistration'
import Stepper from '../../../components/ui/Stepper/Stepper'
import Input from '../../../components/ui/Input/Input'
import Button from '../../../components/ui/Button/Button'
import { validate, required, email, numeric } from '../../../utils/validators'
import styles from './RegistrationStep2Page.module.css'

const STEPS = ['Datos personales', 'Datos institucionales', 'Perfil deportivo']

// Field names match exactly what the backend expects in RegistrationStep2Request
const FIELD_CONFIGS = {
  STUDENT: [
    { name: 'institutionalEmail', label: 'Correo institucional', type: 'email', placeholder: 'usuario@mail.escuelaing.edu.co', rules: [required(), email()] },
    { name: 'password',           label: 'Contraseña',           type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'confirmPassword',    label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'studentCode',        label: 'Código estudiantil',   type: 'text',     placeholder: 'Ej: 0000000000', rules: [required(), numeric()] },
    { name: 'academicProgram',    label: 'Programa académico',   type: 'text',     placeholder: 'Ej: Ingeniería de Sistemas', rules: [required()] },
    { name: 'semester',           label: 'Semestre actual',      type: 'number',   placeholder: 'Ej: 5', rules: [required()] },
  ],
  GRADUATE: [
    { name: 'institutionalEmail', label: 'Correo institucional', type: 'email', placeholder: 'usuario@mail.escuelaing.edu.co', rules: [required(), email()] },
    { name: 'password',           label: 'Contraseña',           type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'confirmPassword',    label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'academicProgram',    label: 'Programa de egreso',   type: 'text',     placeholder: 'Ej: Ingeniería Civil', rules: [required()] },
    { name: 'graduationYear',     label: 'Año de graduación',    type: 'number',   placeholder: 'Ej: 2020', rules: [required()] },
  ],
  PROFESSOR: [
    { name: 'institutionalEmail', label: 'Correo institucional', type: 'email', placeholder: 'usuario@mail.escuelaing.edu.co', rules: [required(), email()] },
    { name: 'password',           label: 'Contraseña',           type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'confirmPassword',    label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'teachingArea',       label: 'Área de docencia',     type: 'text',     placeholder: 'Ej: Ingeniería de Software', rules: [required()] },
    { name: 'department',         label: 'Departamento',         type: 'text',     placeholder: 'Ej: Depto. de Sistemas', rules: [required()] },
  ],
  ADMINISTRATIVE: [
    { name: 'institutionalEmail', label: 'Correo institucional', type: 'email', placeholder: 'usuario@mail.escuelaing.edu.co', rules: [required(), email()] },
    { name: 'password',           label: 'Contraseña',           type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'confirmPassword',    label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'department',         label: 'Dependencia',          type: 'text',     placeholder: 'Ej: Registro y Control', rules: [required()] },
    { name: 'position',           label: 'Cargo',                type: 'text',     placeholder: 'Ej: Coordinador', rules: [required()] },
  ],
  FAMILY_MEMBER: [
    { name: 'institutionalEmail',  label: 'Correo Gmail',                         type: 'email', placeholder: 'familiar@gmail.com', rules: [required(), email()] },
    { name: 'password',            label: 'Contraseña',                            type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'confirmPassword',     label: 'Confirmar contraseña',                 type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'relatedPersonName',   label: 'Nombre del familiar en la Escuela',    type: 'text',     placeholder: 'Ej: Juan Rodríguez', rules: [required()] },
    { name: 'relatedStudentEmail', label: 'Correo institucional del familiar',    type: 'email',    placeholder: 'familiar@mail.escuelaing.edu.co', rules: [required(), email()] },
  ],
  REFEREE: [
    { name: 'institutionalEmail', label: 'Correo',             type: 'email',    placeholder: 'correo@ejemplo.com', rules: [required(), email()] },
    { name: 'password',           label: 'Contraseña',         type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'confirmPassword',    label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••', rules: [required()] },
  ],
}

export default function RegistrationStep2Page() {
  const { sessionId, userType, saveStep2, isSubmitting, error } = useRegistration()

  const fields = FIELD_CONFIGS[userType] ?? FIELD_CONFIGS.STUDENT
  const initialForm = Object.fromEntries(fields.map((f) => [f.name, '']))

  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  if (!sessionId) return <Navigate to="/register" replace />

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setErrors((p) => ({ ...p, [e.target.name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const rules = Object.fromEntries(fields.map((f) => [f.name, f.rules]))
    const { isValid, errors: fieldErrors } = validate(form, rules)
    if (!isValid) { setErrors(fieldErrors); return }
    try {
      await saveStep2(form)
    } catch {
      // error shown via context
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <h1 className={styles.title}>Registro</h1>
        <Stepper steps={STEPS} currentStep={1} />

        <h2 className={styles.stepTitle}>Datos institucionales</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.fields}>
            {fields.map((field) => (
              <Input
                key={field.name}
                label={field.label}
                name={field.name}
                type={field.type}
                value={form[field.name]}
                onChange={handleChange}
                error={errors[field.name]}
                placeholder={field.placeholder}
                required
              />
            ))}
          </div>

          {error && <p className={styles.apiError}>{error}</p>}

          <div className={styles.actions}>
            <a href="/register/step1" className={styles.backLink}>← Anterior</a>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Continuar →
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
