import { createContext, useState, useEffect, useCallback } from 'react'
import { decodeJWT, isTokenExpired, extractRoles } from '../utils/jwt'

export const AuthContext = createContext(null)

const TOKEN_KEY = 'techcup_token'
const USER_KEY  = 'techcup_user'

// Build user from token + optional extra data from login response body
function buildUser(token, extra = {}) {
  const decoded = decodeJWT(token)
  if (!decoded || isTokenExpired(decoded)) return null
  return {
    id:     extra.id    ?? decoded.sub,   // id comes from login response body
    name:   extra.name  ?? null,
    email:  extra.email ?? decoded.sub,
    roles:  extractRoles(decoded),        // ["PLAYER"] / ["CAPTAIN"] etc.
    teamId: extra.teamId ?? null,
    exp:    decoded.exp,
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser]   = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser  = localStorage.getItem(USER_KEY)
    if (storedToken) {
      const extra = storedUser ? JSON.parse(storedUser) : {}
      const parsedUser = buildUser(storedToken, extra)
      if (parsedUser) {
        setToken(storedToken)
        setUser(parsedUser)
      } else {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  // login(token, extra) — extra = { id, name, email, role } from login response body
  const login = useCallback((newToken, extra = {}) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(extra))
    const parsedUser = buildUser(newToken, extra)
    setToken(newToken)
    setUser(parsedUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // Update teamId after user creates/joins a team
  const setTeamId = useCallback((teamId) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, teamId }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => logout()
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [logout])

  const hasRole = useCallback(
    (role) => user?.roles?.includes(role) ?? false,
    [user]
  )

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout, hasRole, setTeamId }}>
      {children}
    </AuthContext.Provider>
  )
}
