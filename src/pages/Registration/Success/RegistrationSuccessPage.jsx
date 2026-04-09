import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button/Button'
import styles from './RegistrationSuccessPage.module.css'

// Pastel + brand confetti colours
const CONFETTI_COLORS = [
  '#16A34A', '#22C55E', '#86EFAC', '#C8F135',
  '#FACC15', '#FDE68A', '#6EE7B7', '#ffffff',
]

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

export default function RegistrationSuccessPage() {
  const navigate = useNavigate()
  const [confetti, setConfetti] = useState([])
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const pieces = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: randomBetween(0, 100),
      top: randomBetween(-20, 0),
      size: randomBetween(8, 14),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: randomBetween(0, 0.6),
      duration: randomBetween(2.2, 3.4),
      rotate: randomBetween(0, 360),
    }))
    setConfetti(pieces)
  }, [])

  const handleGoToLogin = () => {
    setExiting(true)
    setTimeout(() => navigate('/login'), 350)
  }

  return (
    <div className={`${styles.root} ${exiting ? 'page-exit' : 'page-fade'}`}>
      {/* Confetti layer */}
      {confetti.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
            borderRadius: p.size > 11 ? '50%' : '2px',
          }}
        />
      ))}

      {/* Green radial glow backdrop */}
      <div className={styles.glow} />

      {/* Card */}
      <div className={`${styles.card} page-enter`}>
        {/* Animated checkmark */}
        <div className={`${styles.checkWrapper} success-pulse`}>
          <div className={`${styles.checkCircle} check-pop`}>
            <svg
              className={`${styles.checkSvg} check-bounce`}
              viewBox="0 0 52 52"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="26" cy="26" r="25" stroke="#16A34A" strokeWidth="2" fill="#F0FDF4" />
              <path
                d="M14 27l8 8 16-16"
                stroke="#16A34A"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <h1 className={styles.title}>¡Registro Exitoso!</h1>
        <p className={styles.subtitle}>
          Tu cuenta ha sido creada correctamente.<br />
          Bienvenido a <strong>TechCupFútbol</strong>.
        </p>

        <div className={styles.divider} />

        <p className={styles.hint}>
          Ya puedes iniciar sesión con tus credenciales.
        </p>

        <Button variant="primary" fullWidth onClick={handleGoToLogin}>
          Ir al inicio de sesión
        </Button>
      </div>
    </div>
  )
}
