import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CalendarCheck, CheckCircle2, ChevronLeft, ChevronRight, Copy, Check, Mail, MessageCircle, Phone, Search, UserRound, X } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import CarImage from '../../components/ui/CarImage'
import AvailabilityCalendar from '../../components/ui/AvailabilityCalendar'
import { daysBetween, formatCurrency, formatDate, todayISO } from '../../utils/format'
import { bookedDateSet, findConflicts, nextFreeDate } from '../../utils/availability'

const emptyForm = {
  carId: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  pickupLocation: '',
  pickupDate: '',
  returnDate: '',
  notes: '',
}

export default function Booking() {
  const [params] = useSearchParams()
  const { cars, ranges, settings } = useData()
  const { toast } = useToast()
  const available = cars.filter((c) => c.status !== 'maintenance')

  const [form, setForm] = useState({ ...emptyForm, carId: params.get('car') || '' })
  const [errors, setErrors] = useState({})
  const [confirmation, setConfirmation] = useState(null)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const requested = params.get('car')
    if (requested && available.some((c) => c.id === requested)) {
      setForm((f) => ({ ...f, carId: requested }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const today = todayISO()
  const car = cars.find((c) => c.id === form.carId)
  const days = daysBetween(form.pickupDate, form.returnDate)
  const bookedDates = useMemo(() => bookedDateSet(ranges, form.carId), [ranges, form.carId])
  const conflicts = useMemo(() => findConflicts(ranges, form), [ranges, form])
  const nextFree = useMemo(() => (form.carId ? nextFreeDate(bookedDates, today) : today), [bookedDates, form.carId, today])

  const rate = car ? car.dailyRate : settings.dailyRate
  const subtotal = car ? rate * days : 0
  const dueAtPickup = subtotal + (subtotal ? settings.deposit : 0)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const chooseCar = (carId) => {
    const booked = bookedDateSet(ranges, carId)
    const keepDates = form.pickupDate && form.returnDate && findConflicts(ranges, { ...form, carId }).length === 0
    setForm((f) => ({ ...f, carId, pickupDate: keepDates ? f.pickupDate : '', returnDate: keepDates ? f.returnDate : '' }))
    if (!keepDates && form.pickupDate && booked.size) toast('Those dates are not available for this vehicle. Please pick new dates.', 'info')
  }

  const carIndex = available.findIndex((c) => c.id === form.carId)
  const stepCar = (dir) => {
    if (!available.length) return
    const next = carIndex === -1
      ? (dir > 0 ? 0 : available.length - 1)
      : (carIndex + dir + available.length) % available.length
    chooseCar(available[next].id)
  }

  const setDates = ({ pickupDate, returnDate }) => {
    setForm((f) => ({ ...f, pickupDate, returnDate }))
    setErrors((e) => ({ ...e, pickupDate: undefined, returnDate: undefined }))
  }

  const validate = () => {
    const next = {}
    if (!form.carId) next.carId = 'Please choose a vehicle.'
    if (!form.customerName.trim()) next.customerName = 'Your name is required.'
    if (!form.customerPhone.trim()) next.customerPhone = 'A phone number is required.'
    if (form.customerEmail && !/^\S+@\S+\.\S+$/.test(form.customerEmail)) next.customerEmail = 'Enter a valid email.'
    if (!form.pickupDate) next.pickupDate = 'Choose a pick-up date on the calendar.'
    else if (!form.returnDate) next.returnDate = 'Choose a return date on the calendar.'
    else if (days < 1) next.returnDate = 'Return must be after pick-up.'
    else if (conflicts.length) next.returnDate = 'This vehicle is already booked on those dates.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate() || submitting) return
    setSubmitting(true)
    const { data: id, error } = await supabase.rpc('submit_booking', {
      p_car_id: form.carId,
      p_customer_name: form.customerName,
      p_customer_phone: form.customerPhone,
      p_customer_email: form.customerEmail,
      p_pickup_location: form.pickupLocation,
      p_pickup_date: form.pickupDate,
      p_return_date: form.returnDate,
      p_notes: form.notes,
    })
    setSubmitting(false)
    if (error) {
      toast(error.message || 'Could not send your booking request. Please try again or call us.', 'error')
      return
    }
    setConfirmation({ id, car, days, total: subtotal })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast('Booking request sent', 'success')
  }

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(confirmation.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast('Could not copy. Please note the reference manually.', 'error')
    }
  }

  if (confirmation) {
    return (
      <section className="section">
        <div className="container">
          <div className="card success-panel">
            <div className="success-icon">
              <CheckCircle2 size={36} />
            </div>
            <h2>Request received</h2>
            <p className="muted mt-2">
              Thanks, {form.customerName.split(' ')[0]}. We will call or email you shortly to confirm your{' '}
              {confirmation.car.name} from {formatDate(form.pickupDate)} to {formatDate(form.returnDate)}.
            </p>

            <div className="ref-box">
              <span className="small muted">Your booking reference</span>
              <div className="ref-row">
                <strong className="ref">{confirmation.id}</strong>
                <button type="button" className="btn-icon" onClick={copyRef} aria-label="Copy reference" title="Copy reference">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <span className="small muted">Keep this to check your booking status or when you call us.</span>
            </div>

            <div className="summary-lines" style={{ textAlign: 'left' }}>
              <div><span>{confirmation.days} {confirmation.days === 1 ? 'day' : 'days'} x {formatCurrency(rate)}</span><span>{formatCurrency(confirmation.total)}</span></div>
              <div><span>Refundable deposit</span><span>{formatCurrency(settings.deposit)}</span></div>
              <div className="total"><span>Due at pick-up</span><span className="gold-text">{formatCurrency(confirmation.total + settings.deposit)}</span></div>
            </div>

            <div className="flex gap-3 wrap mt-6" style={{ justifyContent: 'center' }}>
              <Link to={`/booking-status?ref=${confirmation.id}`} className="btn btn-outline">
                <Search size={16} />
                Check booking status
              </Link>
              <a href={settings.phoneHref} className="btn btn-gold">
                <Phone size={16} />
                Call {settings.phone}
              </a>
              <a
                href={`https://wa.me/${(settings.phoneHref || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I just booked ${confirmation.id} - ${confirmation.car.name} (${formatDate(form.pickupDate)} to ${formatDate(form.returnDate)}).`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
              >
                <MessageCircle size={16} />
                WhatsApp us
              </a>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const clearDates = form.pickupDate ? (
    <button type="button" className="avail-clear" onClick={() => setDates({ pickupDate: '', returnDate: '' })}>
      <X size={14} /> Clear dates
    </button>
  ) : null

  const availabilityNote = () => {
    if (!car) return null
    if (form.pickupDate && form.returnDate) {
      if (conflicts.length) {
        return (
          <p className="avail-note avail-bad">
            <AlertTriangle size={16} />
            Not available for these dates. Please choose different dates.
            {clearDates}
          </p>
        )
      }
      return (
        <p className="avail-note avail-ok">
          <CalendarCheck size={16} />
          Available: {formatDate(form.pickupDate)} to {formatDate(form.returnDate)}
          {clearDates}
        </p>
      )
    }
    if (nextFree !== today && !form.pickupDate) {
      return (
        <p className="avail-note">
          <CalendarCheck size={16} />
          Next available from {formatDate(nextFree)}
        </p>
      )
    }
    return (
      <p className="avail-note">
        <CalendarCheck size={16} />
        {form.pickupDate
          ? 'Now choose your return date (click the gold pick-up date to change it)'
          : 'Select your pick-up date, then your return date'}
        {clearDates}
      </p>
    )
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Reservation</span>
          <h1>Book your car</h1>
          <p>Pick your dates, see the price instantly, and send your request. No payment is taken online.</p>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 80 }}>
        <form className="booking-grid" onSubmit={submit} noValidate>
          <div className="card card-pad">
            <h3 style={{ fontSize: 18 }}>Trip details</h3>
            <div className="form-grid mt-4">
              <div className="field span-2">
                <label>Vehicle</label>
                <div className="car-stepper">
                  <button type="button" className="stepper-btn" onClick={() => stepCar(-1)} aria-label="Previous vehicle">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="stepper-car">
                    {car ? (
                      <>
                        <CarImage src={car.image} alt={`${car.year} ${car.name}`} />
                        <div className="stepper-info">
                          <strong>{car.year} {car.name}</strong>
                          <span>{car.color} · {formatCurrency(car.dailyRate)}/day</span>
                        </div>
                      </>
                    ) : (
                      <span className="stepper-empty">Use the arrows to browse vehicles</span>
                    )}
                  </div>
                  <button type="button" className="stepper-btn" onClick={() => stepCar(1)} aria-label="Next vehicle">
                    <ChevronRight size={20} />
                  </button>
                </div>
                <span className="stepper-count">
                  {carIndex >= 0 ? `${carIndex + 1} of ${available.length}` : `${available.length} vehicles`}
                </span>
                {errors.carId && <span className="form-error">{errors.carId}</span>}
              </div>

              <div className="field span-2">
                <label>Rental dates</label>
                {availabilityNote()}
                <AvailabilityCalendar
                  pickupDate={form.pickupDate}
                  returnDate={form.returnDate}
                  bookedDates={bookedDates}
                  minDate={today}
                  onChange={setDates}
                  disabled={!form.carId}
                />
                {!form.carId && <span className="form-help">Choose a vehicle to see its availability.</span>}
                <div className="date-summary">
                  <div>
                    <span>Pick-up</span>
                    <strong>{form.pickupDate ? formatDate(form.pickupDate) : '-'}</strong>
                  </div>
                  <div>
                    <span>Return</span>
                    <strong>{form.returnDate ? formatDate(form.returnDate) : '-'}</strong>
                  </div>
                  <div>
                    <span>Duration</span>
                    <strong>{days ? `${days} ${days === 1 ? 'day' : 'days'}` : '-'}</strong>
                  </div>
                </div>
                {(errors.pickupDate || errors.returnDate) && (
                  <span className="form-error">{errors.pickupDate || errors.returnDate}</span>
                )}
              </div>

            </div>

            <h3 style={{ fontSize: 18, marginTop: 32 }}>Your details</h3>
            <div className="form-grid mt-4">
              <div className="field span-2">
                <label htmlFor="customerName">Full name</label>
                <div className="input-icon">
                  <UserRound size={16} />
                  <input id="customerName" className="input" placeholder="Your name" value={form.customerName} onChange={set('customerName')} />
                </div>
                {errors.customerName && <span className="form-error">{errors.customerName}</span>}
              </div>

              <div className="field">
                <label htmlFor="customerPhone">Phone</label>
                <div className="input-icon">
                  <Phone size={16} />
                  <input id="customerPhone" className="input" placeholder="(242) 555-0100" value={form.customerPhone} onChange={set('customerPhone')} />
                </div>
                {errors.customerPhone && <span className="form-error">{errors.customerPhone}</span>}
              </div>

              <div className="field">
                <label htmlFor="customerEmail">Email (optional)</label>
                <div className="input-icon">
                  <Mail size={16} />
                  <input id="customerEmail" type="email" className="input" placeholder="you@example.com" value={form.customerEmail} onChange={set('customerEmail')} />
                </div>
                {errors.customerEmail && <span className="form-error">{errors.customerEmail}</span>}
              </div>

              <div className="field span-2">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea id="notes" className="textarea" placeholder="Flight number, arrival time, child seat, etc." value={form.notes} onChange={set('notes')} />
              </div>
            </div>
          </div>

          <aside className="booking-side card card-pad">
            <h3 style={{ fontSize: 18 }}>Your quote</h3>
            {car ? (
              <div className="summary-car mt-4">
                <CarImage src={car.image} alt={car.name} />
                <div>
                  <strong>{car.name}</strong>
                  <p className="muted small">{car.year} &middot; {car.color}</p>
                </div>
              </div>
            ) : (
              <p className="muted small mt-4">Select a vehicle to see pricing.</p>
            )}

            <div className="summary-lines">
              <div><span>Daily rate</span><span>{car ? formatCurrency(rate) : '-'}</span></div>
              <div><span>Rental ({days || 0} x {formatCurrency(rate)})</span><span>{formatCurrency(subtotal)}</span></div>
              <div><span>Refundable deposit</span><span>{formatCurrency(settings.deposit)}</span></div>
              <div className="total"><span>Due at pick-up</span><span className="gold-text">{formatCurrency(dueAtPickup)}</span></div>
            </div>

            <p className="form-help mt-4">
              Price updates as you pick dates. Deposit is returned when the vehicle comes back. Drivers must be {settings.minAge}+ with a valid license.
            </p>

            <button
              type="submit"
              className="btn btn-gold btn-lg"
              style={{ width: '100%', marginTop: 20 }}
              disabled={submitting || Boolean(car && days > 0 && conflicts.length)}
            >
              {submitting ? 'Sending...' : 'Send booking request'}
            </button>
            <Link to="/booking-status" className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 10 }}>
              Already booked? Check your status
            </Link>
          </aside>
        </form>
      </section>
    </>
  )
}
