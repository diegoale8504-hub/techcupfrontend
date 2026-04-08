import Sidebar from '../Sidebar/Sidebar'
import styles from './PageLayout.module.css'

export default function PageLayout({ children, bgImage }) {
  return (
    <div
      className={styles.root}
      style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}
    >
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  )
}
