export const decodeJWT = (token) => {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export const isTokenExpired = (decoded) => {
  if (!decoded?.exp) return true
  return decoded.exp * 1000 < Date.now()
}

// Backend JWT has a single "role" string claim (e.g. "PLAYER", "CAPTAIN")
// Returns an array for consistent usage: ["CAPTAIN"]
export const extractRoles = (decoded) => {
  const raw = decoded?.role ?? decoded?.roles ?? decoded?.authorities ?? []
  if (typeof raw === 'string') return [raw]
  if (Array.isArray(raw)) return raw.map((r) => r.replace('ROLE_', ''))
  return []
}
