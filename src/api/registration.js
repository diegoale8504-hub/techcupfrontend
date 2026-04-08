import axiosInstance from './axiosInstance'

export const selectUserType = (userType) =>
  axiosInstance.post('/api/registration/type', { userType })

export const submitStep1 = (data) =>
  axiosInstance.post('/api/registration/step1', data)

export const submitStep2 = (data) =>
  axiosInstance.post('/api/registration/step2', data)

export const submitStep3 = (data) =>
  axiosInstance.post('/api/registration/step3', data)

export const completeRegistration = (sessionId) =>
  axiosInstance.post('/api/registration/complete', { sessionId })
