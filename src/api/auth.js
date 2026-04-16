import axiosInstance from './axiosInstance'

export const loginApi = ({ email, password }) =>
  axiosInstance.post('/api/auth/login', { email, password })

export const forgotPasswordApi = ({ email }) =>
  axiosInstance.post('/api/auth/forgot-password', { email })

export const resetPasswordApi = ({ token, newPassword }) =>
  axiosInstance.post('/api/auth/reset-password', { token, newPassword })

export const changePasswordApi = (userId, { currentPassword, newPassword }) =>
  axiosInstance.patch(`/api/auth/change-password/${userId}`, {
    currentPassword,
    newPassword,
    confirmNewPassword: newPassword,
  })
