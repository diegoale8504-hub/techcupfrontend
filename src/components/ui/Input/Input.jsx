import styles from './Input.module.css'

export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  options,
}) {
  const hasValue = value !== undefined && value !== null && value.toString().trim() !== ''
  const fieldClass = [
    styles.field,
    error ? styles.hasError : '',
    hasValue && !error ? styles.hasValue : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label} htmlFor={name}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      {type === 'select' ? (
        <select
          id={name}
          name={name}
          className={fieldClass}
          value={value}
          onChange={onChange}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          className={fieldClass}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
      )}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
