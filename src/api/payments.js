import axiosInstance from './axiosInstance'

export const getPaymentProof = (teamId) =>
  axiosInstance.get(`/api/payments/${teamId}/proof`)

// Backend expects multipart/form-data with field "file"
export const uploadPaymentProof = (teamId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return axiosInstance.post(`/api/payments/${teamId}/proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const updatePaymentStatus = (teamId, status) =>
  axiosInstance.patch(`/api/payments/${teamId}/proof/status`, { status })
