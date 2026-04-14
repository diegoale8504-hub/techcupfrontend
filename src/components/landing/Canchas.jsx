import { useState, useEffect } from 'react'
import { getFields } from '../../api/landing'
import CanchasInteractivas from './CanchasInteractivas'

export default function Canchas() {
  const [fields, setFields] = useState([])
  const [error, setError]   = useState(null)

  const load = () => {
    setError(null)
    getFields()
      .then((res) => setFields(res.data ?? []))
      .catch((err) => {
        console.error(err)
        setError(err.userMessage ?? 'No se pudieron cargar las canchas.')
      })
  }

  useEffect(() => { load() }, [])

  return (
    <section className="landing-section landing-section--light" id="canchas">
      <div className="landing-container">
        <h2 className="landing-section__title">Canchas</h2>
        <p className="landing-section__subtitle">
          Los espacios donde se disputa el torneo.
        </p>

        {/* Interactive image — shown immediately; API data enriches the overlays */}
        <CanchasInteractivas fields={fields} />

        {error && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button className="landing-btn landing-btn--primary" onClick={load}>
              Reintentar
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
