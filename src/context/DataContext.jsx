import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { defaultCars } from '../data/cars'
import { defaultBookings } from '../data/bookings'
import { defaultSettings } from '../data/site'
import { defaultTestimonials } from '../data/testimonials'
import { PREFIX, loadState, saveState, clearState } from '../utils/storage'

const DataContext = createContext(null)

const normalizeSettings = (s) => {
  const out = { ...s }
  if (out.email === 'bookings@kiaskylerrentals.com') out.email = defaultSettings.email
  if (['478-4045', '242-478-4045'].includes(out.phone)) out.phone = defaultSettings.phone
  return out
}


const nextBookingId = (bookings) => {
  const max = bookings.reduce((acc, b) => {
    const n = Number(String(b.id).replace(/\D/g, ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 1000)
  return `BK-${max + 1}`
}

export function DataProvider({ children }) {
  const [cars, setCars] = useState(() => loadState('cars', defaultCars))
  const [bookings, setBookings] = useState(() => loadState('bookings', defaultBookings))
  const [testimonials, setTestimonials] = useState(() => loadState('testimonials', defaultTestimonials))
  const [messages, setMessages] = useState(() => loadState('messages', []))
  const [settings, setSettings] = useState(() =>
    normalizeSettings({ ...defaultSettings, ...loadState('settings', {}) }),
  )

  useEffect(() => saveState('cars', cars), [cars])
  useEffect(() => saveState('bookings', bookings), [bookings])
  useEffect(() => saveState('settings', settings), [settings])
  useEffect(() => saveState('testimonials', testimonials), [testimonials])
  useEffect(() => saveState('messages', messages), [messages])

  useEffect(() => {
    const parse = (raw, fallback) => {
      try {
        return raw ? JSON.parse(raw) : fallback
      } catch {
        return fallback
      }
    }

    const onStorage = (e) => {
      if (e.storageArea !== window.localStorage) return
      if (e.key === null) {
        setCars(defaultCars)
        setBookings(defaultBookings)
        setSettings(defaultSettings)
        setTestimonials(defaultTestimonials)
        setMessages([])
        return
      }
      if (e.key === `${PREFIX}cars`) setCars(parse(e.newValue, defaultCars))
      if (e.key === `${PREFIX}testimonials`) setTestimonials(parse(e.newValue, defaultTestimonials))
      if (e.key === `${PREFIX}messages`) {
        const next = parse(e.newValue, [])
        const known = new Set(parse(e.oldValue, []).map((m) => m.id))
        const added = next.filter((m) => !known.has(m.id))
        setMessages(next)
        if (added.length && e.oldValue) {
          window.dispatchEvent(new CustomEvent('ksr:new-messages', { detail: added }))
        }
      }
      if (e.key === `${PREFIX}settings`) setSettings(normalizeSettings({ ...defaultSettings, ...parse(e.newValue, {}) }))
      if (e.key === `${PREFIX}bookings`) {
        const next = parse(e.newValue, defaultBookings)
        const known = new Set(parse(e.oldValue, []).map((b) => b.id))
        const added = next.filter((b) => !known.has(b.id))
        setBookings(next)
        if (added.length && e.oldValue) {
          window.dispatchEvent(new CustomEvent('ksr:new-bookings', { detail: added }))
        }
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addCar = useCallback((car) => {
    const id = `car-${Date.now()}`
    setCars((prev) => [{ ...car, id }, ...prev])
    return id
  }, [])

  const updateCar = useCallback((id, patch) => {
    setCars((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const deleteCar = useCallback((id) => {
    setCars((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addBooking = useCallback((booking) => {
    let id = ''
    setBookings((prev) => {
      id = nextBookingId(prev)
      return [
        {
          ...booking,
          id,
          status: booking.status || 'pending',
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ]
    })
    return id
  }, [])

  const updateBooking = useCallback((id, patch) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }, [])

  const deleteBooking = useCallback((id) => {
    setBookings((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const addTestimonial = useCallback((t) => {
    const id = `rev-${Date.now()}`
    setTestimonials((prev) => [{ ...t, id }, ...prev])
    return id
  }, [])

  const updateTestimonial = useCallback((id, patch) => {
    setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const deleteTestimonial = useCallback((id) => {
    setTestimonials((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addMessage = useCallback((m) => {
    const id = `msg-${Date.now()}`
    setMessages((prev) => [
      { ...m, id, read: false, createdAt: new Date().toISOString() },
      ...prev,
    ])
    return id
  }, [])

  const updateMessage = useCallback((id, patch) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  const deleteMessage = useCallback((id) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const resetData = useCallback(() => {
    clearState('cars')
    clearState('bookings')
    clearState('settings')
    clearState('testimonials')
    clearState('messages')
    setCars(defaultCars)
    setBookings(defaultBookings)
    setSettings(defaultSettings)
    setTestimonials(defaultTestimonials)
    setMessages([])
  }, [])

  const value = useMemo(
    () => ({
      cars,
      bookings,
      testimonials,
      messages,
      settings,
      getCar: (id) => cars.find((c) => c.id === id),
      addCar,
      updateCar,
      deleteCar,
      addBooking,
      updateBooking,
      deleteBooking,
      updateSettings,
      addTestimonial,
      updateTestimonial,
      deleteTestimonial,
      addMessage,
      updateMessage,
      deleteMessage,
      resetData,
    }),
    [cars, bookings, testimonials, messages, settings, addCar, updateCar, deleteCar, addBooking, updateBooking, deleteBooking,
      updateSettings, addTestimonial, updateTestimonial, deleteTestimonial, addMessage, updateMessage,
      deleteMessage, resetData],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
