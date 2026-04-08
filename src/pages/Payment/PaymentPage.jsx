import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Badge from '../../components/ui/Badge/Badge'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import { useAuth } from '../../hooks/useAuth'
import { getPaymentProof, uploadPaymentProof } from '../../api/payments'
import styles from './PaymentPage.module.css'

export default function PaymentPage() {
  const { user } = useAuth()
  const teamId = user?.teamId

  const [proof, setProof] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fileUrl, setFileUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [urlError, setUrlError] = useState(null)

  useEffect(() => {
    if (!teamId) { setLoading(false); return }
    getPaymentProof(teamId)
      .then((res) => setProof(res.data))
      .catch(() => setProof(null))
      .finally(() => setLoading(false))
  }, [teamId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fileUrl.trim()) { setUrlError('*Ingresa la URL del comprobante'); return }
    if (!fileUrl.startsWith('http')) { setUrlError('*La URL debe comenzar con http:// o https://'); return }
    if (!teamId) return

    setUploading(true)
    setUploadError(null)
    setUrlError(null)
    try {
      const res = await uploadPaymentProof(teamId, fileUrl.trim())
      setProof(res.data)
      setUploadSuccess(true)
      setFileUrl('')
    } catch (err) {
      setUploadError(err.userMessage ?? 'Error al enviar el comprobante. Intente de nuevo.')
    } finally {
      setUploading(false)
    }
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

  const canUpload = !proof || proof.status === 'REJECTED'

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Pago de inscripción</h1>
        <p className={styles.sub}>Sube el enlace al comprobante de pago para inscribir a tu equipo.</p>
      </div>

      <div className={styles.card}>
        {loading && <p className={styles.loading}>Cargando estado...</p>}

        {!loading && (
          <>
            {proof && (
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>Estado del comprobante:</span>
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
              </div>
            )}

            {canUpload && (
              <form onSubmit={handleSubmit} className={styles.uploadSection}>
                <p className={styles.uploadTitle}>
                  {proof?.status === 'REJECTED'
                    ? 'Comprobante rechazado — sube uno nuevo'
                    : 'Enlace al comprobante de pago'}
                </p>
                <p className={styles.uploadHint}>
                  Sube tu imagen a Google Drive, Dropbox o similar, copia el enlace público y pégalo aquí.
                </p>

                <Input
                  label="URL del comprobante"
                  name="fileUrl"
                  type="url"
                  value={fileUrl}
                  onChange={(e) => { setFileUrl(e.target.value); setUrlError(null) }}
                  error={urlError}
                  placeholder="https://drive.google.com/file/..."
                  required
                />

                {uploadError && <p className={styles.error}>{uploadError}</p>}
                {uploadSuccess && <p className={styles.success}>Comprobante enviado correctamente.</p>}

                <Button type="submit" variant="primary" fullWidth loading={uploading}>
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
