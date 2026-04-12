import { useRegistration } from '../../../hooks/useRegistration'
import Button from '../../../components/ui/Button/Button'
import styles from './UserTypeSelectionPage.module.css'

const USER_TYPES = [
  { value: 'STUDENT',        label: 'Estudiante',      icon: '', desc: 'Estudiante activo de la Escuela' },
  { value: 'GRADUATE',       label: 'Graduado',        icon: '', desc: 'Egresado de la institución' },
  { value: 'PROFESSOR',      label: 'Profesor',        icon: '', desc: 'Docente de la Escuela' },
  { value: 'ADMINISTRATIVE', label: 'Administrativo',  icon: '', desc: 'Personal administrativo' },
  { value: 'FAMILY_MEMBER',  label: 'Familiar',        icon: '', desc: 'Familiar de un miembro de la comunidad' },
  { value: 'REFEREE',        label: 'Árbitro',         icon: '', desc: 'Árbitro del torneo' },
]

export default function UserTypeSelectionPage() {
  const { startRegistration, isSubmitting, error } = useRegistration()

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="/images/logo-copa.png" alt="TechCupFútbol" className={styles.logoImg} />
          <h1 className={styles.title}>Registro TechCupFútbol</h1>
          <p className={styles.desc}>Selecciona tu tipo de perfil para comenzar el registro.</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.grid}>
          {USER_TYPES.map((type) => (
            <button
              key={type.value}
              className={styles.typeCard}
              onClick={() => startRegistration(type.value)}
              disabled={isSubmitting}
            >
              <span className={styles.icon}>{type.icon}</span>
              <span className={styles.typeLabel}>{type.label}</span>
              <span className={styles.typeDesc}>{type.desc}</span>
            </button>
          ))}
        </div>

        <div className={styles.footer}>
          <a href="/login" className={styles.backLink}>← Ya tengo cuenta</a>
        </div>
      </div>
    </div>
  )
}
