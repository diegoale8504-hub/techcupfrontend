import { Link } from 'react-router-dom'
import { useRegistration } from '../../../hooks/useRegistration'
import Button from '../../../components/ui/Button/Button'
import styles from './UserTypeSelectionPage.module.css'

const USER_TYPES = [
  { value: 'STUDENT',        label: 'Estudiante',      icon: '/images/registro_Estudiante.png', desc: 'Estudiante activo de la Escuela' },
  { value: 'GRADUATE',       label: 'Graduado',        icon: '/images/registro_Graduado.png', desc: 'Egresado de la institución' },
  { value: 'PROFESSOR',      label: 'Profesor',        icon: '/images/registro_Profesor.png', desc: 'Docente de la Escuela' },
  { value: 'ADMINISTRATIVE', label: 'Administrativo',  icon: '/images/registro_Administrativo.png', desc: 'Personal administrativo' },
  { value: 'FAMILY_MEMBER',  label: 'Familiar',        icon: '/images/registro_Familiar.png', desc: 'Familiar de un miembro de la comunidad' },
  { value: 'REFEREE',        label: 'Árbitro',         icon: '/images/registro_Arbitro.png', desc: 'Árbitro del torneo' },
]

export default function UserTypeSelectionPage() {
  const { startRegistration, isSubmitting, error } = useRegistration()

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="/images/logofinal.png" alt="TechCupFútbol" className={styles.logoImg} />
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
              <span className={styles.icon}>
                <img src={type.icon} alt={type.label} className={styles.typeImg} />
              </span>
              <span className={styles.typeLabel}>{type.label}</span>
              <span className={styles.typeDesc}>{type.desc}</span>
            </button>
          ))}
        </div>

        <div className={styles.footer}>
          <a href="/login" className={styles.backLink}>← Ya tengo cuenta</a>
          <Link to="/" className={styles.backLinkMuted}>← Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
