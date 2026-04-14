/**
 * Derives the effective UI role from the user object stored in AuthContext.
 * Maps backend roles to sidebar/dashboard display roles.
 */
export function getEffectiveRole(user) {
  if (!user) return 'estudiante'
  const roles = user.roles ?? []
  const role  = roles[0] ?? ''

  if (role === 'CAPTAIN')                              return 'capitán'
  if (role === 'ADMINISTRATIVE' || role === 'ADMINISTRATOR') return 'organizador'
  if (role === 'REFEREE')                              return 'árbitro'
  if (role === 'FAMILY_MEMBER')                        return 'padre'
  if (role === 'GRADUATE' || role === 'PROFESSOR')     return 'graduado'
  // STUDENT: distinguish by teamId
  if (user.teamId)                                     return 'jugador'
  return 'estudiante'
}
