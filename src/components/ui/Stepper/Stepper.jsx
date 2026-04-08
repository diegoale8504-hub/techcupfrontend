import styles from './Stepper.module.css'

export default function Stepper({ steps = [], currentStep = 0 }) {
  return (
    <div className={styles.stepper}>
      {steps.map((label, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <div key={i} className={styles.stepWrapper}>
            <div className={styles.stepRow}>
              <div
                className={[
                  styles.circle,
                  done ? styles.done : '',
                  active ? styles.active : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {done ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={[styles.line, done ? styles.lineDone : ''].filter(Boolean).join(' ')} />
              )}
            </div>
            <span
              className={[
                styles.label,
                done ? styles.labelDone : '',
                active ? styles.labelActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
