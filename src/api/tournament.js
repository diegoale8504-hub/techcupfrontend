import axiosInstance from './axiosInstance'

// Legacy constant kept for backward compatibility with non-organizer views.
// OrgTournamentsPage uses getAllTournaments() to get the real UUID dynamically.
export const TOURNAMENT_ID = 1

export const getAllTournaments = () =>
  axiosInstance.get('/api/tournaments')

export const getTournament = (id = TOURNAMENT_ID) =>
  axiosInstance.get(`/api/tournaments/${id}`)

export const getTopScorers = (tournamentId = TOURNAMENT_ID) =>
  axiosInstance.get(`/api/tournaments/${tournamentId}/statistics/top-scorers`)

export const getMatchSchedules = (tournamentId = TOURNAMENT_ID) =>
  axiosInstance.get(`/api/tournaments/${tournamentId}/match-schedules`)

export const getMatchResult = (matchId) =>
  axiosInstance.get(`/api/match-schedules/${matchId}/registration/result`)

export const getTournamentGroups = (tournamentId = TOURNAMENT_ID) =>
  axiosInstance.get(`/api/tournaments/${tournamentId}/groups`)

export const getGroupStandings = (groupId, tournamentId = TOURNAMENT_ID) =>
  axiosInstance.get(`/api/tournaments/${tournamentId}/groups/${groupId}/standings`)

export const getMatchHistory = (tournamentId = TOURNAMENT_ID, teamId) =>
  axiosInstance.get(`/api/tournaments/${tournamentId}/statistics/match-history`, {
    params: teamId ? { teamId } : {},
  })

export const getKeyDates = (tournamentId = TOURNAMENT_ID) =>
  axiosInstance.get(`/api/tournaments/${tournamentId}/key-dates`)

export const getRegulations = (tournamentId = TOURNAMENT_ID) =>
  axiosInstance.get(`/api/tournaments/${tournamentId}/regulations`)

export const getTournamentFields = (tournamentId = TOURNAMENT_ID) =>
  axiosInstance.get(`/api/tournaments/${tournamentId}/fields`)
