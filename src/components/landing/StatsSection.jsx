import { useState, useEffect, useRef } from 'react'
import { getTournamentStats } from '../../api/landing'

// TODO: Reemplazar con datos reales cuando GET /api/tournament/stats esté disponible
const STATIC_FALLBACK = [
  { key: 'teams',   value: 12,  label: 'Equipos inscritos' },
  { key: 'matches', value: 47,  label: 'Partidos jugados' },
  { key: 'goals',   value: 183, label: 'Goles marcados' },
  { key: 'players', value: 156, label: 'Jugadores activos' },
]

function useCounter(target, active) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active || target === 0) return
    let frame
    const duration = 1500
    const start = performance.now()

    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
      else setCount(target)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, target])

  return count
}

function StatCounter({ stat, active }) {
  const count = useCounter(stat.value, active)
  return (
    <div className="landing-stat">
      <span className="landing-stat__value">
        {count.toLocaleString('es-CO')}
      </span>
      <span className="landing-stat__label">{stat.label}</span>
    </div>
  )
}

export default function StatsSection() {
  const [stats, setStats]   = useState(STATIC_FALLBACK)
  const [active, setActive] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    // TODO: Endpoint /api/tournament/stats — usar fallback estático si no está disponible
    getTournamentStats()
      .then((res) => {
        const d = res.data ?? {}
        setStats([
          { key: 'teams',   value: d.totalTeams   ?? STATIC_FALLBACK[0].value, label: STATIC_FALLBACK[0].label },
          { key: 'matches', value: d.totalMatches  ?? STATIC_FALLBACK[1].value, label: STATIC_FALLBACK[1].label },
          { key: 'goals',   value: d.totalGoals    ?? STATIC_FALLBACK[2].value, label: STATIC_FALLBACK[2].label },
          { key: 'players', value: d.totalPlayers  ?? STATIC_FALLBACK[3].value, label: STATIC_FALLBACK[3].label },
        ])
      })
      .catch(() => {
        // Endpoint no implementado aún — se mantiene el fallback estático
      })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="landing-section landing-section--dark" ref={ref}>
      <div className="landing-container">
        <h2 className="landing-section__title landing-section__title--light">
          El torneo en números
        </h2>
        <div className="landing-stats-grid">
          {stats.map((s) => (
            <StatCounter key={s.key} stat={s} active={active} />
          ))}
        </div>
      </div>
    </section>
  )
}
