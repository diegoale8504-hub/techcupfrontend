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

export const updateTeam = (teamId, data) =>
  axiosInstance.put(`/api/teams/${teamId}`, data)

export const removePlayer = (teamId, playerId) =>
  axiosInstance.delete(`/api/teams/${teamId}/members/${playerId}`)

export const getAllTeams = () =>
  axiosInstance.get('/api/teams')

export const getTeamInvitations = (teamId) =>
  axiosInstance.get(`/api/teams/${teamId}/invitations`)

export const leaveTeam = (teamId) =>
  axiosInstance.post(`/api/teams/${teamId}/leave-requests`)
