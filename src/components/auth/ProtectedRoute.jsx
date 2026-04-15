import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#16A34A', fontFamily: 'Inter, sans-serif' }}>
        Cargando...
      </div>
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}
