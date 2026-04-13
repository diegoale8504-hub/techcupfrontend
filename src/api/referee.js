import axiosInstance from './axiosInstance'

export const getRefereeMatches = () =>
  axiosInstance.get('/api/referee/matches')

export const getRefereeMatch = (matchId) =>
  axiosInstance.get(`/api/referee/matches/${matchId}`)
