import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { changePasswordApi } from '../../../api/auth'
import Input from '../../../components/ui/Input/Input'
import Button from '../../../components/ui/Button/Button'
import { validate, required, minLength, passwordsMatch } from '../../../utils/validators'
import styles from './ChangePasswordPage.module.css'

const RULES = {
  currentPassword: [required()],
  password:        [required(), minLength(8)],
  confirmPassword: [required(), passwordsMatch('*Las contraseñas no coinciden')],
}

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const [form, setForm]       = useState({ currentPassword: '', password: '', confirmPassword: '' })
  const [errors, setErrors]   = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: null }))
    setApiError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { isValid, errors: fieldErrors } = validate(form, RULES)
    if (!isValid) { setErrors(fieldErrors); return }

    setLoading(true)
    setApiError(null)
    try {
      await changePasswordApi(user.id, {
        currentPassword: form.currentPassword,
        newPassword: form.password,
      })
      updateUser({ mustChangePassword: false })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setApiError(err.userMessage ?? 'No se pudo cambiar la contraseña. Verifica que la contraseña actual sea correcta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="/images/logoFinalFinal.png" alt="TechCupFútbol" className={styles.logoImg} />
          <h1 className={styles.title}>Cambio de contraseña</h1>
          <p className={styles.subtitle}>
            Es tu primer inicio de sesión. Por seguridad, debes establecer una nueva contraseña antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.fields}>
            <Input
              label="Contraseña actual"
              name="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={handleChange}
              error={errors.currentPassword}
              placeholder="••••••••"
              required
            />
            <Input
              label="Nueva contraseña"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Mínimo 8 caracteres"
              required
            />
            <Input
              label="Confirmar nueva contraseña"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Repite la nueva contraseña"
              required
            />
          </div>

          {apiError && <p className={styles.apiError}>{apiError}</p>}

          <Button type="submit" variant="primary" fullWidth loading={loading}>
            Cambiar contraseña
          </Button>
        </form>
      </div>
    </div>
  )
}
