import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../../components/layout/PageLayout/PageLayout'
import {
  createTournament, startTournament, finishTournament,
  assignReferee, removeRefereeFromTournament, getTournamentReferees,
  uploadRegulationPdf, createMatchSchedule, deleteMatchSchedule,
} from '../../../api/organizer'
import { getAllTournaments, getMatchSchedules } from '../../../api/tournament'
import { getReferees } from '../../../api/users'
import { getAllTeams } from '../../../api/teams'
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

function formatCOP(value) {
  if (value == null) return '—'
  return `COP ${Number(value).toLocaleString('es-CO')}`
}

const EMPTY_CREATE = { startDate: '', endDate: '', maxTeams: '', costPerTeam: '' }

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

  // Create tournament form
  const [creating,    setCreating]   = useState(false)
  const [createForm,  setCreateForm] = useState(EMPTY_CREATE)
  const [createError, setCreateError] = useState(null)
  const [showCreate,  setShowCreate] = useState(false)

  // Lifecycle confirm
  const [confirmAction, setConfirmAction] = useState(null) // 'start' | 'finish' | null
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError,   setActionError]   = useState(null)

  // Regulation PDF
  const [pdfUploading,  setPdfUploading]  = useState(false)
  const [pdfError,      setPdfError]      = useState(null)
  const [pdfSuccess,    setPdfSuccess]    = useState(null)
  const pdfInputRef = useRef(null)

  // Match schedules
  const [matches,         setMatches]         = useState([])
  const [allTeams,        setAllTeams]        = useState([])
  const [showMatchForm,   setShowMatchForm]   = useState(false)
  const [matchCreating,   setMatchCreating]   = useState(false)
  const [matchError,      setMatchError]      = useState(null)
  const [matchForm,       setMatchForm]       = useState({
    homeTeamId: '', awayTeamId: '', scheduledAt: '', matchName: '', phase: 'ELIMINATORIAS', notes: '',
  })

  useEffect(() => {
    const load = async () => {
      try {
        const listRes = await getAllTournaments()
        const tournaments = listRes.data ?? []
        const active = tournaments.find((t) => t.status !== 'FINISHED') ?? tournaments[0] ?? null

        if (!active) {
          setShowCreate(true)
          setLoading(false)
          return
        }

        setTournament(active)
        const tid = active.id

        const [refRes, allRefRes, matchRes, teamsRes] = await Promise.allSettled([
          getTournamentReferees(tid),
          getReferees(),
          getMatchSchedules(tid),
          getAllTeams(),
        ])
        if (refRes.status === 'fulfilled')    setTournReferees(refRes.value.data ?? [])
        if (allRefRes.status === 'fulfilled') setAllReferees(allRefRes.value.data ?? [])
        if (matchRes.status === 'fulfilled')  setMatches(matchRes.value.data ?? [])
        if (teamsRes.status === 'fulfilled')  setAllTeams(teamsRes.value.data ?? [])
      } catch {
        setShowCreate(true)
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
        teamCount:   Number(createForm.maxTeams),
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
      await assignReferee(tournament.id, [selectedRefId])
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

  // ── Regulation PDF ────────────────────────────────────────────────────────

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setPdfError('Solo se permiten archivos PDF.')
      return
    }
    setPdfUploading(true)
    setPdfError(null)
    setPdfSuccess(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await uploadRegulationPdf(tournament.id, formData)
      setTournament((prev) => ({ ...prev, hasRegulationPdf: true, regulationPdfName: file.name }))
      setPdfSuccess(`"${file.name}" cargado correctamente.`)
    } catch (err) {
      setPdfError(err.userMessage ?? 'No se pudo subir el reglamento.')
    } finally {
      setPdfUploading(false)
      if (pdfInputRef.current) pdfInputRef.current.value = ''
    }
  }

  // ── Match schedule handlers ───────────────────────────────────────────────

  const handleCreateMatch = async (e) => {
    e.preventDefault()
    if (matchForm.homeTeamId === matchForm.awayTeamId) {
      setMatchError('Los dos equipos deben ser diferentes.')
      return
    }
    setMatchCreating(true)
    setMatchError(null)
    try {
      const res = await createMatchSchedule(tournament.id, {
        homeTeamId:  matchForm.homeTeamId,
        awayTeamId:  matchForm.awayTeamId,
        scheduledAt: matchForm.scheduledAt,
        matchName:   matchForm.matchName || undefined,
        phase:       matchForm.phase || undefined,
        notes:       matchForm.notes || undefined,
      })
      setMatches((prev) => [...prev, res.data])
      setShowMatchForm(false)
      setMatchForm({ homeTeamId: '', awayTeamId: '', scheduledAt: '', matchName: '', phase: 'ELIMINATORIAS', notes: '' })
    } catch (err) {
      setMatchError(err.userMessage ?? 'No se pudo programar el partido.')
    } finally {
      setMatchCreating(false)
    }
  }

  const handleDeleteMatch = async (matchId) => {
    try {
      await deleteMatchSchedule(tournament.id, matchId)
      setMatches((prev) => prev.filter((m) => m.id !== matchId))
    } catch {
      // silent
    }
  }

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
          {/* ── Create tournament form ─── */}
          {showCreate ? (
            <div className={styles.createCard}>
              <div className={styles.createHeader}>
                <h2 className={styles.cardTitle}>Crear nuevo torneo</h2>
                {tournament && (
                  <button className={styles.btnCancelCreate} onClick={() => setShowCreate(false)}>
                    Cancelar
                  </button>
                )}
              </div>
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
                    Costo por equipo (COP)
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
          ) : tournament && (
            /* ── Tournament card ─── */
            <div className={styles.tournCard}>
              <div className={styles.tournTop}>
                <div>
                  <h2 className={styles.tournName}>TechCupFútbol {tournament.startDate ? new Date(tournament.startDate).getFullYear() : ''}</h2>
                  <span className={`${styles.statusBadge} ${styles[`status_${tournament.status}`]}`}>
                    {STATUS_LABELS[tournament.status] ?? tournament.status}
                  </span>
                </div>
                {tournament.status === 'FINISHED' && (
                  <button className={styles.btnCreate} onClick={() => {
                    setCreateForm(EMPTY_CREATE);
                    setShowCreate(true);
                  }}>+ Nuevo torneo</button>
                )}
              </div>

              <div className={styles.tournInfo}>
                {[
                  { label: 'Inicio',  value: formatDate(tournament.startDate) },
                  { label: 'Fin',     value: formatDate(tournament.endDate) },
                  { label: 'Equipos', value: `${tournament.teamCount ?? 0}` },
                  { label: 'Costo',   value: formatCOP(tournament.costPerTeam) },
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
          )}

          {/* ── Partidos programados (llaves) ─── */}
          {!showCreate && tournament && (
            <div className={styles.matchesSection}>
              <div className={styles.matchesSectionHeader}>
                <h3 className={styles.cardTitle} style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                  Partidos programados ({matches.length})
                </h3>
                <button className={styles.btnAdd} onClick={() => { setShowMatchForm((v) => !v); setMatchError(null) }}>
                  {showMatchForm ? 'Cancelar' : '+ Programar partido'}
                </button>
              </div>

              {/* Form for creating a new match */}
              {showMatchForm && (
                <form className={styles.matchForm} onSubmit={handleCreateMatch}>
                  <div className={styles.matchFormGrid}>
                    <label className={styles.formLabel}>
                      Equipo local
                      <select className={styles.formInput} value={matchForm.homeTeamId}
                        onChange={(e) => setMatchForm((p) => ({ ...p, homeTeamId: e.target.value }))} required>
                        <option value="">Seleccionar equipo...</option>
                        {allTeams.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.formLabel}>
                      Equipo visitante
                      <select className={styles.formInput} value={matchForm.awayTeamId}
                        onChange={(e) => setMatchForm((p) => ({ ...p, awayTeamId: e.target.value }))} required>
                        <option value="">Seleccionar equipo...</option>
                        {allTeams.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.formLabel}>
                      Fecha y hora
                      <input type="datetime-local" className={styles.formInput} value={matchForm.scheduledAt}
                        onChange={(e) => setMatchForm((p) => ({ ...p, scheduledAt: e.target.value }))} required />
                    </label>
                    <label className={styles.formLabel}>
                      Fase / Ronda
                      <select className={styles.formInput} value={matchForm.phase}
                        onChange={(e) => setMatchForm((p) => ({ ...p, phase: e.target.value }))}>
                        <option value="ELIMINATORIAS">Eliminatorias</option>
                        <option value="OCTAVOS">Octavos de final</option>
                        <option value="CUARTOS">Cuartos de final</option>
                        <option value="SEMIFINAL">Semifinal</option>
                        <option value="FINAL">Final</option>
                      </select>
                    </label>
                    <label className={styles.formLabel}>
                      Nombre del partido (opcional)
                      <input type="text" className={styles.formInput} placeholder="Ej: Partido 1 - Grupo A"
                        value={matchForm.matchName}
                        onChange={(e) => setMatchForm((p) => ({ ...p, matchName: e.target.value }))} />
                    </label>
                    <label className={styles.formLabel}>
                      Notas (opcional)
                      <input type="text" className={styles.formInput} placeholder="Cancha, árbitro, etc."
                        value={matchForm.notes}
                        onChange={(e) => setMatchForm((p) => ({ ...p, notes: e.target.value }))} />
                    </label>
                  </div>
                  {matchError && <p className={styles.formError}>{matchError}</p>}
                  <button type="submit" className={styles.btnSubmit} disabled={matchCreating}>
                    {matchCreating ? 'Guardando...' : 'Crear partido'}
                  </button>
                </form>
              )}

              {/* Match list */}
              {matches.length === 0 && !showMatchForm && (
                <p className={styles.emptyMsg}>No hay partidos programados. Crea el primero.</p>
              )}
              <div className={styles.matchList}>
                {matches.map((m) => {
                  const home = m.homeTeamName || allTeams.find((t) => t.id === m.homeTeamId)?.name || 'TBD'
                  const away = m.awayTeamName || allTeams.find((t) => t.id === m.awayTeamId)?.name || 'TBD'
                  const dt   = m.scheduledAt ? new Date(m.scheduledAt) : null
                  return (
                    <div key={m.id} className={styles.matchRow}>
                      <div className={styles.matchRowPhase}>{m.phase || '—'}</div>
                      <div className={styles.matchRowTeams}>
                        <span className={styles.matchRowTeamName}>{home}</span>
                        <span className={styles.matchRowVs}>vs</span>
                        <span className={styles.matchRowTeamName}>{away}</span>
                      </div>
                      <div className={styles.matchRowDate}>
                        {dt ? dt.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                      <button className={styles.btnRemove} onClick={() => handleDeleteMatch(m.id)}>Eliminar</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!showCreate && tournament && (
            <div className={styles.sectionsGrid}>
              {/* ── Árbitros ─── */}
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

              {/* ── Reglamento PDF ─── */}
              <div className={styles.sectionCard}>
                <h3 className={styles.cardTitle}>Reglamento</h3>
                {tournament.hasRegulationPdf ? (
                  <div className={styles.pdfInfo}>
                    <span className={styles.pdfIcon}>PDF</span>
                    <div className={styles.pdfDetails}>
                      <span className={styles.pdfName}>{tournament.regulationPdfName ?? 'reglamento.pdf'}</span>
                      <a
                        href={`/api/tournaments/${tournament.id}/regulation-pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.pdfLink}
                      >
                        Ver / Descargar
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className={styles.emptyMsg}>No hay reglamento cargado.</p>
                )}
                <div className={styles.pdfUploadArea}>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    className={styles.pdfInput}
                    id="regulationPdf"
                    onChange={handlePdfUpload}
                    disabled={pdfUploading}
                  />
                  <label htmlFor="regulationPdf" className={`${styles.btnAdd} ${pdfUploading ? styles.btnDisabled : ''}`}>
                    {pdfUploading ? 'Subiendo...' : tournament.hasRegulationPdf ? 'Reemplazar PDF' : 'Subir PDF'}
                  </label>
                </div>
                {pdfSuccess && <p className={styles.pdfSuccess}>{pdfSuccess}</p>}
                {pdfError   && <p className={styles.subErr}>{pdfError}</p>}
              </div>
            </div>
          )}
        </>
      )}
    </PageLayout>
  )
}
