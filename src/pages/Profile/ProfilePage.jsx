import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import Input from '../../components/ui/Input/Input'
import Button from '../../components/ui/Button/Button'
import Badge from '../../components/ui/Badge/Badge'
import { useAuth } from '../../hooks/useAuth'
import { getUserById, updateProfile, uploadProfileImage } from '../../api/users'
import { getTeam } from '../../api/teams'
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
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    fetchProfile()
  }, [user?.id])

  const fetchProfile = async () => {
    try {
      const res = await getUserById(user.id)
      const userData = res.data
      setProfile(userData)
      setForm({
        mainPosition: userData.mainPosition ?? '',
        jerseyNumber: userData.jerseyNumber?.toString() ?? '',
        available: userData.available ?? true,
      })

      if (userData.teamId) {
        try {
          const teamRes = await getTeam(userData.teamId)
          setTeam(teamRes.data)
        } catch (e) {
          console.error('Error fetching team name:', e)
        }
      }
    } catch (err) {
      setApiError('Error al cargar el perfil.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
    setErrors((p) => ({ ...p, [name]: null }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    setSaving(true)
    try {
      await uploadProfileImage(user.id, formData)
      setSaveSuccess(true)
      fetchProfile()
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setApiError('Error al subir la imagen de perfil.')
    } finally {
      setSaving(false)
    }
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
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setApiError(err.userMessage ?? 'Error al guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Mi perfil</h1>
        </div>

        {loading && <p className={styles.loading}>Cargando...</p>}
        {apiError && <p className={styles.error}>{apiError}</p>}

        {!loading && profile && (
          <>
            {/* Banner con Blur similar a Gestionar Equipo */}
            <div className={styles.profileBanner}>
              <div className={styles.avatarWrapper}>
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt={profile.name} className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {profile.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                )}
                <label className={styles.uploadOverlay} title="Cambiar foto de perfil">
                  📷
                  <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
              
              <div className={styles.info}>
                <h2>{profile.name}</h2>
                {team && <p className={styles.teamName}>⚽ {team.name}</p>}
                <p className={styles.email}>{profile.email}</p>
                <span className={styles.role}>{profile.userType}</span>
              </div>
            </div>

            <div className={styles.card}>
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
                  <p className={styles.success}>Cambios guardados con éxito.</p>
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
          </>
        )}
      </div>
    </PageLayout>
  )
}
