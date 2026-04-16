import { useState, useEffect, useMemo } from 'react'
import PageLayout from '../../../components/layout/PageLayout/PageLayout'
import { getAllUsers } from '../../../api/users'
import styles from './OrgUsersPage.module.css'

const ROLE_LABELS = {
  PLAYER:        'Jugador',
  CAPTAIN:       'Capitán',
  REFEREE:       'Árbitro',
  ORGANIZER:     'Organizador',
  ADMINISTRATOR: 'Administrador',
  FAMILY_MEMBER: 'Familiar',
  GRADUATE:      'Graduado',
  PROFESSOR:     'Docente',
}

const ROLE_KEYS = ['Todos', 'PLAYER', 'CAPTAIN', 'REFEREE', 'ORGANIZER', 'ADMINISTRATOR', 'FAMILY_MEMBER']

export default function OrgUsersPage() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState('Todos')

  useEffect(() => {
    getAllUsers()
      .then((res) => setUsers(res.data ?? []))
      .catch(() => setError('No se pudo cargar la lista de usuarios.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      const matchRole = roleFilter === 'Todos' || u.role === roleFilter
      const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      return matchRole && matchSearch
    })
  }, [users, search, roleFilter])

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Usuarios</h1>
        <p className={styles.sub}>Todos los usuarios registrados en la plataforma</p>
      </div>

      {loading && <p className={styles.loading}>Cargando usuarios...</p>}
      {error   && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <>
          <div className={styles.filtersRow}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={styles.roleSelect}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              {ROLE_KEYS.map((r) => (
                <option key={r} value={r}>{r === 'Todos' ? 'Todos los roles' : ROLE_LABELS[r] ?? r}</option>
              ))}
            </select>
          </div>

          <p className={styles.count}>
            Mostrando <strong>{filtered.length}</strong> de <strong>{users.length}</strong> usuarios
          </p>

          {filtered.length === 0 ? (
            <p className={styles.emptyMsg}>No se encontraron usuarios con estos filtros.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Equipo</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id}>
                      <td className={styles.nameCell}>
                        <span className={styles.avatar}>{u.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                        {u.name ?? '—'}
                      </td>
                      <td className={styles.emailCell}>{u.email ?? '—'}</td>
                      <td>
                        <span className={`${styles.rolePill} ${styles[`role_${u.role}`]}`}>
                          {ROLE_LABELS[u.role] ?? u.role ?? '—'}
                        </span>
                      </td>
                      <td className={styles.teamCell}>{u.teamId ? `#${u.teamId}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </PageLayout>
  )
}
