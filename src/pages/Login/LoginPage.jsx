import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { loginApi, forgotPasswordApi } from '../../api/auth'
import Input from '../../components/ui/Input/Input'
import Button from '../../components/ui/Button/Button'
import { validate, required, email, minLength } from '../../utils/validators'
import styles from './LoginPage.module.css'

const LOGIN_RULES = {
  email: [required(), email()],
  password: [required(), minLength(6)],
}

const FORGOT_RULES = {
  email: [required(), email()],
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, token } = useAuth()

  const [tab, setTab] = useState('institucional')
  const [view, setView] = useState('login')
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState(
    searchParams.get('registered') ? '¡Registro exitoso! Ya puedes iniciar sesión.' : null
  )

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  // Mostrar error si viene de un intento OAuth fallido
  useEffect(() => {
    if (searchParams.get('error') === 'oauth') {
      setApiError('No se pudo autenticar con Google. Intenta de nuevo.')
    }
  }, [searchParams])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: null }))
    setApiError(null)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const { isValid, errors: fieldErrors } = validate(form, LOGIN_RULES)
    if (!isValid) { setErrors(fieldErrors); return }

    setLoading(true)
    setApiError(null)
    try {
      const res = await loginApi({ email: form.email, password: form.password })
      // Backend returns { token, id, name, email, role }
      const { token: jwt, id, name, email: userEmail, role } = res.data
      login({ token: jwt, id, name, email: userEmail, role })
      navigate('/dashboard')
    } catch (err) {
      setApiError(err.userMessage ?? 'Credenciales inválidas. Verifique e intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    const { isValid, errors: fieldErrors } = validate({ email: form.email }, FORGOT_RULES)
    if (!isValid) { setErrors(fieldErrors); return }

    setLoading(true)
    setApiError(null)
    try {
      await forgotPasswordApi({ email: form.email })
      setView('forgotSent')
    } catch (err) {
      setApiError(err.userMessage ?? 'No se pudo enviar el correo. Intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${styles.root} page-enter`}>
      <div className={styles.card}>
        <Link to="/" className={styles.backToHome}>← Volver al inicio</Link>
        <div className={styles.header}>
          <img src="/images/logoFinalFinal.png" alt="TechCupFútbol" className={styles.logoImg} />
          <h1 className={styles.title}>TechCupFútbol</h1>
          <p className={styles.subtitle}>Ingresa tus credenciales para continuar</p>
        </div>

        {successMsg && <div className={styles.successBanner}>{successMsg}</div>}

        {view === 'login' && (
          <>
            <div className={styles.tabs}>
              <button
                className={tab === 'institucional' ? styles.tabActive : styles.tab}
                onClick={() => setTab('institucional')}
              >
                Institucional
              </button>
              <button
                className={tab === 'gmail' ? styles.tabActive : styles.tab}
                onClick={() => setTab('gmail')}
              >
                Gmail (Familiar)
              </button>
            </div>

            {tab === 'institucional' ? (
              <form onSubmit={handleLogin} noValidate>
                <div className={styles.fields}>
                  <Input
                    label="Correo electrónico"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                    placeholder="usuario@mail.escuelaing.edu.co"
                    required
                  />
                  <Input
                    label="Contraseña"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                    placeholder="••••••••"
                    required
                  />
                </div>

                {apiError && <p className={styles.apiError}>{apiError}</p>}

                <Button type="submit" variant="primary" fullWidth loading={loading}>
                  Ingresar al sistema
                </Button>

                <div className={styles.divider}><span>— o —</span></div>

                <a
                  href="https://localhost:8443/oauth2/authorization/google"
                  className={styles.btnGoogle}
                >
                  <img
                    src="https://developers.google.com/identity/images/g-logo.png"
                    alt="Google"
                  />
                  Ingresar con Google
                </a>
                <p className={styles.googleHint}>Árbitros y familiares deben ingresar con Google</p>

                <button type="button" className={styles.forgotLink} onClick={() => setView('forgot')}>
                  ¿Olvidaste tu contraseña?
                </button>
              </form>
            ) : (
              <div className={styles.gmailSection}>
                <p className={styles.gmailText}>
                  Acceso para familiares mediante cuenta Gmail registrada.
                </p>
                <a
                  href="https://localhost:8443/oauth2/authorization/google"
                  className={styles.btnGoogle}
                >
                  <img
                    src="https://developers.google.com/identity/images/g-logo.png"
                    alt="Google"
                  />
                  Continuar con Google
                </a>
              </div>
            )}

            <p className={styles.registerText}>
              ¿No tienes cuenta?{' '}
              <Link to="/register" className={styles.registerLink}>
                Regístrate aquí
              </Link>
            </p>
          </>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgot} noValidate>
            <p className={styles.forgotTitle}>Recuperar contraseña</p>
            <p className={styles.forgotDesc}>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <div className={styles.fields}>
              <Input
                label="Correo electrónico"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="usuario@mail.escuelaing.edu.co"
                required
              />
            </div>
            {apiError && <p className={styles.apiError}>{apiError}</p>}
            <Button type="submit" variant="primary" fullWidth loading={loading}>
              Enviar enlace
            </Button>
            <button type="button" className={styles.forgotLink} onClick={() => setView('login')}>
              ← Volver al inicio de sesión
            </button>
          </form>
        )}

        {view === 'forgotSent' && (
          <div className={styles.sentMsg}>
            <p>Revisa tu correo electrónico. Te enviamos un enlace para restablecer tu contraseña.</p>
            <Button variant="secondary" fullWidth onClick={() => setView('login')}>
              Volver al inicio de sesión
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
