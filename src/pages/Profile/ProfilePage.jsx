import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Input from '../../components/ui/Input/Input'
import Button from '../../components/ui/Button/Button'
import Badge from '../../components/ui/Badge/Badge'
import { useAuth } from '../../hooks/useAuth'
import { getUserById, updateProfile } from '../../api/users'
import { validate, required } from '../../utils/validators'
import styles from './ProfilePage.module.css'

const POSITION_OPTIONS = [
  { value: '', label: 'Selecciona tu posición' },
  { value: 'GOALKEEPER', label: 'Portero' },
  { value: 'DEFENDER', label: 'Defensa' },
  { value: 'MIDFIELDER', label: 'Centrocampista' },
  { value: 'FORWARD', label: 'Delantero' },
]

const POSITION_LABELS = {
  GOALKEEPER: 'Portero', DEFENDER: 'Defensa',
  MIDFIELDER: 'Centrocampista', FORWARD: 'Delantero',
}

const RULES = {
  mainPosition: [required('*Selecciona una posición')],
  jerseyNumber: [required()],
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    getUserById(user.id)
      .then((res) => {
        setProfile(res.data)
        setForm({
          mainPosition: res.data.mainPosition ?? '',
          jerseyNumber: res.data.jerseyNumber?.toString() ?? '',
          available: res.data.available ?? true,
        })
      })
      .catch(() => setApiError('Error al cargar el perfil.'))
      .finally(() => setLoading(false))
  }, [user?.id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
    setErrors((p) => ({ ...p, [name]: null }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const { isValid, errors: fieldErrors } = validate(form, RULES)
    if (!isValid) { setErrors(fieldErrors); return }

    setSaving(true)
    setApiError(null)
    setSaveSuccess(false)
    try {
      const res = await updateProfile(user.id, {
        mainPosition: form.mainPosition,
        jerseyNumber: parseInt(form.jerseyNumber, 10),
        available: form.available,
      })
      setProfile(res.data)
      setSaveSuccess(true)
      setEditing(false)
    } catch (err) {
      setApiError(err.userMessage ?? 'Error al guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Mi perfil</h1>
      </div>

      {loading && <p className={styles.loading}>Cargando...</p>}
      {apiError && <p className={styles.error}>{apiError}</p>}

      {!loading && profile && (
        <div className={styles.card}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {profile.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 className={styles.name}>{profile.name}</h2>
              <p className={styles.email}>{profile.email}</p>
              <p className={styles.role}>{profile.userType}</p>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Perfil deportivo</h3>
              {!editing && (
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  Editar
                </Button>
              )}
            </div>

            {saveSuccess && (
              <p className={styles.success}>Perfil actualizado correctamente.</p>
            )}

            {!editing ? (
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Posición principal</span>
                  <span>{POSITION_LABELS[profile.mainPosition] ?? '—'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Número de camiseta</span>
                  <span>#{profile.jerseyNumber ?? '—'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Disponibilidad</span>
                  <Badge status={profile.available ? 'available' : 'in-team'} />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} noValidate>
                <div className={styles.fields}>
                  <Input
                    label="Posición principal"
                    name="mainPosition"
                    type="select"
                    value={form.mainPosition}
                    onChange={handleChange}
                    error={errors.mainPosition}
                    options={POSITION_OPTIONS}
                    required
                  />
                  <Input
                    label="Número de camiseta"
                    name="jerseyNumber"
                    type="number"
                    value={form.jerseyNumber}
                    onChange={handleChange}
                    error={errors.jerseyNumber}
                    placeholder="Ej: 10"
                    required
                  />
                  <label className={styles.availableRow}>
                    <input
                      type="checkbox"
                      name="available"
                      checked={form.available}
                      onChange={handleChange}
                    />
                    <span>Disponible para recibir invitaciones</span>
                  </label>
                </div>

                {apiError && <p className={styles.error}>{apiError}</p>}

                <div className={styles.actions}>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => { setEditing(false); setErrors({}) }}
                  >
                    Cancelar
                  </Button>
                  <Button variant="primary" type="submit" loading={saving}>
                    Guardar cambios
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Datos personales</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Documento</span>
                <span>{profile.documentType} — {profile.idNumber}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Género</span>
                <span>{profile.gender ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
