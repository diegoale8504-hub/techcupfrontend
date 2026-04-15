import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * allowedRoles (opcional): array de roles permitidos, p.ej. ['CAPTAIN', 'ADMIN'].
 * Si se omite, sólo verifica que el usuario esté autenticado.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: '#16A34A',
        fontFamily: 'Inter, sans-serif',
        fontSize: '1rem',
      }}>
        <span>Cargando...</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
