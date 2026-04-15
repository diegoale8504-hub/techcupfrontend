import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useRegistration } from '../../../hooks/useRegistration'
import Stepper from '../../../components/ui/Stepper/Stepper'
import Input from '../../../components/ui/Input/Input'
import Button from '../../../components/ui/Button/Button'
import { validate, required, email, numeric } from '../../../utils/validators'
import styles from './RegistrationStep2Page.module.css'

const STEPS = ['Datos personales', 'Datos institucionales', 'Perfil deportivo']

// Field names match exactly what the backend expects in RegistrationStep2Request
const ACADEMIC_PROGRAMS = [
  { value: '',                                    label: 'Selecciona un programa' },
  { value: 'INGENIERIA_EN_BIOTECNOLOGIA',         label: 'Ingeniería en Biotecnología' },
  { value: 'INGENIERIA_DE_INTELIGENCIA_ARTIFICIAL', label: 'Ingeniería de Inteligencia Artificial' },
  { value: 'INGENIERIA_DE_CIBERSEGURIDAD',        label: 'Ingeniería de Ciberseguridad' },
  { value: 'INGENIERIA_CIVIL',                    label: 'Ingeniería Civil' },
  { value: 'INGENIERIA_AMBIENTAL',                label: 'Ingeniería Ambiental' },
  { value: 'INGENIERIA_ESTADISTICA',              label: 'Ingeniería Estadística' },
  { value: 'INGENIERIA_ELECTRICA',                label: 'Ingeniería Eléctrica' },
  { value: 'INGENIERIA_DE_SISTEMAS',              label: 'Ingeniería de Sistemas' },
  { value: 'INGENIERIA_INDUSTRIAL',               label: 'Ingeniería Industrial' },
  { value: 'INGENIERIA_ELECTRONICA',              label: 'Ingeniería Electrónica' },
  { value: 'ECONOMIA',                            label: 'Economía' },
  { value: 'ADMINISTRACION_DE_EMPRESAS',          label: 'Administración de Empresas' },
  { value: 'MATEMATICAS',                         label: 'Matemáticas' },
  { value: 'INGENIERIA_MECANICA',                 label: 'Ingeniería Mecánica' },
  { value: 'INGENIERIA_BIOMEDICA',                label: 'Ingeniería Biomédica' },
]

const FIELD_CONFIGS = {
  STUDENT: [
    { name: 'institutionalEmail', label: 'Correo institucional', type: 'email',    placeholder: 'usuario@mail.escuelaing.edu.co', rules: [required(), email()] },
    { name: 'password',           label: 'Contraseña',           type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'confirmPassword',    label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'studentCode',        label: 'Código estudiantil',   type: 'text',     placeholder: 'Ej: 0000000000', rules: [required(), numeric()] },
    { name: 'academicProgram',    label: 'Programa académico',   type: 'select',   rules: [required('*Selecciona un programa')], options: ACADEMIC_PROGRAMS },
    { name: 'semester',           label: 'Semestre actual',      type: 'number',   placeholder: 'Ej: 5', rules: [required()] },
  ],
  GRADUATE: [
    { name: 'institutionalEmail', label: 'Correo institucional', type: 'email',    placeholder: 'usuario@mail.escuelaing.edu.co', rules: [required(), email()] },
    { name: 'password',           label: 'Contraseña',           type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'confirmPassword',    label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'academicProgram',    label: 'Programa de egreso',   type: 'select',   rules: [required('*Selecciona un programa')], options: ACADEMIC_PROGRAMS },
    { name: 'graduationYear',     label: 'Año de graduación',    type: 'number',   placeholder: 'Ej: 2020', rules: [required()] },
  ],
  PROFESSOR: [
    { name: 'institutionalEmail', label: 'Correo institucional', type: 'email',    placeholder: 'usuario@escuelaing.edu.co', rules: [required(), email()] },
    { name: 'password',           label: 'Contraseña',           type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'confirmPassword',    label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'academicProgram',    label: 'Programa que dicta',   type: 'select',   rules: [required('*Selecciona un programa')], options: ACADEMIC_PROGRAMS },
    { name: 'teachingArea',       label: 'Área de docencia',     type: 'text',     placeholder: 'Ej: Ingeniería de Software', rules: [required()] },
  ],
  ADMINISTRATIVE: [
    { name: 'institutionalEmail', label: 'Correo institucional', type: 'email',    placeholder: 'usuario@escuelaing.edu.co', rules: [required(), email()] },
    { name: 'password',           label: 'Contraseña',           type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'confirmPassword',    label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'department',         label: 'Dependencia',          type: 'text',     placeholder: 'Ej: Registro y Control', rules: [required()] },
    { name: 'jobPosition',        label: 'Cargo',                type: 'text',     placeholder: 'Ej: Coordinador', rules: [required()] },
  ],
  FAMILY_MEMBER: [
    { name: 'gmailEmail',          label: 'Correo Gmail',                        type: 'email',    placeholder: 'familiar@gmail.com', rules: [required(), email()] },
    { name: 'password',            label: 'Contraseña',                          type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'confirmPassword',     label: 'Confirmar contraseña',                type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'familyRelationType',  label: 'Relación con el miembro',             type: 'select',   rules: [required('*Selecciona el tipo de relación')],
      options: [
        { value: '',        label: 'Selecciona relación' },
        { value: 'FATHER',  label: 'Padre' },
        { value: 'MOTHER',  label: 'Madre' },
        { value: 'SIBLING', label: 'Hermano/a' },
        { value: 'OTHER',   label: 'Otro' },
      ]
    },
    { name: 'relatedPersonName',   label: 'Nombre del familiar en la Escuela',  type: 'text',  placeholder: 'Ej: Juan Rodríguez', rules: [required()] },
    { name: 'relatedStudentEmail', label: 'Correo institucional del familiar',  type: 'email', placeholder: 'familiar@mail.escuelaing.edu.co', rules: [required(), email()] },
  ],
  REFEREE: [
    { name: 'gmailEmail',      label: 'Correo Gmail',         type: 'email',    placeholder: 'arbitro@gmail.com', rules: [required(), email()] },
    { name: 'password',        label: 'Contraseña',           type: 'password', placeholder: '••••••••', rules: [required()] },
    { name: 'confirmPassword', label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••', rules: [required()] },
  ],
}

function extractFieldErrors(data) {
  if (!data) return {}
  if (data.fieldErrors && typeof data.fieldErrors === 'object' && !Array.isArray(data.fieldErrors))
    return data.fieldErrors
  if (Array.isArray(data.errors))
    return Object.fromEntries(data.errors.map((e) => [e.field, e.defaultMessage ?? e.message ?? 'Campo inválido']))
  if (data.errors && typeof data.errors === 'object')
    return data.errors
  return {}
}

export default function RegistrationStep2Page() {
  const { sessionId, userType, saveStep2, isSubmitting, error } = useRegistration()

  const fields      = FIELD_CONFIGS[userType] ?? FIELD_CONFIGS.STUDENT
  const initialForm = Object.fromEntries(fields.map((f) => [f.name, '']))

  const [form, setForm]     = useState(initialForm)
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
    } catch (err) {
      if (err.response?.status === 400) {
        const apiErrors = extractFieldErrors(err.response.data)
        if (Object.keys(apiErrors).length > 0) setErrors(apiErrors)
      }
    }
  }

  return (
    <div className={`${styles.root} page-enter`}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="/images/logoFinalFinal.png" alt="TechCupFútbol" className={styles.logoImg} />
          <h1 className={styles.title}>Registro</h1>
        </div>
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
                options={field.options}
                required
              />
            ))}
          </div>

          {error && <p className={styles.apiError}>{error}</p>}

          <div className={styles.actions}>
            <Link to="/register/step1" className={styles.backLink}>← Anterior</Link>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Continuar →
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
