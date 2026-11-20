import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function StripeTestPayment({ booking, credentials, onState }) {
  const [state, setState] = useState(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const body = JSON.stringify({ reference: credentials.ref, phone: credentials.phone })

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const response = await fetch('/api/stripe-test/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Test payment service unavailable.')
        if (active) {
          setState(data.state)
          setReady(true)
          setError('')
          onState?.(data.state)
        }
      } catch {
        if (active) {
          setReady(false)
          setError('Test payment service is not ready. Bank transfer is still available.')
        }
      }
    }
    refresh()
    const timer = setInterval(refresh, 15000)
    return () => { active = false; clearInterval(timer) }
  }, [body, onState])

  const checkout = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      try {
        await supabase.rpc('choose_payment_method', { p_reference: credentials.ref, p_phone: credentials.phone, p_method: 'online' })
      } catch { /* method tracking is best-effort */ }
      const response = await fetch('/api/stripe-test/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not start test checkout.')
      const url = new URL(data.url)
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Invalid checkout destination.')
      window.location.assign(url.href)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="stripe-pay">
      {state === 'paid' ? (
        <p className="gold-text small"><CreditCard size={14} /> Test payment received. Your real payment status is unchanged.</p>
      ) : (
        <button type="button" className="btn btn-gold" onClick={checkout} disabled={!ready || busy || state === 'processing' || booking.status !== 'confirmed' || booking.paid}>
          <CreditCard size={16} />
          {state === 'processing' ? 'Test payment processing…' : busy ? 'Opening secure checkout…' : 'Pay by card — Test mode'}
        </button>
      )}
      {state !== 'paid' && <p className="muted small">Sandbox only · USD · No real money is charged.</p>}
      {error && <p className="form-error" role="status">{error}</p>}
    </div>
  )
}
