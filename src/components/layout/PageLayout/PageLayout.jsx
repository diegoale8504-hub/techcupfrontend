import styles from './PageLayout.module.css'

/**
 * Wrapper de contenido para páginas dentro de Layout.
 * El sidebar y el fondo de imagen los provee el Layout a nivel de ruta.
 * Solo aplica padding y max-width al contenido interior.
 */
export default function PageLayout({ children }) {
  return (
    <div className={styles.content}>
      {children}
    </div>
  )
}
