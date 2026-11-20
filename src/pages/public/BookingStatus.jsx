import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Banknote, CalendarDays, Car, CheckCircle2, Clock, CreditCard, Hash, KeyRound, MapPin, Phone, Search, Undo2, UserRound, XCircle } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { supabase } from '../../lib/supabase'
import Badge from '../../components/ui/Badge'
import CarImage from '../../components/ui/CarImage'
import StripeTestPayment from '../../components/ui/StripeTestPayment'
import { daysBetween, formatCurrency, formatDate, todayISO } from '../../utils/format'

const steps = [
  { key: 'pending', label: 'Request received', icon: Clock, text: 'We have your request and will confirm shortly.' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, text: 'Your vehicle is reserved for your dates.' },
  { key: 'active', label: 'Picked up', icon: KeyRound, text: 'Enjoy the drive around Grand Bahama.' },
  { key: 'completed', label: 'Returned', icon: Undo2, text: 'Vehicle returned and deposit refunded.' },
]

const stepIndex = (status) => steps.findIndex((s) => s.key === status)

export default function BookingStatus() {
  const [params] = useSearchParams()
  const { settings } = useData()
  const [ref, setRef] = useState(params.get('ref') || '')
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [credentials, setCredentials] = useState(null)
  const [method, setMethod] = useState('online')
  const [testPaid, setTestPaid] = useState(false)

  const refresh = useCallback(async (creds) => {
    const { data, error: rpcError } = await supabase.rpc('lookup_booking', {
      p_reference: creds.ref,
      p_phone: creds.phone,
    })
    if (!rpcError && data?.length) setResult(data[0])
  }, [])

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('bookingLookup')
      if (!saved) return
      const creds = JSON.parse(saved)
      const refParam = params.get('ref')
      if (refParam) creds.ref = refParam
      if (!creds.ref || !creds.phone) return
      setRef(creds.ref)
      setPhone(creds.phone)
      setCredentials(creds)
      refresh(creds)
    } catch { /* empty */ }
  }, [params, refresh])

  useEffect(() => {
    if (!credentials) return undefined
    const tick = () => refresh(credentials)
    const interval = setInterval(tick, 15000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', tick)
    }
  }, [credentials, refresh])

  const lookup = async (e) => {
    e.preventDefault()
    const code = ref.trim()
    if (!code || !phone.trim()) {
      setError('Enter your booking reference and the phone number you booked with.')
      setResult(null)
      setCredentials(null)
      return
    }
    setBusy(true)
    const { data, error: rpcError } = await supabase.rpc('lookup_booking', {
      p_reference: code,
      p_phone: phone,
    })
    setBusy(false)
    const match = !rpcError && data?.length ? data[0] : null
    if (!match) {
      setError('We could not find a booking with that reference and phone number. Check the details or call us.')
      setResult(null)
      setCredentials(null)
      return
    }
    setError('')
    setResult(match)
    const creds = { ref: code, phone }
    setCredentials(creds)
    try { sessionStorage.setItem('bookingLookup', JSON.stringify(creds)) } catch { /* empty */ }
  }

  const onTestState = useCallback((s) => setTestPaid(s === 'paid'), [])
  const [choosing, setChoosing] = useState(false)

  const choosePickup = async () => {
    if (choosing || !credentials) return
    setChoosing(true)
    const { error: rpcError } = await supabase.rpc('choose_payment_method', {
      p_reference: credentials.ref,
      p_phone: credentials.phone,
      p_method: 'pickup',
    })
    setChoosing(false)
    if (rpcError) {
      setError(rpcError.message || 'Could not save your choice. Please try again.')
      return
    }
    setResult((r) => ({ ...r, payment_method: 'pickup' }))
    setError('')
  }

  const days = result ? daysBetween(result.pickup_date, result.return_date) : 0
  const effectiveStatus =
    result?.status === 'confirmed' && result.pickup_date <= todayISO() && result.return_date >= todayISO()
      ? 'active'
      : result?.status
  const cancelled = result?.status === 'cancelled'
  const chosenMethod = result?.payment_method

  useEffect(() => {
    if (chosenMethod) setMethod(chosenMethod)
  }, [chosenMethod])
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
                  <input id="ref" className="input" placeholder="A4F9C2E1B7" value={ref} onChange={(e) => setRef(e.target.value)} autoCapitalize="characters" />
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
              <button type="submit" className="btn btn-gold span-2" disabled={busy}>
                <Search size={16} />
                {busy ? 'Searching...' : 'Find my booking'}
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
                  {result.customer_name ? (
                    <>
                      <h2 style={{ fontSize: 26 }}>{result.customer_name}</h2>
                      <span className="muted" style={{ fontSize: 13, letterSpacing: '0.04em' }}>{result.reference}</span>
                    </>
                  ) : (
                    <>
                      <span className="eyebrow">Reference</span>
                      <h2 style={{ fontSize: 24, letterSpacing: '0.04em' }}>{result.reference}</h2>
                    </>
                  )}
                </div>
                <Badge status={effectiveStatus}>
                  {effectiveStatus === 'active' ? 'Picked up' : effectiveStatus[0].toUpperCase() + effectiveStatus.slice(1)}
                </Badge>
              </div>

              <div className="summary-car mt-4">
                <CarImage src={result.car_image} alt={result.car_name || 'Vehicle'} />
                <div>
                  <strong>{result.car_year} {result.car_name}</strong>
                  <p className="muted small">{result.car_color} · {result.car_category}</p>
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
                <li><CalendarDays size={18} /> {formatDate(result.pickup_date)} to {formatDate(result.return_date)} ({days} {days === 1 ? 'day' : 'days'})</li>
                {result.customer_name && <li><UserRound size={18} /> {result.customer_name}</li>}
                {result.pickup_location && <li><MapPin size={18} /> {result.pickup_location}</li>}
                <li><Car size={18} /> {formatCurrency(result.total)} rental + {formatCurrency(result.deposit ?? settings.deposit)} refundable deposit</li>
              </ul>

              {!cancelled && effectiveStatus !== 'pending' && (
                <div className="pay-card mt-4">
                  {result.paid || testPaid ? (
                    <div className="pay-received">
                      <span className="pay-received-icon"><CheckCircle2 size={22} /></span>
                      <div>
                        <strong>Payment received</strong>
                        <p className="muted small">
                          {result.paid
                            ? 'We have received your payment. Thank you!'
                            : 'Test payment received. Your real payment status is unchanged.'}
                        </p>
                      </div>
                      {testPaid && !result.paid && <span className="badge badge-warning">Test mode</span>}
                    </div>
                  ) : (
                    <>
                      <div className="pay-head"><strong>How would you like to pay?</strong></div>
                      <div className="pay-methods" role="radiogroup" aria-label="Payment method">
                        <button type="button" role="radio" aria-checked={method === 'online'} className={`pay-method ${method === 'online' ? 'active' : ''}`} onClick={() => setMethod('online')}>
                          <CreditCard size={20} />
                          <span><strong>Pay online now</strong><small>Secure card payment</small></span>
                        </button>
                        <button type="button" role="radio" aria-checked={method === 'pickup'} className={`pay-method ${method === 'pickup' ? 'active' : ''}`} onClick={() => setMethod('pickup')}>
                          <Banknote size={20} />
                          <span><strong>Pay at pick-up</strong><small>Cash, card or transfer</small></span>
                        </button>
                      </div>

                      {method === 'online' ? (
                        <div className="pay-body">
                          {import.meta.env.DEV && import.meta.env.VITE_ENABLE_STRIPE_TEST_CHECKOUT === 'true' && credentials && result.status === 'confirmed' ? (
                            <StripeTestPayment key={`${credentials.ref}:${credentials.phone}`} booking={result} credentials={credentials} onState={onTestState} />
                          ) : (
                            <p className="muted small">Online card payment is coming soon. Choose pay at pick-up, or contact us to pay by bank transfer.</p>
                          )}
                        </div>
                      ) : (
                        <div className="pay-body">
                          <p className="pay-amount">
                            Pay <strong>{formatCurrency((result.total || 0) + (result.deposit ?? settings.deposit))} {settings.bankCurrency}</strong> at pick-up
                          </p>
                          <p className="muted small">Cash or card on arrival — the deposit is returned when the car comes back. Just bring your license.</p>
                          {chosenMethod === 'pickup' ? (
                            <p className="pay-choice-note"><CheckCircle2 size={15} /> We'll see you at pick-up.</p>
                          ) : (
                            <button type="button" className="btn btn-gold" onClick={choosePickup} disabled={choosing}>
                              <Banknote size={16} />
                              {choosing ? 'Saving…' : "I'll pay at pick-up"}
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

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
