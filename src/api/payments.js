import axiosInstance from './axiosInstance'

export const getPaymentProof = (teamId) =>
  axiosInstance.get(`/api/payments/${teamId}/proof`)

// Backend expects JSON { fileUrl: "..." } — NOT multipart
export const uploadPaymentProof = (teamId, fileUrl) =>
  axiosInstance.post(`/api/payments/${teamId}/proof`, { fileUrl })

export const updatePaymentStatus = (teamId, status) =>
  axiosInstance.patch(`/api/payments/${teamId}/proof/status`, { status })
