/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  selectUserType,
  submitStep1,
  submitStep2,
  submitStep3,
  completeRegistrationApi,
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
  const navigate   = useNavigate()
  const { login }  = useAuth()
  const saved      = loadFromStorage()

  const [sessionId,        setSessionId]        = useState(saved?.sessionId ?? null)
  const [userType,         setUserType]          = useState(saved?.userType ?? null)
  const [registrationData, setRegistrationData]  = useState(saved?.data ?? {})
  const [isSubmitting,     setIsSubmitting]      = useState(false)
  const [error,            setError]             = useState(null)
  // true when step3 data was sent OK but /complete failed → show retry button
  const [completeFailed,   setCompleteFailed]    = useState(false)

  // Persists snapshot to sessionStorage
  const persist = useCallback((patch) => {
    const next = { sessionId, userType, data: registrationData, ...patch }
    saveToStorage(next)
  }, [sessionId, userType, registrationData])

  // ── Public: accumulate step data ──────────────────────────────────────
  const setStepData = useCallback((step, data) => {
    setRegistrationData((prev) => {
      const next = { ...prev, [step]: data }
      saveToStorage({ sessionId, userType, data: next })
      return next
    })
  }, [sessionId, userType])

  // ── Public: clean everything ──────────────────────────────────────────
  const clearRegistration = useCallback(() => {
    clearStorage()
    setSessionId(null)
    setUserType(null)
    setRegistrationData({})
    setCompleteFailed(false)
    setError(null)
  }, [])

  // ── Step 0: choose user type ──────────────────────────────────────────
  const startRegistration = useCallback(async (type) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await selectUserType(type)
      const id  = res.data.sessionId ?? res.data.id
      setSessionId(id)
      setUserType(type)
      persist({ sessionId: id, userType: type, data: {} })
      navigate('/register/step1')
    } catch (err) {
      setError(err.userMessage ?? 'Error al iniciar el registro. Intente de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }, [navigate, persist])

  // ── Step 1 ────────────────────────────────────────────────────────────
  const saveStep1 = useCallback(async (data) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await submitStep1({ sessionId, ...data })
      setStepData('step1', data)
      navigate('/register/step2')
    } catch (err) {
      setError(err.userMessage ?? 'Error al guardar los datos. Intente de nuevo.')
      throw err   // re-lanzar → el paso extrae fieldErrors si es 400
    } finally {
      setIsSubmitting(false)
    }
  }, [sessionId, navigate, setStepData])

  // ── Step 2 ────────────────────────────────────────────────────────────
  const saveStep2 = useCallback(async (data) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await submitStep2({ sessionId, ...data })
      setStepData('step2', data)
      navigate('/register/step3')
    } catch (err) {
      setError(err.userMessage ?? 'Error al guardar los datos. Intente de nuevo.')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [sessionId, navigate, setStepData])

  // ── Step 3 + complete ─────────────────────────────────────────────────
  const saveStep3 = useCallback(async (data) => {
    setIsSubmitting(true)
    setError(null)
    setCompleteFailed(false)

    // 1. Enviar datos del paso 3
    try {
      await submitStep3({ sessionId, ...data })
      setStepData('step3', data)
    } catch (err) {
      setError(err.userMessage ?? 'Error al guardar los datos. Intente de nuevo.')
      setIsSubmitting(false)
      throw err   // step3 component extrae fieldErrors
    }

    // 2. Completar registro
    try {
      const res = await completeRegistrationApi(sessionId)
      const { token, id, name, email, role } = res.data
      login({ token, id, name, email, role })
      clearRegistration()
      navigate('/dashboard')
    } catch (err) {
      setError(err.userMessage ?? 'No se pudo completar el registro. Intenta de nuevo.')
      setCompleteFailed(true)
    } finally {
      setIsSubmitting(false)
    }
  }, [sessionId, navigate, login, setStepData, clearRegistration])

  // ── Retry solo el complete (cuando step3 ya fue enviado) ──────────────
  const retryComplete = useCallback(async () => {
    setIsSubmitting(true)
    setError(null)
    setCompleteFailed(false)
    try {
      const res = await completeRegistrationApi(sessionId)
      const { token, id, name, email, role } = res.data
      login({ token, id, name, email, role })
      clearRegistration()
      navigate('/dashboard')
    } catch (err) {
      setError(err.userMessage ?? 'No se pudo completar el registro. Intenta de nuevo.')
      setCompleteFailed(true)
    } finally {
      setIsSubmitting(false)
    }
  }, [sessionId, login, navigate, clearRegistration])

  return (
    <RegistrationContext.Provider
      value={{
        sessionId,
        userType,
        registrationData,
        isSubmitting,
        error,
        completeFailed,
        setStepData,
        clearRegistration,
        startRegistration,
        saveStep1,
        saveStep2,
        saveStep3,
        retryComplete,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  )
}
