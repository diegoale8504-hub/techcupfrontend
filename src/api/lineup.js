import axiosInstance from './axiosInstance'

export const getMatchLineups = (matchScheduleId) =>
  axiosInstance.get(`/api/match-schedules/${matchScheduleId}/lineups`)

export const createLineup = (matchScheduleId, data) =>
  axiosInstance.post(`/api/match-schedules/${matchScheduleId}/lineups`, data)

export const updateLineup = (matchScheduleId, lineupId, data) =>
  axiosInstance.put(`/api/match-schedules/${matchScheduleId}/lineups/${lineupId}`, data)
