import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = () => setMenuOpen(false)

  return (
    <nav className={`landing-nav${scrolled ? ' landing-nav--scrolled' : ''}`}>
      <div className="landing-nav__inner">
        <Link to="/" className="landing-nav__brand" onClick={close}>
          <img
            src="/images/logoFinalFinal.png"
            alt="TechCupFútbol"
            className="landing-nav__logo"
          />
        </Link>

        <button
          className="landing-nav__hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          <span className={`landing-hamburger-icon${menuOpen ? ' open' : ''}`} />
        </button>

        <div className={`landing-nav__menu${menuOpen ? ' landing-nav__menu--open' : ''}`}>
          <ul className="landing-nav__links">
            <li><a href="#inicio" onClick={close}>Inicio</a></li>
            <li><a href="#canchas" onClick={close}>Canchas</a></li>
            <li><a href="#partidos" onClick={close}>Próximos Partidos</a></li>
            <li><a href="#ranking" onClick={close}>Ranking</a></li>
          </ul>
          <div className="landing-nav__ctas">
            <button
              className="landing-btn landing-btn--ghost"
              onClick={() => { close(); navigate('/login') }}
            >
              Iniciar sesión
            </button>
            <button
              className="landing-btn landing-btn--primary"
              onClick={() => { close(); navigate('/register') }}
            >
              Registrarse
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
