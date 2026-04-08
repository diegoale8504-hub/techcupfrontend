import { createContext, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  selectUserType,
  submitStep1,
  submitStep2,
  submitStep3,
  completeRegistration,
} from '../api/registration'

export const RegistrationContext = createContext(null)

const STORAGE_KEY = 'techcup_reg'

function loadFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveToStorage(data) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function clearStorage() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function RegistrationProvider({ children }) {
  const navigate = useNavigate()
  const saved = loadFromStorage()

  const [sessionId, setSessionId] = useState(saved?.sessionId ?? null)
  const [userType, setUserType] = useState(saved?.userType ?? null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const persist = useCallback((data) => saveToStorage(data), [])

  const startRegistration = useCallback(
    async (type) => {
      setIsSubmitting(true)
      try {
        const res = await selectUserType(type)
        const id = res.data.sessionId ?? res.data.id
        setSessionId(id)
        setUserType(type)
        persist({ sessionId: id, userType: type })
        navigate('/register/step1')
      } catch (err) {
        setError(err.userMessage ?? 'Error al iniciar el registro. Intente de nuevo.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [navigate, persist]
  )

  const saveStep1 = useCallback(
    async (data) => {
      setIsSubmitting(true)
      setError(null)
      try {
        await submitStep1({ sessionId, ...data })
        navigate('/register/step2')
      } catch (err) {
        setError(err.userMessage ?? 'Error al guardar los datos. Intente de nuevo.')
        throw err
      } finally {
        setIsSubmitting(false)
      }
    },
    [sessionId, navigate]
  )

  const saveStep2 = useCallback(
    async (data) => {
      setIsSubmitting(true)
      setError(null)
      try {
        await submitStep2({ sessionId, ...data })
        navigate('/register/step3')
      } catch (err) {
        setError(err.userMessage ?? 'Error al guardar los datos. Intente de nuevo.')
        throw err
      } finally {
        setIsSubmitting(false)
      }
    },
    [sessionId, navigate]
  )

  const saveStep3 = useCallback(
    async (data) => {
      setIsSubmitting(true)
      setError(null)
      try {
        await submitStep3({ sessionId, ...data })
        await completeRegistration(sessionId)
        clearStorage()
        navigate('/login?registered=1')
      } catch (err) {
        setError(err.userMessage ?? 'Error al completar el registro. Intente de nuevo.')
        throw err
      } finally {
        setIsSubmitting(false)
      }
    },
    [sessionId, navigate]
  )

  const reset = useCallback(() => {
    clearStorage()
    setSessionId(null)
    setUserType(null)
  }, [])

  return (
    <RegistrationContext.Provider
      value={{ sessionId, userType, isSubmitting, error, startRegistration, saveStep1, saveStep2, saveStep3, reset }}
    >
      {children}
    </RegistrationContext.Provider>
  )
}
