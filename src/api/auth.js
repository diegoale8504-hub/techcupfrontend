import axiosInstance from './axiosInstance'

export const loginApi = ({ email, password }) =>
  axiosInstance.post('/api/auth/login', { email, password })

export const forgotPasswordApi = ({ email }) =>
  axiosInstance.post('/api/auth/forgot-password', { email })

export const resetPasswordApi = ({ token, newPassword }) =>
  axiosInstance.post('/api/auth/reset-password', { token, newPassword })
