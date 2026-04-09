import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import RoleGuard from './components/auth/RoleGuard'
import { RegistrationProvider } from './context/RegistrationContext'

import LoginPage from './pages/Login/LoginPage'
import OAuthCallbackPage from './pages/OAuthCallback/OAuthCallbackPage'
import UserTypeSelectionPage from './pages/Registration/UserTypeSelection/UserTypeSelectionPage'
import RegistrationStep1Page from './pages/Registration/Step1/RegistrationStep1Page'
import RegistrationStep2Page from './pages/Registration/Step2/RegistrationStep2Page'
import RegistrationStep3Page from './pages/Registration/Step3/RegistrationStep3Page'
import RegistrationSuccessPage from './pages/Registration/Success/RegistrationSuccessPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import StandingsPage from './pages/Standings/StandingsPage'
import PlayerSearchPage from './pages/PlayerSearch/PlayerSearchPage'
import PaymentPage from './pages/Payment/PaymentPage'
import ProfilePage from './pages/Profile/ProfilePage'

function RegistrationLayout() {
  return (
    <RegistrationProvider>
      <Outlet />
    </RegistrationProvider>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      <Route path="/register" element={<RegistrationLayout />}>
        <Route index element={<UserTypeSelectionPage />} />
        <Route path="step1" element={<RegistrationStep1Page />} />
        <Route path="step2" element={<RegistrationStep2Page />} />
        <Route path="step3" element={<RegistrationStep3Page />} />
        <Route path="success" element={<RegistrationSuccessPage />} />
      </Route>

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/standings" element={<StandingsPage />} />
        <Route path="/players" element={<PlayerSearchPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Solo CAPTAIN */}
        <Route element={<RoleGuard allowedRoles={['CAPTAIN']} />}>
          <Route path="/payment" element={<PaymentPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
