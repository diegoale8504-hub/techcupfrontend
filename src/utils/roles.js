/**
 * Derives the effective UI role from the user object stored in AuthContext.
 * user.role is a single string (e.g. "PLAYER", "CAPTAIN", "REFEREE").
 */
export function getEffectiveRole(user) {
  if (!user) return 'estudiante'
  const role = user.role ?? ''

  if (role === 'CAPTAIN')                                   return 'capitán'
  if (role === 'ADMINISTRATIVE' || role === 'ADMINISTRATOR' || role === 'ORGANIZER') return 'organizador'
  if (role === 'REFEREE')                                   return 'árbitro'
  if (role === 'FAMILY_MEMBER')                             return 'padre'
  if (role === 'GRADUATE' || role === 'PROFESSOR')          return 'graduado'
  if (role === 'PLAYER')                                    return user.teamId ? 'jugador' : 'estudiante'
  return 'estudiante'
}
