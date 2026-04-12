import { Link } from 'react-router-dom'
import { useRegistration } from '../../../hooks/useRegistration'
import styles from './UserTypeSelectionPage.module.css'

const USER_TYPES = [
  { value: 'STUDENT',        label: 'Estudiante',     img: '/images/registro_Estudiante.png',      desc: 'Estudiante activo de la Escuela' },
  { value: 'GRADUATE',       label: 'Graduado',       img: '/images/registro_Graduado.png',        desc: 'Egresado de la institución' },
  { value: 'PROFESSOR',      label: 'Profesor',       img: '/images/registro_Profesor.png',        desc: 'Docente de la Escuela' },
  { value: 'ADMINISTRATIVE', label: 'Administrativo', img: '/images/registro_Administrativo.png',  desc: 'Personal administrativo' },
  { value: 'FAMILY_MEMBER',  label: 'Familiar',       img: '/images/registro_Familiar.png',        desc: 'Familiar de un miembro de la comunidad' },
  { value: 'REFEREE',        label: 'Árbitro',        img: '/images/registro_Arbitro.png',         desc: 'Árbitro del torneo' },
]

export default function UserTypeSelectionPage() {
  const { startRegistration, isSubmitting, error } = useRegistration()

  return (
    <div className={`${styles.root} page-enter`}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="/images/logofinal.png" alt="TechCupFútbol" className={styles.logoImg} />
          <h1 className={styles.title}>Registro TechCupFútbol</h1>
          <p className={styles.desc}>Selecciona tu tipo de perfil para comenzar el registro.</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.grid}>
          {USER_TYPES.map((type, index) => (
            <button
              key={type.value}
              className={`${styles.typeCard} card-enter stagger-${index + 1}`}
              onClick={() => startRegistration(type.value)}
              disabled={isSubmitting}
              style={{ perspective: '600px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px) rotateY(4deg) rotateX(2deg)'
                e.currentTarget.style.borderColor = 'var(--color-primary)'
                e.currentTarget.style.background = 'var(--color-bg-valid)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) rotateY(0) rotateX(0)'
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.background = ''
              }}
            >
              <img src={type.img} alt={type.label} className={styles.typeImg} />
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
