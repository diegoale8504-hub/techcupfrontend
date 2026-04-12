import { useNavigate } from 'react-router-dom'

export default function CTAFinal() {
  const navigate = useNavigate()

  return (
    <section className="landing-section landing-cta-section">
      <div className="landing-container--narrow landing-cta-section__inner">
        <h2 className="landing-cta-section__title">
          ¿Listo para competir?
        </h2>
        <p className="landing-cta-section__text">
          Regístrate, forma tu equipo y sigue cada resultado desde una sola plataforma.
        </p>
        <div className="landing-cta-section__actions">
          <button
            className="landing-btn landing-btn--accent landing-btn--lg"
            onClick={() => navigate('/register')}
          >
            Crear cuenta
          </button>
          <button
            className="landing-btn landing-btn--outline landing-btn--lg"
            onClick={() => navigate('/login')}
          >
            Ya tengo cuenta
          </button>
        </div>
      </div>
    </section>
  )
}
