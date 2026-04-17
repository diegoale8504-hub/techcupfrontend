import { useState, useEffect, useMemo, useRef } from 'react'
import PageLayout from '../../../components/layout/PageLayout/PageLayout'
import Badge from '../../../components/ui/Badge/Badge'
import { getAllPaymentProofs, updatePaymentStatus } from '../../../api/organizer'
import { getAllTeams } from '../../../api/teams'
import styles from './OrgPaymentsPage.module.css'

const TABS = [
  { key: 'ALL',          label: 'Todos' },
  { key: 'PENDING',      label: 'Pendientes' },
  { key: 'UNDER_REVIEW', label: 'En revisión' },
  { key: 'APPROVED',     label: 'Aprobados' },
  { key: 'REJECTED',     label: 'Rechazados' },
]

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function OrgPaymentsPage() {
  const [proofs, setProofs]       = useState([])
  const [teamNames, setTeamNames] = useState({}) // { teamId: teamName }
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [activeTab, setActiveTab] = useState('ALL')
  const [updating, setUpdating]   = useState({})   // { [key]: true }
  const [updateErrors, setUpdateErrors] = useState({})
  // Per-card reject form state: { [key]: { open: bool, reason: string } }
  const [rejectForms, setRejectForms] = useState({})
  const intervalRef = useRef(null)

  const loadProofs = () =>
    getAllPaymentProofs()
      .then((res) => setProofs(res.data ?? []))
      .catch(() => setError('No se pudieron cargar los comprobantes de pago.'))

  useEffect(() => {
    Promise.all([
      getAllPaymentProofs(),
      getAllTeams(),
    ])
      .then(([proofsRes, teamsRes]) => {
        setProofs(proofsRes.data ?? [])
        const map = {}
        ;(teamsRes.data ?? []).forEach((t) => { map[t.id] = t.name })
        setTeamNames(map)
      })
      .catch(() => setError('No se pudieron cargar los datos.'))
      .finally(() => setLoading(false))

    // Polling cada 15s
    intervalRef.current = setInterval(loadProofs, 15000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const filtered = useMemo(() => {
    if (activeTab === 'ALL') return proofs
    return proofs.filter((p) => p.status === activeTab)
  }, [proofs, activeTab])

  const countByStatus = useMemo(() => {
    const counts = {}
    proofs.forEach((p) => { counts[p.status] = (counts[p.status] ?? 0) + 1 })
    return counts
  }, [proofs])

  const tabCount = (key) => {
    if (key === 'ALL') return proofs.length
    return countByStatus[key] ?? 0
  }

  const handleStatus = async (proof, newStatus, comments = '') => {
    const key = proof.id ?? proof.teamId
    setUpdating((p) => ({ ...p, [key]: true }))
    setUpdateErrors((p) => ({ ...p, [key]: null }))
    try {
      await updatePaymentStatus(proof.teamId, newStatus, comments)
      const res = await getAllPaymentProofs()
      setProofs(res.data ?? [])
      // Cerrar form de rechazo si estaba abierto
      setRejectForms((p) => ({ ...p, [key]: { open: false, reason: '' } }))
    } catch (err) {
      setUpdateErrors((p) => ({
        ...p,
        [key]: err.userMessage ?? 'No se pudo actualizar el estado.',
      }))
    } finally {
      setUpdating((p) => ({ ...p, [key]: false }))
    }
  }

  const openRejectForm = (key) =>
    setRejectForms((p) => ({ ...p, [key]: { open: true, reason: p[key]?.reason ?? '' } }))

  const closeRejectForm = (key) =>
    setRejectForms((p) => ({ ...p, [key]: { open: false, reason: '' } }))

  const setRejectReason = (key, value) =>
    setRejectForms((p) => ({ ...p, [key]: { ...p[key], reason: value } }))

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Pagos — Comprobantes</h1>
        <p className={styles.sub}>Revisa y aprueba los comprobantes de pago de los equipos</p>
      </div>

      {loading && <p className={styles.loading}>Cargando comprobantes...</p>}
      {error   && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <>
          <div className={styles.filterTabs}>
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                className={activeTab === key ? styles.tabBtnActive : styles.tabBtn}
                onClick={() => setActiveTab(key)}
              >
                {label}
                {tabCount(key) > 0 && (
                  <span className={styles.tabBadge}>{tabCount(key)}</span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className={styles.emptyMsg}>No hay comprobantes en esta categoría.</p>
          ) : (
            <div className={styles.proofGrid}>
              {filtered.map((proof) => {
                const key = proof.id ?? proof.teamId
                const isUpdating = updating[key]
                const teamName = teamNames[proof.teamId] ?? `Equipo #${proof.teamId}`
                const rejectForm = rejectForms[key] ?? { open: false, reason: '' }

                return (
                  <div key={key} className={styles.proofCard}>
                    <div className={styles.proofTop}>
                      <div className={styles.proofTeam}>{teamName}</div>
                      <Badge status={proof.status} />
                    </div>

                    <div className={styles.proofMeta}>
                      <span>Enviado: {formatDate(proof.uploadedAt)}</span>
                      {proof.reviewedAt && (
                        <span>Revisado: {formatDate(proof.reviewedAt)}</span>
                      )}
                    </div>

                    {proof.fileUrl && (
                      <a
                        href={proof.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.proofLink}
                      >
                        Ver comprobante ↗
                      </a>
                    )}

                    {proof.comments && (
                      <p className={styles.proofComments}>
                        <strong>Comentario:</strong> {proof.comments}
                      </p>
                    )}

                    {/* Form de rechazo con motivo */}
                    {rejectForm.open ? (
                      <div className={styles.rejectForm}>
                        <label className={styles.rejectLabel}>Motivo del rechazo</label>
                        <textarea
                          className={styles.rejectTextarea}
                          rows={3}
                          placeholder="Ej: La imagen está borrosa, el monto no coincide..."
                          value={rejectForm.reason}
                          onChange={(e) => setRejectReason(key, e.target.value)}
                          disabled={isUpdating}
                        />
                        <div className={styles.rejectActions}>
                          <button
                            className={styles.btnReject}
                            disabled={isUpdating || !rejectForm.reason.trim()}
                            onClick={() => handleStatus(proof, 'REJECTED', rejectForm.reason.trim())}
                          >
                            {isUpdating ? 'Rechazando...' : 'Confirmar rechazo'}
                          </button>
                          <button
                            className={styles.btnReview}
                            disabled={isUpdating}
                            onClick={() => closeRejectForm(key)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.actionBtns}>
                        {proof.status !== 'UNDER_REVIEW' && proof.status !== 'APPROVED' && proof.status !== 'REJECTED' && (
                          <button
                            className={styles.btnReview}
                            disabled={isUpdating}
                            onClick={() => handleStatus(proof, 'UNDER_REVIEW')}
                          >
                            {isUpdating ? '...' : 'En revisión'}
                          </button>
                        )}
                        {proof.status === 'UNDER_REVIEW' && (
                          <button
                            className={styles.btnApprove}
                            disabled={isUpdating}
                            onClick={() => handleStatus(proof, 'APPROVED')}
                          >
                            {isUpdating ? 'Aprobando...' : 'Aprobar'}
                          </button>
                        )}
                        {(proof.status === 'PENDING' || proof.status === 'UNDER_REVIEW') && (
                          <button
                            className={styles.btnReject}
                            disabled={isUpdating}
                            onClick={() => openRejectForm(key)}
                          >
                            Rechazar
                          </button>
                        )}
                      </div>
                    )}

                    {updateErrors[key] && (
                      <p className={styles.cardError}>{updateErrors[key]}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </PageLayout>
  )
}
