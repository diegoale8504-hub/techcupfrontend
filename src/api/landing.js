import axiosInstance from './axiosInstance'

export const getFields = () => axiosInstance.get('/api/fields')
export const getUpcomingMatches = () => axiosInstance.get('/api/matches?status=upcoming')
export const getStandingsPreview = () => axiosInstance.get('/api/standings?limit=5')
export const getTournamentStats = () => axiosInstance.get('/api/tournament/stats')
