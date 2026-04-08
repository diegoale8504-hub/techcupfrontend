import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute() {
  const { token, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#16A34A', fontFamily: 'Inter, sans-serif' }}>
        Cargando...
      </div>
    )
  }

  return token ? <Outlet /> : <Navigate to="/login" replace />
}
