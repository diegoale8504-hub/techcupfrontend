import axiosInstance from './axiosInstance'

export const getTeam = (id) =>
  axiosInstance.get(`/api/teams/${id}`)

export const getMyTeam = () =>
  axiosInstance.get('/api/teams/my-team')

export const createTeam = (data) =>
  axiosInstance.post('/api/teams', data)

export const getAllTeams = () =>
  axiosInstance.get('/api/teams')

export const updateTeam = (teamId, data) =>
  axiosInstance.put(`/api/teams/${teamId}`, data)

export const dissolveTeam = (teamId) =>
  axiosInstance.delete(`/api/teams/${teamId}`)

export const validateTeam = (teamId) =>
  axiosInstance.post(`/api/teams/${teamId}/validate`)

// Logo
export const uploadTeamLogo = (teamId, formData) =>
  axiosInstance.patch(`/api/teams/${teamId}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// Members
export const removePlayer = (teamId, playerId) =>
  axiosInstance.delete(`/api/teams/${teamId}/members/${playerId}`)

// Invitations — body: { playerId }  /  respond body: { accept: boolean }
export const invitePlayer = (teamId, playerId) =>
  axiosInstance.post(`/api/teams/${teamId}/invitations`, { playerId })

export const getTeamInvitations = (teamId) =>
  axiosInstance.get(`/api/teams/${teamId}/invitations`)

export const getMyInvitations = () =>
  axiosInstance.get('/api/teams/invitations/my-invitations')

export const respondInvitation = (invitationId, accept) =>
  axiosInstance.patch(`/api/teams/invitations/${invitationId}/respond`, { accept })

// Leave requests — respond body: { approve: boolean }
export const leaveTeam = (teamId, reason = '') =>
  axiosInstance.post(`/api/teams/${teamId}/leave-requests`, { reason })

export const getTeamLeaveRequests = (teamId) =>
  axiosInstance.get(`/api/teams/${teamId}/leave-requests`)

export const respondLeaveRequest = (requestId, approve) =>
  axiosInstance.patch(`/api/teams/leave-requests/${requestId}/respond`, { approve })
