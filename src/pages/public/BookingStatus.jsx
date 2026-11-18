import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarDays, Car, CheckCircle2, Clock, Hash, KeyRound, MapPin, Phone, Search, Undo2, XCircle } from 'lucide-react'
import { useData } from '../../context/DataContext'
import Badge from '../../components/ui/Badge'
import CarImage from '../../components/ui/CarImage'
import { formatCurrency, formatDate, todayISO } from '../../utils/format'
import { phonesMatch } from '../../utils/availability'

const steps = [
  { key: 'pending', label: 'Request received', icon: Clock, text: 'We have your request and will confirm shortly.' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, text: 'Your vehicle is reserved for your dates.' },
  { key: 'active', label: 'Picked up', icon: KeyRound, text: 'Enjoy the drive around Grand Bahama.' },
  { key: 'completed', label: 'Returned', icon: Undo2, text: 'Vehicle returned and deposit refunded.' },
]

const stepIndex = (status) => steps.findIndex((s) => s.key === status)

export default function BookingStatus() {
  const [params] = useSearchParams()
  const { bookings, cars, settings } = useData()
  const [ref, setRef] = useState(params.get('ref') || '')
  const [phone, setPhone] = useState('')
  const [resultId, setResultId] = useState(null)
  const [error, setError] = useState('')

  const lookup = (e) => {
    e.preventDefault()
    const code = ref.trim().toUpperCase()
    if (!code || !phone.trim()) {
      setError('Enter your booking reference and the phone number you booked with.')
      setResultId(null)
      return
    }
    const match = bookings.find((b) => String(b.id).toUpperCase() === code && phonesMatch(b.customerPhone, phone))
    if (!match) {
      setError('We could not find a booking with that reference and phone number. Check the details or call us.')
      setResultId(null)
      return
    }
    setError('')
    setResultId(match.id)
  }

  const result = resultId ? bookings.find((b) => b.id === resultId) || null : null
  const car = result ? cars.find((c) => c.id === result.carId) : null
  const effectiveStatus =
    result?.status === 'confirmed' && result.pickupDate <= todayISO() && result.returnDate >= todayISO()
      ? 'active'
      : result?.status
  const cancelled = result?.status === 'cancelled'
  const current = result ? stepIndex(effectiveStatus) : -1

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">My booking</span>
          <h1>Check your booking</h1>
          <p>Enter your reference number and phone number to see the status of your request.</p>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 80 }}>
        <div className="status-grid">
          <form className="card card-pad" onSubmit={lookup} noValidate>
            <div className="form-grid">
              <div className="field span-2">
                <label htmlFor="ref">Booking reference</label>
                <div className="input-icon">
                  <Hash size={16} />
                  <input id="ref" className="input" placeholder="BK-1007" value={ref} onChange={(e) => setRef(e.target.value)} autoCapitalize="characters" />
                </div>
              </div>
              <div className="field span-2">
                <label htmlFor="phone">Phone number used for the booking</label>
                <div className="input-icon">
                  <Phone size={16} />
                  <input id="phone" className="input" placeholder="(242) 555-0100" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              {error && <span className="form-error span-2">{error}</span>}
              <button type="submit" className="btn btn-gold span-2">
                <Search size={16} />
                Find my booking
              </button>
            </div>
            <p className="form-help mt-4">
              Lost your reference? Call us at <a href={settings.phoneHref} className="gold-text">{settings.phone}</a> and we will look it up.
            </p>
          </form>

          {result && (
            <div className="card card-pad status-card">
              <div className="flex items-center justify-between wrap gap-3">
                <div>
                  <span className="eyebrow">Reference</span>
                  <h2 style={{ fontSize: 24, letterSpacing: '0.04em' }}>{result.id}</h2>
                </div>
                <Badge status={effectiveStatus}>
                  {effectiveStatus === 'active' ? 'Picked up' : effectiveStatus[0].toUpperCase() + effectiveStatus.slice(1)}
                </Badge>
              </div>

              <div className="summary-car mt-4">
                <CarImage src={car?.image} alt={car?.name || 'Vehicle'} />
                <div>
                  <strong>{car ? `${car.year} ${car.name}` : 'Vehicle'}</strong>
                  <p className="muted small">{car ? `${car.color} · ${car.category}` : 'Details available by phone'}</p>
                </div>
              </div>

              {cancelled ? (
                <p className="avail-note avail-bad mt-4">
                  <XCircle size={16} />
                  This booking was cancelled. Call us if you would like to rebook.
                </p>
              ) : (
                <ol className="timeline">
                  {steps.map((s, i) => {
                    const Icon = s.icon
                    const state = i < current ? 'done' : i === current ? 'current' : 'upcoming'
                    return (
                      <li key={s.key} className={`timeline-step ${state}`}>
                        <span className="timeline-icon"><Icon size={16} /></span>
                        <div>
                          <strong>{s.label}</strong>
                          {state === 'current' && <p className="muted small">{s.text}</p>}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}

              <ul className="info-list">
                <li><CalendarDays size={18} /> {formatDate(result.pickupDate)} to {formatDate(result.returnDate)} ({result.days} {result.days === 1 ? 'day' : 'days'})</li>
                <li><MapPin size={18} /> {result.pickupLocation}</li>
                <li><Car size={18} /> {formatCurrency(result.total)} rental + {formatCurrency(result.deposit ?? settings.deposit)} refundable deposit</li>
              </ul>

              <div className="flex gap-3 wrap mt-6">
                <a href={settings.phoneHref} className="btn btn-gold">
                  <Phone size={16} />
                  Call {settings.phone}
                </a>
                <Link to="/fleet" className="btn btn-outline">Browse fleet</Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
