import { useParams } from 'react-router-dom'

export default function ManageTeam() {
  const { id } = useParams()
  return (
    <div style={{ padding: '32px' }}>
      <h2>Gestionar Equipo</h2>
      <p style={{ color: '#666' }}>Equipo ID: <strong>{id}</strong></p>
      <p style={{ color: '#888' }}>Próximamente: gestión de jugadores, alineaciones y configuración del equipo.</p>
    </div>
  )
}
