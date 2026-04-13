import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import { getTournament, getKeyDates, getRegulations, getTournamentFields } from '../../api/tournament'
import styles from './SettingsPage.module.css'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SettingsPage() {
  const [tournament, setTournament]     = useState(null)
  const [keyDates, setKeyDates]         = useState([])
  const [regulations, setRegulations]   = useState([])
  const [fields, setFields]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, kRes, rRes, fRes] = await Promise.allSettled([
          getTournament(), getKeyDates(), getRegulations(), getTournamentFields(),
        ])
        if (tRes.status === 'fulfilled') setTournament(tRes.value.data)
        if (kRes.status === 'fulfilled') setKeyDates(kRes.value.data ?? [])
        if (rRes.status === 'fulfilled') setRegulations(rRes.value.data ?? [])
        if (fRes.status === 'fulfilled') setFields(fRes.value.data ?? [])
        if (tRes.status === 'rejected') setError('No se pudo cargar la configuración del torneo.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Configuración del torneo</h1>
        <p className={styles.sub}>Panel de administración — TechCupFútbol 2026</p>
      </div>

      {loading && <p className={styles.loading}>Cargando...</p>}
      {error   && <p className={styles.error}>{error}</p>}

      {!loading && (
        <div className={styles.grid}>
          {/* Tournament info */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Información general</h2>
            {tournament ? (
              <div className={styles.infoList}>
                {[
                  { label: 'Estado',   value: tournament.status },
                  { label: 'Inicio',   value: formatDate(tournament.startDate) },
                  { label: 'Final',    value: formatDate(tournament.endDate) },
                  { label: 'Equipos',  value: `${tournament.teamsCount ?? 0} / ${tournament.maxTeams ?? '—'}` },
                  { label: 'Costo',    value: tournament.costPerTeam ? `$${tournament.costPerTeam.toLocaleString('es-CO')}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className={styles.infoRow}>
                    <span className={styles.infoLabel}>{label}</span>
                    <span className={styles.infoValue}>{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyMsg}>Sin datos de torneo.</p>
            )}
          </div>

          {/* Canchas */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Canchas ({fields.length})</h2>
            {fields.length > 0 ? (
              <ul className={styles.simpleList}>
                {fields.map((f) => (
                  <li key={f.id} className={styles.simpleItem}>
                    <span className={styles.fieldName}>{f.name}</span>
                    {f.location && <span className={styles.fieldMeta}>{f.location}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyMsg}>No hay canchas configuradas.</p>
            )}
          </div>

          {/* Fechas clave */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Fechas clave</h2>
            {keyDates.length > 0 ? (
              <ul className={styles.simpleList}>
                {keyDates.map((k) => (
                  <li key={k.id} className={styles.simpleItem}>
                    <span className={styles.fieldName}>{k.title ?? k.name}</span>
                    <span className={styles.fieldMeta}>{formatDate(k.date)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyMsg}>No hay fechas clave registradas.</p>
            )}
          </div>

          {/* Reglamento */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Reglamento ({regulations.length})</h2>
            {regulations.length > 0 ? (
              <ul className={styles.simpleList}>
                {regulations.map((r) => (
                  <li key={r.id} className={styles.simpleItem}>
                    <span className={styles.fieldName}>{r.title}</span>
                    {r.description && <p className={styles.regDesc}>{r.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyMsg}>No hay reglas registradas.</p>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  )
}
