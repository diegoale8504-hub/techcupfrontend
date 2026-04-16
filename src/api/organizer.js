import axiosInstance from './axiosInstance'

// ── Tournaments ──────────────────────────────────────────────────────────────

export const createTournament = (data) =>
  axiosInstance.post('/api/tournaments', data)

export const startTournament = (id) =>
  axiosInstance.post(`/api/tournaments/${id}/start`)

export const finishTournament = (id) =>
  axiosInstance.post(`/api/tournaments/${id}/finish`)

export const assignReferee = (tournamentId, data) =>
  axiosInstance.post(`/api/tournaments/${tournamentId}/referees`, data)

export const removeRefereeFromTournament = (tournamentId, refereeId) =>
  axiosInstance.delete(`/api/tournaments/${tournamentId}/referees/${refereeId}`)

export const getTournamentReferees = (tournamentId) =>
  axiosInstance.get(`/api/tournaments/${tournamentId}/referees`)

// ── Payments ─────────────────────────────────────────────────────────────────

export const getAllPaymentProofs = () =>
  axiosInstance.get('/api/payments/proofs')

export const getPaymentProofsByStatus = (status) =>
  axiosInstance.get(`/api/payments/proofs/status/${status}`)

export const updatePaymentStatus = (teamId, status) =>
  axiosInstance.patch(`/api/payments/${teamId}/proof/status`, { status })

// ── Referees (invite) ─────────────────────────────────────────────────────────

export const inviteReferee = (data) =>
  axiosInstance.post('/api/admin/arbitros/invitar', data)

// ── Regulation PDF ─────────────────────────────────────────────────────────────

export const uploadRegulationPdf = (tournamentId, formData) =>
  axiosInstance.post(`/api/tournaments/${tournamentId}/regulation-pdf`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ── Tournament sub-resources (write operations) ───────────────────────────────

// Regulations
export const createRegulation = (tournamentId, data) =>
  axiosInstance.post(`/api/tournaments/${tournamentId}/regulations`, data)

export const updateRegulation = (tournamentId, id, data) =>
  axiosInstance.put(`/api/tournaments/${tournamentId}/regulations/${id}`, data)

export const deleteRegulation = (tournamentId, id) =>
  axiosInstance.delete(`/api/tournaments/${tournamentId}/regulations/${id}`)

// Key dates
export const createKeyDate = (tournamentId, data) =>
  axiosInstance.post(`/api/tournaments/${tournamentId}/key-dates`, data)

export const updateKeyDate = (tournamentId, id, data) =>
  axiosInstance.put(`/api/tournaments/${tournamentId}/key-dates/${id}`, data)

export const deleteKeyDate = (tournamentId, id) =>
  axiosInstance.delete(`/api/tournaments/${tournamentId}/key-dates/${id}`)

// Fields (canchas)
export const createField = (tournamentId, data) =>
  axiosInstance.post(`/api/tournaments/${tournamentId}/fields`, data)

export const updateField = (tournamentId, id, data) =>
  axiosInstance.put(`/api/tournaments/${tournamentId}/fields/${id}`, data)

export const deleteField = (tournamentId, id) =>
  axiosInstance.delete(`/api/tournaments/${tournamentId}/fields/${id}`)
