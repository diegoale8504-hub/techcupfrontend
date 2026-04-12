import { useState, useEffect } from 'react'
import { getFields } from '../../api/landing'

function CanchasSkeleton() {
  return (
    <div className="landing-grid-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="landing-card landing-skeleton-card">
          <div className="landing-skeleton landing-skeleton--title" />
          <div className="landing-skeleton landing-skeleton--text" />
          <div className="landing-skeleton landing-skeleton--text landing-skeleton--short" />
        </div>
      ))}
    </div>
  )
}

function CanchasEmpty() {
  return (
    <div className="landing-empty">
      <p className="landing-empty__title">No hay canchas registradas</p>
      <p className="landing-empty__text">
        Las canchas del torneo aparecerán aquí en cuanto sean publicadas.
      </p>
    </div>
  )
}

function CanchaCard({ field }) {
  return (
    <div className="landing-card landing-cancha-card">
      <h3 className="landing-card__title">{field.name}</h3>
      <p className="landing-cancha-card__location">{field.location ?? '—'}</p>
      {field.surface && <span className="landing-badge">{field.surface}</span>}
    </div>
  )
}

export default function Canchas() {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getFields()
      .then((res) => setFields(res.data ?? []))
      .catch((err) => {
        console.error(err)
        setError(err.userMessage ?? 'No se pudieron cargar las canchas.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <section className="landing-section landing-section--light" id="canchas">
      <div className="landing-container">
        <h2 className="landing-section__title">Canchas</h2>
        <p className="landing-section__subtitle">
          Los espacios donde se disputa el torneo.
        </p>

        {loading && <CanchasSkeleton />}

        {!loading && error && (
          <div className="landing-error">
            <p>{error}</p>
            <button className="landing-btn landing-btn--primary" onClick={load}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && fields.length === 0 && <CanchasEmpty />}

        {!loading && !error && fields.length > 0 && (
          <div className="landing-grid-3">
            {fields.map((f) => <CanchaCard key={f.id} field={f} />)}
          </div>
        )}
      </div>
    </section>
  )
}
