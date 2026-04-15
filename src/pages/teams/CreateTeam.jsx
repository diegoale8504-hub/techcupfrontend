import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import api from '../../api/axiosInstance'
import styles from './CreateTeam.module.css'

export default function CreateTeam() {
  const navigate              = useNavigate()
  const { user, login }        = useAuth()

  const [name,           setName]           = useState('')
  const [primaryColor,   setPrimaryColor]   = useState('#16A34A')
  const [secondaryColor, setSecondaryColor] = useState('#ffffff')
  const [logoFile,       setLogoFile]       = useState(null)
  const [preview,        setPreview]        = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)
  const [success,        setSuccess]        = useState(false)

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (name.trim().length < 3) {
      setError('El nombre del equipo debe tener al menos 3 caracteres.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // ── PASO 1: Crear el equipo ────────────────────────────────────
      const response = await api.post('/api/teams', {
        name: name.trim(),
        primaryColor,
        secondaryColor,
      })
      const newTeam = response.data

      // ── PASO 2: Subir logo si se seleccionó uno ────────────────────
      if (logoFile && newTeam.id) {
        try {
          const formData = new FormData()
          formData.append('logo', logoFile)
          await api.post(`/api/teams/${newTeam.id}/logo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        } catch (logoErr) {
          console.error('Error subiendo logo:', logoErr)
          // No detenemos el flujo si el logo falla, pero podríamos avisar
        }
      }

      setSuccess(true)

      // ── PASO 3 & 4: Actualizar AuthContext ─────────────────────────
      // Intentamos obtener el nuevo token (el backend debería devolverlo con role=CAPTAIN)
      const newToken = newTeam.token || localStorage.getItem('techcup_token')

      if (newToken) {
        const payload = JSON.parse(atob(newToken.split('.')[1]))
        login({
          token:  newToken,
          id:     payload.sub    ?? payload.id ?? user.id,
          name:   payload.name   ?? user.name,
          email:  payload.email  ?? user.email,
          role:   payload.role   ?? 'CAPTAIN',
          teamId: payload.teamId ?? newTeam.id,
        })
      }

      // ── PASO 5: Ir al panel del equipo tras un breve delay ─────────
      setTimeout(() => {
        navigate(`/teams/${newTeam.id}/manage`)
      }, 1500)

    } catch (err) {
      if (err.response?.status === 409) {
        setError('Ya existe un equipo con ese nombre. Elige otro.')
      } else {
        setError(err.userMessage ?? 'Error al crear el equipo. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          {/* Cabecera */}
          <div className={styles.header}>
            <div className={styles.iconBadge}>⚽</div>
            <h1 className={styles.title}>Crear Equipo</h1>
            <p className={styles.subtitle}>
              Como capitán podrás gestionar jugadores, alineaciones y pagos.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Mensajes de feedback */}
            {success && (
              <div className={styles.successMsg}>
                ¡Equipo creado con éxito! Redirigiendo...
              </div>
            )}
            {error && <p className={styles.error}>{error}</p>}

            {/* Nombre */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="teamName">
                Nombre del equipo <span className={styles.required}>*</span>
              </label>
              <input
                id="teamName"
                className={styles.input}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null) }}
                placeholder="Ej: Los Guerreros FC"
                disabled={loading}
                required
              />
            </div>

            {/* Colores */}
            <div className={styles.colorsRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="primaryColor">
                  Color principal
                </label>
                <div className={styles.colorField}>
                  <input
                    id="primaryColor"
                    type="color"
                    className={styles.colorInput}
                    value={primaryColor}
                    onChange={(e) => { setPrimaryColor(e.target.value); setError(null) }}
                    disabled={loading}
                  />
                  <span className={styles.colorHex}>{primaryColor}</span>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="secondaryColor">
                  Color secundario
                </label>
                <div className={styles.colorField}>
                  <input
                    id="secondaryColor"
                    type="color"
                    className={styles.colorInput}
                    value={secondaryColor}
                    onChange={(e) => { setSecondaryColor(e.target.value); setError(null) }}
                    disabled={loading}
                  />
                  <span className={styles.colorHex}>{secondaryColor}</span>
                </div>
              </div>
            </div>

            {/* Vista previa de colores */}
            <div
              className={styles.colorPreview}
              style={{ background: `linear-gradient(135deg, ${primaryColor} 50%, ${secondaryColor} 50%)` }}
            >
              <span className={styles.colorPreviewLabel}>Vista previa del uniforme</span>
            </div>

            {/* Logo */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="teamLogo">
                Logo del equipo <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                id="teamLogo"
                className={styles.fileInput}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={loading}
              />
              {preview && (
                <img
                  src={preview}
                  alt="Vista previa del logo"
                  className={styles.logoPreview}
                />
              )}
            </div>

            {/* Error */}
            {error && <p className={styles.error}>{error}</p>}

            {/* Acciones */}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={loading}
              >
                {loading ? 'Creando equipo…' : 'Crear Equipo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  )
}
