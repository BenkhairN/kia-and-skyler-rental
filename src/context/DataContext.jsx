import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { defaultSettings } from '../data/site'
import { supabase } from '../lib/supabase'
import {
  bookingFromRow,
  bookingToRow,
  carFromRow,
  carToRow,
  feedbackFromRow,
  resolvePhotos,
} from '../lib/db'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

const stripAccountKeys = (obj) => {
  const { adminUsername, adminPassword, ...rest } = obj
  void adminUsername
  void adminPassword
  return rest
}

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [cars, setCars] = useState([])
  const [bookings, setBookings] = useState([])
  const [ranges, setRanges] = useState([])
  const [messages, setMessages] = useState([])
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)

  const fetchCars = useCallback(async () => {
    const { data } = await supabase.from('cars').select('*').order('created_at')
    if (data) setCars(data.map(carFromRow))
  }, [])

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('data').eq('id', true).maybeSingle()
    if (data?.data) setSettings({ ...defaultSettings, ...data.data })
  }, [])

  const fetchRanges = useCallback(async () => {
    const { data } = await supabase.rpc('booking_ranges')
    if (data) {
      setRanges(
        data.map((r) => ({
          id: `rng-${r.car_id}-${r.pickup_date}`,
          carId: r.car_id,
          pickupDate: r.pickup_date,
          returnDate: r.return_date,
          status: 'confirmed',
        })),
      )
    }
  }, [])

  const fetchBookings = useCallback(async () => {
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
    if (error) console.error('fetchBookings failed:', error.message)
    if (data) {
      let testPayments = []
      if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_STRIPE_TEST_CHECKOUT === 'true') {
        const result = await supabase.from('stripe_test_payments').select('reference, state')
        testPayments = result.data || []
      }
      setBookings(data.map((row) => ({ ...bookingFromRow(row), testPayment: testPayments.find((p) => p.reference === row.reference)?.state })))
    }
  }, [])

  const fetchFeedback = useCallback(async () => {
    const { data, error } = await supabase.from('feedback').select('*').order('created_at', { ascending: false })
    if (error) console.error('fetchFeedback failed:', error.message)
    if (data) setMessages(data.map(feedbackFromRow))
  }, [])

  useEffect(() => {
    let mounted = true
    Promise.all([fetchCars(), fetchSettings(), fetchRanges()]).finally(() => {
      if (mounted) setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [fetchCars, fetchSettings, fetchRanges])

  useEffect(() => {
    if (user) {
      fetchBookings()
      fetchFeedback()
    } else {
      setBookings([])
      setMessages([])
    }
  }, [user, fetchBookings, fetchFeedback])

  useEffect(() => {
    if (!user || !import.meta.env.DEV || import.meta.env.VITE_ENABLE_STRIPE_TEST_CHECKOUT !== 'true') return undefined
    const timer = setInterval(fetchBookings, 15000)
    return () => clearInterval(timer)
  }, [user, fetchBookings])

  useEffect(() => {
    const notify = (event, rows) => {
      if (rows.length) window.dispatchEvent(new CustomEvent(event, { detail: rows }))
    }
    const channel = supabase
      .channel('ksr-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cars' }, fetchCars)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, fetchSettings)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        fetchRanges()
        if (user) {
          fetchBookings()
          if (payload.eventType === 'INSERT') notify('ksr:new-bookings', [bookingFromRow(payload.new)])
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, (payload) => {
        if (user) {
          fetchFeedback()
          if (payload.eventType === 'INSERT') notify('ksr:new-messages', [feedbackFromRow(payload.new)])
        }
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchCars, fetchSettings, fetchRanges, fetchBookings, fetchFeedback])

  const addCar = useCallback(async (car) => {
    const photos = await resolvePhotos([car.image, ...(car.gallery || [])].filter(Boolean), 'cars')
    const row = { ...carToRow(car), image: photos[0] || '', gallery: photos.slice(1) }
    const { data, error } = await supabase.from('cars').insert(row).select().single()
    if (error) throw new Error(error.message)
    const created = carFromRow(data)
    setCars((prev) => [...prev, created])
    return created.id
  }, [])

  const updateCar = useCallback(async (id, patch) => {
    let applied = patch
    const row = {}
    Object.entries(patch).forEach(([k, v]) => {
      row[k === 'dailyRate' ? 'daily_rate' : k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)] = v
    })
    if (patch.image !== undefined || patch.gallery !== undefined) {
      const photos = await resolvePhotos([patch.image, ...(patch.gallery || [])].filter(Boolean), 'cars')
      row.image = photos[0] || ''
      row.gallery = photos.slice(1)
      applied = { ...patch, image: row.image, gallery: row.gallery }
    }
    const { error } = await supabase.from('cars').update(row).eq('id', id)
    if (error) throw new Error(error.message)
    setCars((prev) => prev.map((c) => (c.id === id ? { ...c, ...applied } : c)))
  }, [])

  const deleteCar = useCallback(async (id) => {
    const { error } = await supabase.from('cars').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setCars((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addBooking = useCallback(async (booking) => {
    const { data, error } = await supabase.from('bookings').insert(bookingToRow(booking)).select().single()
    if (error) throw new Error(error.message)
    const created = bookingFromRow(data)
    setBookings((prev) => [created, ...prev])
    fetchRanges()
    return created.id
  }, [fetchRanges])

  const updateBooking = useCallback(async (id, patch) => {
    const map = {
      status: 'status',
      notes: 'notes',
      carId: 'car_id',
      dailyRate: 'daily_rate',
      customerName: 'customer_name',
      customerPhone: 'customer_phone',
      customerEmail: 'customer_email',
      pickupLocation: 'pickup_location',
      pickupDate: 'pickup_date',
      returnDate: 'return_date',
      total: 'total',
      deposit: 'deposit',
      paid: 'paid',
      paymentMethod: 'payment_method',
    }
    const row = {}
    Object.entries(patch).forEach(([k, v]) => {
      if (map[k]) row[map[k]] = v
    })
    const { error } = await supabase.from('bookings').update(row).eq('reference', id)
    if (error) throw new Error(error.message)
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
    fetchRanges()
  }, [fetchRanges])

  const deleteBooking = useCallback(async (id) => {
    const { error } = await supabase.from('bookings').delete().eq('reference', id)
    if (error) throw new Error(error.message)
    setBookings((prev) => prev.filter((b) => b.id !== id))
    fetchRanges()
  }, [fetchRanges])

  const updateSettings = useCallback(async (patch) => {
    const clean = stripAccountKeys(patch)
    setSettings((prev) => {
      const next = { ...prev, ...clean }
      supabase
        .from('site_settings')
        .upsert({ id: true, data: stripAccountKeys(next), updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) window.dispatchEvent(new CustomEvent('ksr:save-error', { detail: error.message }))
        })
      return next
    })
  }, [])

  const addMessage = useCallback(async (m) => {
    const { data, error } = await supabase
      .from('feedback')
      .insert({ name: m.name || 'Website visitor', message: m.message, rating: m.rating || 0 })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data.id
  }, [])

  const updateMessage = useCallback(async (id, patch) => {
    const row = {}
    if (patch.read !== undefined) row.read = patch.read
    const { error } = await supabase.from('feedback').update(row).eq('id', id)
    if (!error) setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  const deleteMessage = useCallback(async (id) => {
    const { error } = await supabase.from('feedback').delete().eq('id', id)
    if (!error) setMessages((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      cars,
      bookings,
      ranges,
      messages,
      settings,
      loading,
      getCar: (id) => cars.find((c) => c.id === id),
      addCar,
      updateCar,
      deleteCar,
      addBooking,
      updateBooking,
      deleteBooking,
      updateSettings,
      addMessage,
      updateMessage,
      deleteMessage,
    }),
    [cars, bookings, ranges, messages, settings, loading, addCar, updateCar, deleteCar, addBooking, updateBooking, deleteBooking, updateSettings, addMessage, updateMessage, deleteMessage],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
