import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        login({
          token,
          id:    payload.sub   ?? null,
          name:  payload.name  ?? null,
          email: payload.email ?? payload.sub ?? null,
          role:  payload.role  ?? null,
        })

        if (payload.role === 'REFEREE') {
          navigate('/referee/waiting', { replace: true })
        } else if (payload.role === 'FAMILIAR' || payload.role === 'FAMILY_MEMBER') {
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      } catch {
        navigate('/login?error=oauth', { replace: true })
      }
    } else {
      navigate('/login?error=oauth', { replace: true })
    }
  }, [searchParams, login, navigate])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '16px',
      fontFamily: 'Inter, sans-serif',
      color: '#16A34A',
    }}>
      <p>Autenticando con Google...</p>
    </div>
  )
}
