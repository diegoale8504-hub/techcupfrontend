import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export const AuthContext = createContext(null)

const TOKEN_KEY = 'techcup_token'
const USER_KEY  = 'techcup_user'

function decodePayload(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

function isExpired(payload) {
  return payload?.exp ? payload.exp * 1000 < Date.now() : true
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (storedToken) {
      const payload = decodePayload(storedToken)
      if (payload && !isExpired(payload)) {
        const storedUser = localStorage.getItem(USER_KEY)
        const userData = storedUser
          ? JSON.parse(storedUser)
          : {
              id:     payload.sub    ?? null,
              name:   payload.name   ?? null,
              email:  payload.email  ?? payload.sub ?? null,
              role:   payload.role   ?? null,
              teamId: payload.teamId ?? null,
            }
        setToken(storedToken)
        setUser(userData)
      } else {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
    setLoading(false)
  }, [])

  /**
   * login(data) — data = { token, id, name, email, role, teamId? }
   * Llamar con los datos completos devueltos por el backend.
   * También se usa al crear equipo: el backend devuelve un nuevo token con role=CAPTAIN.
   */
  const login = useCallback((data) => {
    const { token: newToken, ...userData } = data
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setToken(newToken)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
