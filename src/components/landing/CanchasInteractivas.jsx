import { useState } from 'react'
import styles from './CanchasInteractivas.module.css'

const COURTS = [
  {
    id: 1,
    image: '/images/canchaPrincipal.jpg',
    name: 'Cancha Principal',
    dimensions: '50 × 35 m',
    description:
      'Campo reglamentario de gran formato destinado a los partidos estelares del torneo. Superficie sintética de alto rendimiento con marcación completa, área de portería y círculo central certificados.',
    zone: { top: '2%', left: '8%', width: '84%', height: '37%' },
  },
  {
    id: 2,
    image: '/images/cancha2.jpg',
    name: 'Cancha 2',
    dimensions: '50 × 35 m',
    description:
      'Espacio de competencia con superficie sintética de última generación. Dotada con porterías fijas y señalización oficial del torneo, ideal para la fase de grupos.',
    zone: { top: '51%', left: '2%', width: '30%', height: '46%' },
  },
  {
    id: 3,
    image: '/images/cancha3.jpg',
    name: 'Cancha 3',
    dimensions: '50 × 35 m',
    description:
      'Campo central del sector sur con iluminación lateral y grama sintética certificada. Escenario principal de las fases eliminatorias y jornadas de alto tráfico.',
    zone: { top: '51%', left: '35%', width: '30%', height: '46%' },
  },
  {
    id: 4,
    image: '/images/cancha4.jpg',
    name: 'Cancha 4',
    dimensions: '50 × 35 m',
    description:
      'Cancha lateral de alto rendimiento diseñada para maximizar la rotación de partidos. Su superficie garantiza condiciones óptimas de juego durante toda la jornada.',
    zone: { top: '51%', left: '67%', width: '30%', height: '46%' },
  },
]

export default function CanchasInteractivas({ fields = [] }) {
  const [activeId, setActiveId] = useState(null)

  const courts = COURTS.map((def, i) => {
    const f = fields[i]
    if (!f) return def
    return { ...def, id: f.id ?? def.id, name: f.name ?? def.name }
  })

  const enter  = (id) => setActiveId(id)
  const leave  = ()   => setActiveId(null)
  const toggle = (id) => setActiveId(prev => (prev === id ? null : id))

  return (
    <div className={styles.outer}>
      <div className={styles.wrapper} onMouseLeave={leave}>

        {/* ── Base image (always visible, never touched) ── */}
        <img
          src="/images/SegmentacionCanchas.jpeg"
          alt="Vista aérea de las canchas — Escuela Colombiana de Ingeniería Julio Garavito"
          className={styles.baseImage}
          draggable={false}
        />

        {/* ── One zone per court ── */}
        {courts.map(court => {
          const isActive = activeId === court.id
          return (
            <div
              key={court.id}
              className={`${styles.zone} ${isActive ? styles.zoneActive : ''}`}
              style={court.zone}
              onMouseEnter={() => enter(court.id)}
              onClick={() => toggle(court.id)}
              onKeyDown={e =>
                (e.key === 'Enter' || e.key === ' ') && toggle(court.id)
              }
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={`${court.name} — ${court.dimensions}`}
            >
              {/* Layer 1 – court-specific photo, hidden until hover */}
              <img
                src={court.image}
                alt={court.name}
                className={styles.courtImage}
                draggable={false}
              />

              {/* Layer 2 – gradient + info text, on top of the photo */}
              <div className={styles.overlay}>
                <span className={styles.name}>{court.name}</span>
                <span className={styles.dimensions}>{court.dimensions}</span>
                <p className={styles.description}>{court.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      <p className={styles.hint}>
        Pasa el cursor sobre una cancha para ver su información
      </p>
    </div>
  )
}
