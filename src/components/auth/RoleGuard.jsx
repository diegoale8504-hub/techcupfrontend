import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function RoleGuard({ allowedRoles = [] }) {
  const { user } = useAuth()
  const userRoles = user?.roles ?? []
  const allowed = allowedRoles.some((r) => userRoles.includes(r))

  return allowed ? <Outlet /> : <Navigate to="/dashboard" replace />
}
