export const blockingStatuses = ['pending', 'confirmed', 'active']

const DAY = 24 * 60 * 60 * 1000

export const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export const toISO = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart <= bEnd && bStart <= aEnd

export const carBookings = (bookings, carId, excludeId = null) =>
  bookings.filter(
    (b) => b.carId === carId && b.id !== excludeId && blockingStatuses.includes(b.status) && b.pickupDate && b.returnDate,
  )

export const bookedDateSet = (bookings, carId, excludeId = null) => {
  const set = new Set()
  carBookings(bookings, carId, excludeId).forEach((b) => {
    let cursor = b.pickupDate
    let guard = 0
    while (cursor <= b.returnDate && guard < 400) {
      set.add(cursor)
      cursor = addDays(cursor, 1)
      guard += 1
    }
  })
  return set
}

export const findConflicts = (bookings, { carId, pickupDate, returnDate, id = null }) => {
  if (!carId || !pickupDate || !returnDate) return []
  return carBookings(bookings, carId, id).filter((b) =>
    rangesOverlap(pickupDate, returnDate, b.pickupDate, b.returnDate),
  )
}

export const nextFreeDate = (bookedSet, fromISO) => {
  let cursor = fromISO
  let guard = 0
  while (bookedSet.has(cursor) && guard < 400) {
    cursor = addDays(cursor, 1)
    guard += 1
  }
  return cursor
}

export const normalizePhone = (value = '') => String(value).replace(/\D/g, '')

export const phonesMatch = (a, b) => {
  const x = normalizePhone(a)
  const y = normalizePhone(b)
  if (!x || !y) return false
  const tail = Math.min(7, x.length, y.length)
  return x.slice(-tail) === y.slice(-tail)
}

export const daysInRange = (start, end) => Math.round((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / DAY)
