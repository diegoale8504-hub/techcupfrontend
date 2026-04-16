import { useState, useEffect, useMemo } from 'react'
import PageLayout from '../../../components/layout/PageLayout/PageLayout'
import Badge from '../../../components/ui/Badge/Badge'
import { getAllPaymentProofs, updatePaymentStatus } from '../../../api/organizer'
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
  const [proofs, setProofs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [activeTab, setActiveTab] = useState('ALL')
  const [updating, setUpdating]   = useState({}) // { [proofId]: true }
  const [updateErrors, setUpdateErrors] = useState({})

  useEffect(() => {
    getAllPaymentProofs()
      .then((res) => setProofs(res.data ?? []))
      .catch(() => setError('No se pudieron cargar los comprobantes de pago.'))
      .finally(() => setLoading(false))
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

  const handleStatus = async (proof, newStatus) => {
    const key = proof.id ?? proof.teamId
    setUpdating((p) => ({ ...p, [key]: true }))
    setUpdateErrors((p) => ({ ...p, [key]: null }))
    try {
      await updatePaymentStatus(proof.teamId, newStatus)
      setProofs((prev) =>
        prev.map((p) => (p.id === proof.id ? { ...p, status: newStatus } : p))
      )
    } catch (err) {
      setUpdateErrors((p) => ({
        ...p,
        [key]: err.userMessage ?? 'No se pudo actualizar el estado.',
      }))
    } finally {
      setUpdating((p) => ({ ...p, [key]: false }))
    }
  }

  const tabCount = (key) => {
    if (key === 'ALL') return proofs.length
    return countByStatus[key] ?? 0
  }

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
                return (
                  <div key={key} className={styles.proofCard}>
                    <div className={styles.proofTop}>
                      <div className={styles.proofTeam}>Equipo #{proof.teamId}</div>
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
                      <p className={styles.proofComments}>{proof.comments}</p>
                    )}

                    <div className={styles.actionBtns}>
                      {proof.status !== 'UNDER_REVIEW' && (
                        <button
                          className={styles.btnReview}
                          disabled={isUpdating}
                          onClick={() => handleStatus(proof, 'UNDER_REVIEW')}
                        >
                          En revisión
                        </button>
                      )}
                      {proof.status !== 'APPROVED' && (
                        <button
                          className={styles.btnApprove}
                          disabled={isUpdating}
                          onClick={() => handleStatus(proof, 'APPROVED')}
                        >
                          Aprobar
                        </button>
                      )}
                      {proof.status !== 'REJECTED' && (
                        <button
                          className={styles.btnReject}
                          disabled={isUpdating}
                          onClick={() => handleStatus(proof, 'REJECTED')}
                        >
                          Rechazar
                        </button>
                      )}
                    </div>

                    {updateErrors[key] && (
                      <p className={styles.cardError}>{updateErrors[key]}</p>
                    )}
                    {isUpdating && <p className={styles.cardUpdating}>Actualizando...</p>}
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
