import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:8443',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.userMessage =
        'No se pudo conectar al servidor. Verifique su conexión e intente de nuevo.'
    } else if (error.response.status === 401) {
      if (error.response.data?.message) {
        error.userMessage = error.response.data.message
      } else {
        localStorage.removeItem('token')
        window.dispatchEvent(new Event('auth:unauthorized'))
      }
    } else if (error.response.status === 403) {
      error.userMessage = 'No tiene permisos para realizar esta acción.'
    } else if (error.response.data?.message) {
      error.userMessage = error.response.data.message
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
