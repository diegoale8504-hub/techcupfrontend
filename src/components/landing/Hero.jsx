import { useNavigate } from 'react-router-dom'

const HERO_STATS = [
  { value: '12',   label: 'Equipos' },
  { value: '47',   label: 'Partidos jugados' },
  { value: '183',  label: 'Goles marcados' },
  { value: '2026', label: 'Temporada' },
]

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className="landing-hero" id="inicio">
      <video
        className="landing-hero-video"
        src="/images/Acercamiento.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
      <div className="landing-hero-overlay" />

      <div className="landing-hero__content">
        <p className="landing-hero__eyebrow">Escuela Colombiana de Ingeniería</p>
        <h1 className="landing-hero__title">
          El torneo universitario<br />
          de fútbol,{' '}
          <span className="landing-hero__accent">organizado.</span>
        </h1>
        <p className="landing-hero__subtitle">
          Inscripciones, resultados, rankings y partidos en un solo lugar.
          Sin WhatsApp. Sin hojas de cálculo.
        </p>
        <div className="landing-hero__actions">
          <button
            className="landing-btn landing-btn--accent landing-btn--lg"
            onClick={() => navigate('/register')}
          >
            Inscribirse al torneo
          </button>
          <a href="#partidos" className="landing-btn landing-btn--outline landing-btn--lg">
            Ver próximos partidos
          </a>
        </div>
      </div>

      <div className="landing-hero__stats">
        {HERO_STATS.map((s) => (
          <div className="landing-hero__stat" key={s.label}>
            <span className="landing-hero__stat-value">{s.value}</span>
            <span className="landing-hero__stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
