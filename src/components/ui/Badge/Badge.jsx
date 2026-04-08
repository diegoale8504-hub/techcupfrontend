import styles from './Badge.module.css'

const STATUS_CONFIG = {
  pending:   { label: 'En espera',  className: 'pending' },
  approved:  { label: 'Aprobado',   className: 'approved' },
  rejected:  { label: 'Rechazado',  className: 'rejected' },
  available: { label: 'Disponible', className: 'available' },
  'in-team': { label: 'En equipo',  className: 'inTeam' },
  // PaymentStatus values from backend
  PENDING:       { label: 'En espera',       className: 'pending' },
  UNDER_REVIEW:  { label: 'En revisión',     className: 'pending' },
  APPROVED:      { label: 'Aprobado',        className: 'approved' },
  REJECTED:      { label: 'Rechazado',       className: 'rejected' },
}

export default function Badge({ status }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'pending' }
  return (
    <span className={[styles.badge, styles[config.className]].join(' ')}>
      {config.label}
    </span>
  )
}
