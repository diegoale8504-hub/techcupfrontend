import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegistration } from '../../../hooks/useRegistration'
import Button from '../../../components/ui/Button/Button'
import styles from './UserTypeSelectionPage.module.css'

const USER_TYPES = [
  { value: 'STUDENT',        label: 'Estudiante',      icon: '/images/registro_Estudiante.png',      desc: 'Estudiante activo de la Escuela' },
  { value: 'GRADUATE',       label: 'Graduado',        icon: '/images/registro_Graduado.png',        desc: 'Egresado de la institución' },
  { value: 'PROFESSOR',      label: 'Profesor',        icon: '/images/registro_Profesor.png',        desc: 'Docente de la Escuela' },
  { value: 'ADMINISTRATIVE', label: 'Administrativo',  icon: '/images/registro_Administrativo.png',  desc: 'Personal administrativo' },
  { value: 'FAMILY_MEMBER',  label: 'Familiar',        icon: '/images/registro_Familiar.png',        desc: 'Familiar de un miembro de la comunidad' },
  { value: 'REFEREE',        label: 'Árbitro',         icon: '/images/registro_Arbitro.png',         desc: 'Árbitro del torneo' },
]

// Tipos que deben registrarse exclusivamente con Google
const GOOGLE_REQUIRED = ['REFEREE', 'FAMILY_MEMBER']

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:8443'}/oauth2/authorization/google`

export default function UserTypeSelectionPage() {
  const { startRegistration, isSubmitting, error } = useRegistration()
  const [selectedType, setSelectedType] = useState(null)

  const isGoogleRequired = selectedType && GOOGLE_REQUIRED.includes(selectedType)
  const isNormalFlow     = selectedType && !GOOGLE_REQUIRED.includes(selectedType)

  const labelFor = (value) =>
    USER_TYPES.find((t) => t.value === value)?.label?.toLowerCase() ?? value.toLowerCase()

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="/images/logoFinalFinal.png" alt="TechCupFútbol" className={styles.logoImg} />
          <h1 className={styles.title}>Registro TechCupFútbol</h1>
          <p className={styles.desc}>Selecciona tu tipo de perfil para comenzar el registro.</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.grid}>
          {USER_TYPES.map((type) => (
            <button
              key={type.value}
              className={`${styles.typeCard} ${selectedType === type.value ? styles.typeCardSelected : ''}`}
              onClick={() => setSelectedType(type.value)}
              disabled={isSubmitting}
            >
              <span className={styles.icon}>
                <img src={type.icon} alt={type.label} className={styles.typeImg} />
              </span>
              <span className={styles.typeLabel}>{type.label}</span>
              <span className={styles.typeDesc}>{type.desc}</span>
            </button>
          ))}
        </div>

        {/* Bloque Google — solo para REFEREE y FAMILY_MEMBER */}
        {isGoogleRequired && (
          <div className={styles.googleRequired}>
            <p className={styles.googleRequiredText}>
              Los <strong>{labelFor(selectedType)}s</strong> deben registrarse e ingresar
              únicamente con Google.
            </p>
            <a
              href={GOOGLE_AUTH_URL}
              className={`${styles.btnGoogle} ${styles.btnGoogleLarge}`}
            >              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
              />
              Continuar con Google
            </a>
            <p className={styles.googleRequiredNote}>
              Necesitas una cuenta de Gmail para continuar.
            </p>
          </div>
        )}

        {/* Botón continuar — solo para tipos del flujo normal */}
        {isNormalFlow && (
          <div className={styles.continueBlock}>
            <Button
              variant="primary"
              fullWidth
              loading={isSubmitting}
              onClick={() => startRegistration(selectedType)}
            >
              Continuar como {labelFor(selectedType)}
            </Button>
          </div>
        )}

        <div className={styles.footer}>
          <a href="/login" className={styles.backLink}>← Ya tengo cuenta</a>
          <Link to="/" className={styles.backLinkMuted}>← Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
