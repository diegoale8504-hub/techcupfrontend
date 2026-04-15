import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGuard from './components/auth/RoleGuard'
import { RegistrationProvider } from './context/RegistrationContext'

// Auth / Landing
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/Login/LoginPage'
import OAuthCallbackPage from './pages/OAuthCallback/OAuthCallbackPage'

// Registration flow
import UserTypeSelectionPage from './pages/Registration/UserTypeSelection/UserTypeSelectionPage'
import RegistrationStep1Page from './pages/Registration/Step1/RegistrationStep1Page'
import RegistrationStep2Page from './pages/Registration/Step2/RegistrationStep2Page'
import RegistrationStep3Page from './pages/Registration/Step3/RegistrationStep3Page'
import RegistrationSuccessPage from './pages/Registration/Success/RegistrationSuccessPage'

// Protected pages — shared
import DashboardPage from './pages/Dashboard/DashboardPage'
import TournamentPage from './pages/Tournament/TournamentPage'
import CalendarPage from './pages/Calendar/CalendarPage'
import StandingsPage from './pages/Standings/StandingsPage'
import ProfilePage from './pages/Profile/ProfilePage'
import PlayerSearchPage from './pages/PlayerSearch/PlayerSearchPage'

// Protected pages — Captain
import TeamPage from './pages/Team/TeamPage'
import InvitationsPage from './pages/Invitations/InvitationsPage'
import PaymentPage from './pages/Payment/PaymentPage'
import CaptainPage from './pages/Captain/CaptainPage'

// Protected pages — Referee
import MatchesPage from './pages/Matches/MatchesPage'

// Protected pages — Organizer
import SettingsPage from './pages/Settings/SettingsPage'

// Placeholders — páginas pendientes de implementar
const NotificationsPage = () => <div>Página Notificaciones</div>

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
      {/* ── Rutas públicas ── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      <Route path="/register" element={<RegistrationLayout />}>
        <Route index element={<UserTypeSelectionPage />} />
        <Route path="step1" element={<RegistrationStep1Page />} />
        <Route path="step2" element={<RegistrationStep2Page />} />
        <Route path="step3" element={<RegistrationStep3Page />} />
        <Route path="success" element={<RegistrationSuccessPage />} />
      </Route>

      {/* ── Rutas protegidas (cualquier usuario autenticado) ── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard"     element={<DashboardPage />} />
        <Route path="/profile/:id"   element={<ProfilePage />} />
        <Route path="/profile"       element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/tournament"    element={<TournamentPage />} />
        <Route path="/calendar"      element={<CalendarPage />} />
        <Route path="/standings"     element={<StandingsPage />} />
        <Route path="/players"       element={<PlayerSearchPage />} />
        <Route path="/team"          element={<TeamPage />} />
        <Route path="/invitations"   element={<InvitationsPage />} />
        <Route path="/captain"       element={<CaptainPage />} />

        {/* Solo CAPTAIN */}
        <Route element={<ProtectedRoute allowedRoles={['CAPTAIN']} />}>
          <Route path="/payments" element={<PaymentPage />} />
          <Route path="/payment"  element={<PaymentPage />} />
        </Route>

        {/* Solo REFEREE */}
        <Route element={<ProtectedRoute allowedRoles={['REFEREE']} />}>
          <Route path="/matches" element={<MatchesPage />} />
        </Route>

        {/* Solo ADMINISTRATIVE / ADMINISTRATOR */}
        <Route element={<ProtectedRoute allowedRoles={['ADMINISTRATIVE', 'ADMINISTRATOR']} />}>
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* ── Catch-all ── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
