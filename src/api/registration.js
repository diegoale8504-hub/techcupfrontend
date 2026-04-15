import axiosInstance from './axiosInstance'

// POST /api/registration/type — body: { userType: "STUDENT" }
export const selectUserType = (type) =>
  axiosInstance.post('/api/registration/type', { userType: type })

export const submitStep1 = (data) =>
  axiosInstance.post('/api/registration/step1', data)

export const submitStep2 = (data) =>
  axiosInstance.post('/api/registration/step2', data)

export const submitStep3 = (data) =>
  axiosInstance.post('/api/registration/step3', data)

// POST /api/registration/complete
export const completeRegistrationApi = (sessionId) =>
  axiosInstance.post('/api/registration/complete', { sessionId })
