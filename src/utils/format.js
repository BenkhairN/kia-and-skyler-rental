export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0)

export const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const daysBetween = (start, end) => {
  if (!start || !end) return 0
  const a = new Date(`${start}T00:00:00`)
  const b = new Date(`${end}T00:00:00`)
  const diff = Math.round((b - a) / (24 * 60 * 60 * 1000))
  return diff > 0 ? diff : 0
}

export const todayISO = () => new Date().toISOString().slice(0, 10)

export const statusTone = (status) =>
  ({
    available: 'success',
    rented: 'info',
    maintenance: 'warning',
    pending: 'warning',
    confirmed: 'info',
    active: 'success',
    completed: 'neutral',
    cancelled: 'danger',
  })[status] || 'neutral'

export const carDisplayStatus = (car) => (car.status === 'maintenance' ? 'maintenance' : 'available')

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
