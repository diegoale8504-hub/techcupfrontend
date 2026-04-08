import axiosInstance from './axiosInstance'

export const getTeam = (id) =>
  axiosInstance.get(`/api/teams/${id}`)

export const createTeam = (data) =>
  axiosInstance.post('/api/teams', data)

export const invitePlayer = (teamId, playerId) =>
  axiosInstance.post(`/api/teams/${teamId}/invitations`, { playerId })

export const getMyInvitations = () =>
  axiosInstance.get('/api/teams/invitations/my-invitations')

export const respondInvitation = (invitationId, accepted) =>
  axiosInstance.patch(`/api/teams/invitations/${invitationId}/respond`, { accepted })

// Tournament standings
export const getGroupStandings = (tournamentId, groupId) =>
  axiosInstance.get(`/api/tournaments/${tournamentId}/groups/${groupId}/standings`)

// Tournament match history
export const getMatchHistory = (tournamentId, teamId) =>
  axiosInstance.get(`/api/tournaments/${tournamentId}/statistics/match-history`, {
    params: teamId ? { teamId } : {},
  })
