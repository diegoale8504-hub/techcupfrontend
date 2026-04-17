import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Badge from '../../components/ui/Badge/Badge'
import Button from '../../components/ui/Button/Button'
import { useAuth } from '../../hooks/useAuth'
import { getPaymentProof, uploadPaymentProof } from '../../api/payments'
import { getMyTeam } from '../../api/teams'
import styles from './PaymentPage.module.css'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE_MB = 10

export default function PaymentPage() {
  const { user } = useAuth()
  const teamId = user?.teamId

  const [proof, setProof]           = useState(null)
  const [team, setTeam]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [file, setFile]             = useState(null)
  const [preview, setPreview]       = useState(null)
  const [uploading, setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [fileError, setFileError]   = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!teamId) { setLoading(false); return }
    Promise.all([
      getPaymentProof(teamId).catch(() => null),
      getMyTeam().catch(() => null),
    ]).then(([proofRes, teamRes]) => {
      setProof(proofRes?.data ?? null)
      setTeam(teamRes?.data ?? null)
    }).finally(() => setLoading(false))
  }, [teamId])

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setFileError('Solo se permiten imágenes (JPEG, PNG, WEBP) o PDF.')
      return
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`El archivo no puede superar ${MAX_SIZE_MB} MB.`)
      return
    }

    setFileError(null)
    setUploadError(null)
    setUploadSuccess(false)
    setFile(selected)

    if (preview) URL.revokeObjectURL(preview)
    setPreview(selected.type.startsWith('image/') ? URL.createObjectURL(selected) : null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setFileError('Selecciona un archivo.'); return }
    if (!teamId) return

    setUploading(true)
    setUploadError(null)
    try {
      const res = await uploadPaymentProof(teamId, file)
      setProof(res.data)
      setUploadSuccess(true)
      setFile(null)
      setPreview(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setUploadError(err.userMessage ?? 'Error al enviar el comprobante. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFileError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (!teamId) {
    return (
      <PageLayout>
        <div>
          <h1 className={styles.heading}>Pago de inscripción</h1>
          <div className={styles.card}>
            <p className={styles.noTeamMsg}>
              Debes ser capitán de un equipo registrado para gestionar el pago.
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (team && team.status === 'FORMING') {
    return (
      <PageLayout>
        <div>
          <h1 className={styles.heading}>Pago de inscripción</h1>
          <div className={styles.card}>
            <p className={styles.noTeamMsg}>
              Tu equipo aún no está completo. Necesitas al menos <strong>7 jugadores</strong> para poder enviar el comprobante de pago.
            </p>
            <p className={styles.noTeamMsg}>
              Jugadores actuales: <strong>{team.memberCount} / 7</strong>
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  const canUpload = !proof || proof.status === 'REJECTED'

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Pago de inscripción</h1>
        <p className={styles.sub}>Sube una foto o PDF de tu comprobante de pago (NEQUI / efectivo).</p>
      </div>

      <div className={styles.card}>
        {loading && <p className={styles.loading}>Cargando estado...</p>}

        {!loading && (
          <>
            {proof && (
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>Estado:</span>
                <Badge status={proof.status} />
              </div>
            )}

            {proof?.status === 'APPROVED' && (
              <div className={styles.approvedMsg}>
                Tu inscripción está <strong>aprobada</strong>. El equipo está registrado en el torneo.
              </div>
            )}

            {(proof?.status === 'PENDING' || proof?.status === 'UNDER_REVIEW') && (
              <div className={styles.pendingMsg}>
                Tu comprobante está siendo revisado por el organizador. Te notificaremos pronto.
                {proof.fileUrl && (
                  <a href={proof.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.proofLink}>
                    Ver comprobante enviado ↗
                  </a>
                )}
              </div>
            )}

            {proof?.status === 'REJECTED' && proof.comments && (
              <div className={styles.rejectedMsg}>
                <strong>Motivo del rechazo:</strong> {proof.comments}
              </div>
            )}

            {canUpload && (
              <form onSubmit={handleSubmit} className={styles.uploadSection}>
                <p className={styles.uploadTitle}>
                  {proof?.status === 'REJECTED'
                    ? 'Comprobante rechazado — sube uno nuevo'
                    : 'Subir comprobante de pago'}
                </p>

                {/* Drop / click area */}
                <label className={styles.dropArea} htmlFor="proof-file-input">
                  {preview ? (
                    <img src={preview} alt="Vista previa" className={styles.previewImg} />
                  ) : file ? (
                    <>
                      <span className={styles.dropIcon}>📄</span>
                      <span className={styles.dropText}>{file.name}</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.dropIcon}>📷</span>
                      <span className={styles.dropText}>Toca para seleccionar foto o PDF</span>
                      <span className={styles.dropHint}>JPEG, PNG, WEBP o PDF — máx. {MAX_SIZE_MB} MB</span>
                    </>
                  )}
                </label>
                <input
                  ref={inputRef}
                  id="proof-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />

                {file && (
                  <button type="button" onClick={clearFile} className={styles.clearBtn}>
                    ✕ Cambiar archivo
                  </button>
                )}

                {fileError   && <p className={styles.error}>{fileError}</p>}
                {uploadError && <p className={styles.error}>{uploadError}</p>}
                {uploadSuccess && <p className={styles.success}>Comprobante enviado correctamente.</p>}

                <Button type="submit" variant="primary" fullWidth loading={uploading} disabled={!file}>
                  Enviar comprobante
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </PageLayout>
  )
}
