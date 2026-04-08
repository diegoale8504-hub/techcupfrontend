import { useContext } from 'react'
import { RegistrationContext } from '../context/RegistrationContext'

export const useRegistration = () => {
  const ctx = useContext(RegistrationContext)
  if (!ctx) throw new Error('useRegistration must be used within a RegistrationProvider')
  return ctx
}
