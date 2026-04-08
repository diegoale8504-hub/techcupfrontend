import axiosInstance from './axiosInstance'

export const getUserById = (id) =>
  axiosInstance.get(`/api/users/${id}`)

export const searchUsers = (params) =>
  axiosInstance.get('/api/users/search', { params })

export const updateProfile = (id, data) =>
  axiosInstance.put(`/api/users/${id}`, data)
