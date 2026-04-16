import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
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
import InvitationsPage from './pages/Invitations/InvitationsPage'

// Protected pages — Captain
import TeamPage from './pages/Team/TeamPage'
import PaymentPage from './pages/Payment/PaymentPage'
import CaptainPage from './pages/Captain/CaptainPage'

// Protected pages — Referee
import MatchesPage from './pages/Matches/MatchesPage'
import RefereeWaitingPage from './pages/Referee/RefereeWaitingPage'

// Protected pages — Organizer
import SettingsPage        from './pages/Settings/SettingsPage'
import ChangePasswordPage  from './pages/Organizer/ChangePassword/ChangePasswordPage'
import OrgUsersPage        from './pages/Organizer/Users/OrgUsersPage'
import OrgTeamsPage        from './pages/Organizer/Teams/OrgTeamsPage'
import OrgTournamentsPage  from './pages/Organizer/Tournaments/OrgTournamentsPage'
import OrgPaymentsPage     from './pages/Organizer/Payments/OrgPaymentsPage'
import OrgRefereesPage     from './pages/Organizer/Referees/OrgRefereesPage'

// Protected pages — Teams
import CreateTeam from './pages/teams/CreateTeam'
import ManageTeam from './pages/teams/ManageTeam'

// Placeholders — páginas pendientes de implementar
const NotificationsPage    = () => <div style={{ padding: 32 }}><h2>Notificaciones</h2></div>
const TournamentActivePage = () => <div style={{ padding: 32 }}><h2>Torneo Activo</h2></div>
const StatisticsPage       = () => <div style={{ padding: 32 }}><h2>Estadísticas</h2></div>
const LineupsPage          = () => <div style={{ padding: 32 }}><h2>Alineaciones</h2></div>
const TeamPaymentPage      = () => <div style={{ padding: 32 }}><h2>Comprobante de Pago</h2></div>
const TeamViewPage         = () => <div style={{ padding: 32 }}><h2>Mi Equipo</h2></div>

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
      <Route path="/"               element={<LandingPage />} />
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
      <Route path="/auth/callback"  element={<OAuthCallbackPage />} />

      <Route path="/register" element={<RegistrationLayout />}>
        <Route index element={<UserTypeSelectionPage />} />
        <Route path="step1"   element={<RegistrationStep1Page />} />
        <Route path="step2"   element={<RegistrationStep2Page />} />
        <Route path="step3"   element={<RegistrationStep3Page />} />
        <Route path="success" element={<RegistrationSuccessPage />} />
      </Route>

      {/* ── Cambio de contraseña obligatorio (sin Layout) ── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>

      {/* ── Rutas protegidas: autenticación + Layout ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>

          {/* Accesibles a cualquier rol autenticado */}
          <Route path="/dashboard"     element={<DashboardPage />} />
          <Route path="/profile/:id"   element={<ProfilePage />} />
          <Route path="/profile"       element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/tournament"    element={<TournamentPage />} />
          <Route path="/calendar"      element={<CalendarPage />} />
          <Route path="/standings"     element={<StandingsPage />} />
          <Route path="/players"       element={<PlayerSearchPage />} />
          <Route path="/invitations"   element={<InvitationsPage />} />
          <Route path="/captain"       element={<CaptainPage />} />

          <Route path="/tournaments/active"            element={<TournamentActivePage />} />
          <Route path="/tournaments/active/statistics" element={<StatisticsPage />} />

          {/* PLAYER y CAPTAIN — crear equipo y ver equipo */}
          <Route element={<ProtectedRoute allowedRoles={['PLAYER', 'CAPTAIN']} />}>
            <Route path="/teams/create"  element={<CreateTeam />} />
            <Route path="/teams/:id"     element={<TeamViewPage />} />
          </Route>

          {/* Solo CAPTAIN */}
          <Route element={<ProtectedRoute allowedRoles={['CAPTAIN']} />}>
            <Route path="/teams/:id/manage"  element={<ManageTeam />} />
            <Route path="/teams/:id/payment" element={<TeamPaymentPage />} />
            <Route path="/teams/:id/lineups" element={<LineupsPage />} />
            <Route path="/team"              element={<TeamPage />} />
            <Route path="/payments"          element={<PaymentPage />} />
            <Route path="/payment"           element={<PaymentPage />} />
          </Route>

          {/* Solo REFEREE */}
          <Route element={<ProtectedRoute allowedRoles={['REFEREE']} />}>
            <Route path="/referee/waiting" element={<RefereeWaitingPage />} />
            <Route path="/matches"         element={<MatchesPage />} />
          </Route>

          {/* Solo ORGANIZER */}
          <Route element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMINISTRATIVE', 'ADMINISTRATOR']} />}>
            <Route path="/organizer/users"       element={<OrgUsersPage />} />
            <Route path="/organizer/teams"       element={<OrgTeamsPage />} />
            <Route path="/organizer/tournaments" element={<OrgTournamentsPage />} />
            <Route path="/organizer/payments"    element={<OrgPaymentsPage />} />
            <Route path="/organizer/referees"    element={<OrgRefereesPage />} />
          </Route>

          {/* Solo ADMINISTRATIVE / ADMINISTRATOR / ORGANIZER */}
          <Route element={<ProtectedRoute allowedRoles={['ADMINISTRATIVE', 'ADMINISTRATOR', 'ORGANIZER']} />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

        </Route>
      </Route>

      {/* ── Catch-all ── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
