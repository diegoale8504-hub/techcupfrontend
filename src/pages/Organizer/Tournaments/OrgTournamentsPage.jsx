import { useState, useEffect } from 'react'
import PageLayout from '../../../components/layout/PageLayout/PageLayout'
import {
  createTournament, startTournament, finishTournament,
  assignReferee, removeRefereeFromTournament, getTournamentReferees,
  createRegulation, deleteRegulation,
  createKeyDate, deleteKeyDate,
  createField, deleteField,
} from '../../../api/organizer'
import { getTournament, getRegulations, getKeyDates, getTournamentFields, TOURNAMENT_ID } from '../../../api/tournament'
import { getReferees } from '../../../api/users'
import styles from './OrgTournamentsPage.module.css'

const STATUS_LABELS = {
  DRAFT:       'Borrador',
  ACTIVE:      'Activo',
  IN_PROGRESS: 'En progreso',
  FINISHED:    'Finalizado',
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const EMPTY_CREATE = { startDate: '', endDate: '', maxTeams: '', costPerTeam: '' }
const EMPTY_REG    = { title: '', content: '' }
const EMPTY_DATE   = { title: '', date: '', description: '' }
const EMPTY_FIELD  = { name: '', location: '', capacity: '' }

export default function OrgTournamentsPage() {
  const [tournament,   setTournament]   = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)

  // Tournament referees
  const [tournReferees,  setTournReferees]  = useState([])
  const [allReferees,    setAllReferees]    = useState([])
  const [selectedRefId,  setSelectedRefId] = useState('')
  const [assigningRef,   setAssigningRef]  = useState(false)
  const [refError,       setRefError]      = useState(null)

  // Sub-resources
  const [regulations, setRegulations] = useState([])
  const [keyDates,    setKeyDates]    = useState([])
  const [fields,      setFields]      = useState([])

  // Create tournament form
  const [creating,    setCreating]   = useState(false)
  const [createForm,  setCreateForm] = useState(EMPTY_CREATE)
  const [createError, setCreateError] = useState(null)
  const [showCreate,  setShowCreate] = useState(false)

  // Lifecycle confirm
  const [confirmAction, setConfirmAction] = useState(null) // 'start' | 'finish' | null
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError,   setActionError]   = useState(null)

  // Sub-resource forms
  const [regForm,   setRegForm]   = useState(EMPTY_REG)
  const [dateForm,  setDateForm]  = useState(EMPTY_DATE)
  const [fieldForm, setFieldForm] = useState(EMPTY_FIELD)
  const [subLoading, setSubLoading] = useState({})
  const [subError,   setSubError]   = useState({})

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, refRes, allRefRes, regRes, kdRes, fRes] = await Promise.allSettled([
          getTournament(),
          getTournamentReferees(TOURNAMENT_ID),
          getReferees(),
          getRegulations(),
          getKeyDates(),
          getTournamentFields(),
        ])
        if (tRes.status === 'fulfilled')      setTournament(tRes.value.data)
        if (refRes.status === 'fulfilled')    setTournReferees(refRes.value.data ?? [])
        if (allRefRes.status === 'fulfilled') setAllReferees(allRefRes.value.data ?? [])
        if (regRes.status === 'fulfilled')    setRegulations(regRes.value.data ?? [])
        if (kdRes.status === 'fulfilled')     setKeyDates(kdRes.value.data ?? [])
        if (fRes.status === 'fulfilled')      setFields(fRes.value.data ?? [])
        if (tRes.status === 'rejected')       setShowCreate(true)
      } catch {
        setError('Error cargando la información del torneo.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Lifecycle actions ─────────────────────────────────────────────────────

  const handleLifecycle = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    setActionError(null)
    try {
      const fn = confirmAction === 'start' ? startTournament : finishTournament
      const res = await fn(tournament.id)
      setTournament(res.data ?? { ...tournament, status: confirmAction === 'start' ? 'IN_PROGRESS' : 'FINISHED' })
    } catch (err) {
      setActionError(err.userMessage ?? `No se pudo ${confirmAction === 'start' ? 'iniciar' : 'finalizar'} el torneo.`)
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
    }
  }

  // ── Create tournament ─────────────────────────────────────────────────────

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      const res = await createTournament({
        startDate:   createForm.startDate,
        endDate:     createForm.endDate,
        maxTeams:    Number(createForm.maxTeams),
        costPerTeam: Number(createForm.costPerTeam),
      })
      setTournament(res.data)
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE)
    } catch (err) {
      setCreateError(err.userMessage ?? 'No se pudo crear el torneo.')
    } finally {
      setCreating(false)
    }
  }

  // ── Referee assignment ────────────────────────────────────────────────────

  const handleAssignRef = async () => {
    if (!selectedRefId) return
    setAssigningRef(true)
    setRefError(null)
    try {
      await assignReferee(tournament.id, { refereeId: selectedRefId })
      const added = allReferees.find((r) => r.id === selectedRefId)
      if (added) setTournReferees((prev) => [...prev, added])
      setSelectedRefId('')
    } catch (err) {
      setRefError(err.userMessage ?? 'No se pudo asignar el árbitro.')
    } finally {
      setAssigningRef(false)
    }
  }

  const handleRemoveRef = async (refId) => {
    try {
      await removeRefereeFromTournament(tournament.id, refId)
      setTournReferees((prev) => prev.filter((r) => r.id !== refId))
    } catch (err) {
      setRefError(err.userMessage ?? 'No se pudo quitar el árbitro.')
    }
  }

  // ── Generic sub-resource helpers ──────────────────────────────────────────

  const withSubLoad = async (key, fn) => {
    setSubLoading((p) => ({ ...p, [key]: true }))
    setSubError((p) => ({ ...p, [key]: null }))
    try { await fn() }
    catch (err) { setSubError((p) => ({ ...p, [key]: err.userMessage ?? 'Error al guardar.' })) }
    finally { setSubLoading((p) => ({ ...p, [key]: false })) }
  }

  const handleAddReg = (e) => {
    e.preventDefault()
    withSubLoad('reg', async () => {
      const res = await createRegulation(tournament.id, regForm)
      setRegulations((p) => [...p, res.data])
      setRegForm(EMPTY_REG)
    })
  }

  const handleDeleteReg = (id) =>
    withSubLoad(`regDel_${id}`, async () => {
      await deleteRegulation(tournament.id, id)
      setRegulations((p) => p.filter((r) => r.id !== id))
    })

  const handleAddDate = (e) => {
    e.preventDefault()
    withSubLoad('date', async () => {
      const res = await createKeyDate(tournament.id, dateForm)
      setKeyDates((p) => [...p, res.data])
      setDateForm(EMPTY_DATE)
    })
  }

  const handleDeleteDate = (id) =>
    withSubLoad(`dateDel_${id}`, async () => {
      await deleteKeyDate(tournament.id, id)
      setKeyDates((p) => p.filter((d) => d.id !== id))
    })

  const handleAddField = (e) => {
    e.preventDefault()
    withSubLoad('field', async () => {
      const res = await createField(tournament.id, fieldForm)
      setFields((p) => [...p, res.data])
      setFieldForm(EMPTY_FIELD)
    })
  }

  const handleDeleteField = (id) =>
    withSubLoad(`fieldDel_${id}`, async () => {
      await deleteField(tournament.id, id)
      setFields((p) => p.filter((f) => f.id !== id))
    })

  // ── Render helpers ────────────────────────────────────────────────────────

  const unassignedReferees = allReferees.filter(
    (r) => !tournReferees.some((tr) => tr.id === r.id)
  )

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Torneos — Gestión</h1>
        <p className={styles.sub}>Crea y administra el torneo TechCupFútbol</p>
      </div>

      {loading && <p className={styles.loading}>Cargando...</p>}
      {error   && <p className={styles.error}>{error}</p>}

      {!loading && (
        <>
          {/* ── Tournament card ─── */}
          {tournament ? (
            <div className={styles.tournCard}>
              <div className={styles.tournTop}>
                <div>
                  <h2 className={styles.tournName}>TechCupFútbol {tournament.startDate ? new Date(tournament.startDate).getFullYear() : ''}</h2>
                  <span className={`${styles.statusBadge} ${styles[`status_${tournament.status}`]}`}>
                    {STATUS_LABELS[tournament.status] ?? tournament.status}
                  </span>
                </div>
                {tournament.status === 'FINISHED' && (
                  <button className={styles.btnCreate} onClick={() => setShowCreate(true)}>+ Nuevo torneo</button>
                )}
              </div>

              <div className={styles.tournInfo}>
                {[
                  { label: 'Inicio',   value: formatDate(tournament.startDate) },
                  { label: 'Fin',      value: formatDate(tournament.endDate) },
                  { label: 'Equipos',  value: `${tournament.teamCount ?? tournament.teamsCount ?? 0}` },
                  { label: 'Costo',    value: tournament.costPerTeam ? `$${Number(tournament.costPerTeam).toLocaleString('es-CO')}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className={styles.infoItem}>
                    <span className={styles.infoLabel}>{label}</span>
                    <span className={styles.infoValue}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Lifecycle buttons */}
              <div className={styles.lifecycleRow}>
                {(tournament.status === 'DRAFT' || tournament.status === 'ACTIVE') && (
                  confirmAction === 'start' ? (
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmText}>¿Confirmas iniciar el torneo?</span>
                      <button className={styles.btnConfirmYes} onClick={handleLifecycle} disabled={actionLoading}>
                        {actionLoading ? 'Iniciando...' : 'Sí, iniciar'}
                      </button>
                      <button className={styles.btnConfirmNo} onClick={() => setConfirmAction(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <button className={styles.btnStart} onClick={() => setConfirmAction('start')}>
                      Iniciar torneo
                    </button>
                  )
                )}
                {tournament.status === 'IN_PROGRESS' && (
                  confirmAction === 'finish' ? (
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmText}>¿Confirmas finalizar el torneo?</span>
                      <button className={styles.btnConfirmYes} onClick={handleLifecycle} disabled={actionLoading}>
                        {actionLoading ? 'Finalizando...' : 'Sí, finalizar'}
                      </button>
                      <button className={styles.btnConfirmNo} onClick={() => setConfirmAction(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <button className={styles.btnFinish} onClick={() => setConfirmAction('finish')}>
                      Finalizar torneo
                    </button>
                  )
                )}
                {actionError && <p className={styles.actionError}>{actionError}</p>}
              </div>
            </div>
          ) : showCreate && (
            <div className={styles.createCard}>
              <h2 className={styles.cardTitle}>Crear torneo</h2>
              <form onSubmit={handleCreate} className={styles.createForm}>
                <div className={styles.formGrid}>
                  <label className={styles.formLabel}>
                    Fecha de inicio
                    <input type="date" className={styles.formInput} value={createForm.startDate}
                      onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))} required />
                  </label>
                  <label className={styles.formLabel}>
                    Fecha de fin
                    <input type="date" className={styles.formInput} value={createForm.endDate}
                      onChange={(e) => setCreateForm((p) => ({ ...p, endDate: e.target.value }))} required />
                  </label>
                  <label className={styles.formLabel}>
                    Máx. equipos
                    <input type="number" min="2" className={styles.formInput} value={createForm.maxTeams}
                      onChange={(e) => setCreateForm((p) => ({ ...p, maxTeams: e.target.value }))} required />
                  </label>
                  <label className={styles.formLabel}>
                    Costo por equipo ($)
                    <input type="number" min="0" className={styles.formInput} value={createForm.costPerTeam}
                      onChange={(e) => setCreateForm((p) => ({ ...p, costPerTeam: e.target.value }))} required />
                  </label>
                </div>
                {createError && <p className={styles.formError}>{createError}</p>}
                <button type="submit" className={styles.btnSubmit} disabled={creating}>
                  {creating ? 'Creando...' : 'Crear torneo'}
                </button>
              </form>
            </div>
          )}

          {tournament && (
            <div className={styles.sectionsGrid}>
              {/* ── Referees ─── */}
              <div className={styles.sectionCard}>
                <h3 className={styles.cardTitle}>Árbitros asignados ({tournReferees.length})</h3>
                {tournReferees.length === 0 ? (
                  <p className={styles.emptyMsg}>Sin árbitros asignados.</p>
                ) : (
                  <ul className={styles.refList}>
                    {tournReferees.map((r) => (
                      <li key={r.id} className={styles.refItem}>
                        <span>{r.name ?? r.email}</span>
                        <button className={styles.btnRemove} onClick={() => handleRemoveRef(r.id)}>Quitar</button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className={styles.addRow}>
                  <select className={styles.refSelect} value={selectedRefId}
                    onChange={(e) => setSelectedRefId(e.target.value)}>
                    <option value="">Seleccionar árbitro...</option>
                    {unassignedReferees.map((r) => (
                      <option key={r.id} value={r.id}>{r.name ?? r.email}</option>
                    ))}
                  </select>
                  <button className={styles.btnAdd} onClick={handleAssignRef}
                    disabled={!selectedRefId || assigningRef}>
                    {assigningRef ? '...' : 'Asignar'}
                  </button>
                </div>
                {refError && <p className={styles.subErr}>{refError}</p>}
              </div>

              {/* ── Regulations ─── */}
              <div className={styles.sectionCard}>
                <h3 className={styles.cardTitle}>Reglamento ({regulations.length})</h3>
                <ul className={styles.subList}>
                  {regulations.map((r) => (
                    <li key={r.id} className={styles.subItem}>
                      <span className={styles.subName}>{r.title}</span>
                      <button className={styles.btnRemove}
                        disabled={subLoading[`regDel_${r.id}`]}
                        onClick={() => handleDeleteReg(r.id)}>
                        {subLoading[`regDel_${r.id}`] ? '...' : 'Eliminar'}
                      </button>
                    </li>
                  ))}
                  {regulations.length === 0 && <p className={styles.emptyMsg}>Sin regulaciones.</p>}
                </ul>
                <form onSubmit={handleAddReg} className={styles.subForm}>
                  <input placeholder="Título" className={styles.subInput} value={regForm.title}
                    onChange={(e) => setRegForm((p) => ({ ...p, title: e.target.value }))} required />
                  <textarea placeholder="Contenido" className={styles.subTextarea} value={regForm.content}
                    onChange={(e) => setRegForm((p) => ({ ...p, content: e.target.value }))} />
                  <button type="submit" className={styles.btnAdd} disabled={subLoading.reg}>
                    {subLoading.reg ? '...' : '+ Agregar'}
                  </button>
                </form>
                {subError.reg && <p className={styles.subErr}>{subError.reg}</p>}
              </div>

              {/* ── Key Dates ─── */}
              <div className={styles.sectionCard}>
                <h3 className={styles.cardTitle}>Fechas clave ({keyDates.length})</h3>
                <ul className={styles.subList}>
                  {keyDates.map((d) => (
                    <li key={d.id} className={styles.subItem}>
                      <div>
                        <span className={styles.subName}>{d.title ?? d.name}</span>
                        <span className={styles.subMeta}>{formatDate(d.date)}</span>
                      </div>
                      <button className={styles.btnRemove}
                        disabled={subLoading[`dateDel_${d.id}`]}
                        onClick={() => handleDeleteDate(d.id)}>
                        {subLoading[`dateDel_${d.id}`] ? '...' : 'Eliminar'}
                      </button>
                    </li>
                  ))}
                  {keyDates.length === 0 && <p className={styles.emptyMsg}>Sin fechas clave.</p>}
                </ul>
                <form onSubmit={handleAddDate} className={styles.subForm}>
                  <input placeholder="Título" className={styles.subInput} value={dateForm.title}
                    onChange={(e) => setDateForm((p) => ({ ...p, title: e.target.value }))} required />
                  <input type="date" className={styles.subInput} value={dateForm.date}
                    onChange={(e) => setDateForm((p) => ({ ...p, date: e.target.value }))} required />
                  <button type="submit" className={styles.btnAdd} disabled={subLoading.date}>
                    {subLoading.date ? '...' : '+ Agregar'}
                  </button>
                </form>
                {subError.date && <p className={styles.subErr}>{subError.date}</p>}
              </div>

              {/* ── Fields ─── */}
              <div className={styles.sectionCard}>
                <h3 className={styles.cardTitle}>Canchas ({fields.length})</h3>
                <ul className={styles.subList}>
                  {fields.map((f) => (
                    <li key={f.id} className={styles.subItem}>
                      <div>
                        <span className={styles.subName}>{f.name}</span>
                        {f.location && <span className={styles.subMeta}>{f.location}</span>}
                      </div>
                      <button className={styles.btnRemove}
                        disabled={subLoading[`fieldDel_${f.id}`]}
                        onClick={() => handleDeleteField(f.id)}>
                        {subLoading[`fieldDel_${f.id}`] ? '...' : 'Eliminar'}
                      </button>
                    </li>
                  ))}
                  {fields.length === 0 && <p className={styles.emptyMsg}>Sin canchas registradas.</p>}
                </ul>
                <form onSubmit={handleAddField} className={styles.subForm}>
                  <input placeholder="Nombre de la cancha" className={styles.subInput} value={fieldForm.name}
                    onChange={(e) => setFieldForm((p) => ({ ...p, name: e.target.value }))} required />
                  <input placeholder="Ubicación" className={styles.subInput} value={fieldForm.location}
                    onChange={(e) => setFieldForm((p) => ({ ...p, location: e.target.value }))} />
                  <button type="submit" className={styles.btnAdd} disabled={subLoading.field}>
                    {subLoading.field ? '...' : '+ Agregar'}
                  </button>
                </form>
                {subError.field && <p className={styles.subErr}>{subError.field}</p>}
              </div>
            </div>
          )}
        </>
      )}
    </PageLayout>
  )
}
