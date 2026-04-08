import styles from './Button.module.css'

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  fullWidth = false,
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        isDisabled ? styles.disabled : '',
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={isDisabled}
      onClick={onClick}
    >
      {loading ? <span className={styles.spinner} /> : null}
      {children}
    </button>
  )
}
