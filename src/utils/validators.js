export const isRequired = (value) =>
  value !== null && value !== undefined && value.toString().trim() !== ''

export const isEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export const isNumeric = (value) =>
  /^\d+$/.test(value.toString().trim())

export const isMinLength = (value, min) =>
  value.toString().trim().length >= min

export const isMinAge = (dateOfBirth, minAge) => {
  if (!dateOfBirth) return false
  const age = Math.floor((Date.now() - new Date(dateOfBirth)) / 31557600000)
  return age >= minAge
}

export const doPasswordsMatch = (p1, p2) => p1 === p2

export const validate = (fields, rules) => {
  const errors = {}
  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      const error = rule(fields[field], fields)
      if (error) {
        errors[field] = error
        break
      }
    }
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}

// Rule factories
export const required = (msg = '*Campo obligatorio') => (v) =>
  isRequired(v) ? null : msg

export const email = (msg = '*Formato de email inválido') => (v) =>
  !v || isEmail(v) ? null : msg

export const numeric = (msg = '*Solo se permiten números') => (v) =>
  !v || isNumeric(v) ? null : msg

export const minLength = (min, msg) => (v) =>
  !v || isMinLength(v, min) ? null : (msg ?? `*Mínimo ${min} caracteres`)

export const minAge = (min, msg) => (v) =>
  !v || isMinAge(v, min) ? null : (msg ?? `*Debes tener al menos ${min} años`)

export const passwordsMatch = (msg = '*Las contraseñas no coinciden') => (v, fields) =>
  v === fields.password ? null : msg
