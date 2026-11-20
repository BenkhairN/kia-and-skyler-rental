import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export function assertTestKey(key = '') {
  if (!/^(sk|rk)_test_/.test(key)) throw new Error('A Stripe sandbox/test key is required. Live keys are disabled.')
}

export function amountInCents(total, deposit) {
  const rental = Number(total)
  const security = Number(deposit)
  const cents = Math.round((rental + security) * 100)
  if (!Number.isFinite(rental) || !Number.isFinite(security) || rental < 0 || security < 0 || !Number.isSafeInteger(cents) || cents < 50) {
    throw new Error('Invalid booking amount.')
  }
  return cents
}

export function paymentState(event) {
  if (event.livemode || event.data.object.livemode) throw new Error('Live events are disabled.')
  const session = event.data.object
  if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
    return session.payment_status === 'paid' ? 'paid' : 'processing'
  }
  if (event.type === 'checkout.session.async_payment_failed') return 'failed'
  if (event.type === 'checkout.session.expired') return 'expired'
  return null
}

const must = (result) => {
  if (result.error) throw new Error('Payment storage is unavailable. Check the migration and server configuration.')
  return result.data
}

export function createPaymentServer({ stripe, db, origin, webhookSecret }) {
  const limits = new Map()
  const send = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify(body))
  }
  return createServer(async (req, res) => {
    try {
      const webhook = req.url === '/api/stripe-test/webhook'
      if (req.method !== 'POST') return send(res, 405, { error: 'POST required.' })
      if (!webhook && req.headers.origin !== origin) return send(res, 403, { error: 'Origin not allowed.' })
      if (!webhook) {
        const now = Date.now()
        for (const [key, value] of limits) if (now > value.until) limits.delete(key)
        const ip = req.socket.remoteAddress
        const bucket = limits.get(ip) || { count: 0, until: now + 60000 }
        limits.set(ip, bucket)
        if (++bucket.count > 60) return send(res, 429, { error: 'Too many requests. Please wait a minute.' })
      }
      const chunks = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > 65536) return send(res, 413, { error: 'Request too large.' })
        chunks.push(chunk)
      }
      const raw = Buffer.concat(chunks)
      if (webhook) {
        let event
        try {
          event = stripe.webhooks.constructEvent(raw, req.headers['stripe-signature'], webhookSecret)
        } catch {
          return send(res, 400, { error: 'Invalid webhook signature.' })
        }
        const state = paymentState(event)
        if (!state) return send(res, 200, { received: true })
        const session = event.data.object
        const reference = session.metadata?.booking_reference
        const attempt = session.metadata?.attempt_id
        if (!reference || !attempt) return send(res, 200, { received: true })
        const row = must(await db.from('stripe_test_payments').select('*').eq('reference', reference).eq('attempt_id', attempt).maybeSingle())
        if (!row) return send(res, 200, { received: true })
        if ((row.session_id && row.session_id !== session.id) || session.currency !== row.currency || session.amount_total !== row.amount) {
          return send(res, 400, { error: 'Payment does not match the stored booking amount.' })
        }
        const allowed = state === 'paid' ? ['creating', 'open', 'processing', 'failed', 'expired'] : ['creating', 'open', 'processing']
        must(await db.from('stripe_test_payments').update({ state, session_id: session.id }).eq('reference', reference).eq('attempt_id', attempt).in('state', allowed))
        return send(res, 200, { received: true })
      }
      if (!['/api/stripe-test/checkout', '/api/stripe-test/status'].includes(req.url)) return send(res, 404, { error: 'Not found.' })
      let input
      try { input = JSON.parse(raw.toString()) } catch { return send(res, 400, { error: 'Invalid request.' }) }
      if (typeof input.reference !== 'string' || input.reference.length > 100 || typeof input.phone !== 'string' || input.phone.length > 40 || input.phone.replace(/\D/g, '').length < 7) {
        return send(res, 400, { error: 'Enter your booking reference and phone number.' })
      }
      const matches = must(await db.rpc('lookup_booking', { p_reference: input.reference, p_phone: input.phone }))
      if (!matches?.length) return send(res, 404, { error: 'Booking not found.' })
      const booking = matches[0]
      if (req.url.endsWith('/status')) {
        const row = must(await db.from('stripe_test_payments').select('state').eq('reference', booking.reference).maybeSingle())
        return send(res, 200, { state: row?.state || null, test: true })
      }
      if (booking.status !== 'confirmed' || booking.paid) return send(res, 409, { error: 'Only confirmed, unpaid bookings can pay.' })
      const amount = amountInCents(booking.total, booking.deposit)
      const payment = must(await db.rpc('reserve_stripe_test_payment', { p_reference: booking.reference }))
      if (payment.amount !== amount) return send(res, 409, { error: 'Booking changed. Look it up again before paying.' })
      if (payment.state === 'paid') return send(res, 409, { error: 'This booking is already test-paid.' })
      if (payment.state === 'processing') return send(res, 409, { error: 'Payment is processing. Please wait.' })
      if (payment.session_id) {
        const session = await stripe.checkout.sessions.retrieve(payment.session_id)
        if (session.livemode) throw new Error('Live sessions are disabled.')
        if (session.status === 'open') return send(res, 200, { url: session.url })
        if (session.status === 'expired') {
          must(await db.from('stripe_test_payments').update({ state: 'expired' }).eq('attempt_id', payment.attempt_id).in('state', ['creating', 'open']))
          return send(res, 409, { error: 'Checkout expired. Click Pay again to start a new test.' })
        }
        return send(res, 409, { error: 'Checkout completed. Waiting for the payment notification.' })
      }
      const expiresAt = Math.floor(new Date(payment.created_at).getTime() / 1000) + 3600
      if (expiresAt <= Math.floor(Date.now() / 1000) + 1800) {
        return send(res, 409, { error: 'Checkout setup timed out. Ask the developer to reconcile this test attempt before retrying.' })
      }
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        integration_identifier: 'kia-skyler-test-qmzvbnrx',
        client_reference_id: booking.reference,
        metadata: { booking_reference: booking.reference, attempt_id: payment.attempt_id },
        line_items: [{ price_data: { currency: 'usd', unit_amount: payment.amount, product_data: { name: 'Car rental + refundable security deposit (TEST)' } }, quantity: 1 }],
        expires_at: expiresAt,
        success_url: `${origin}/booking-status?ref=${encodeURIComponent(booking.reference)}&stripe=returned`,
        cancel_url: `${origin}/booking-status?ref=${encodeURIComponent(booking.reference)}&stripe=cancelled`,
      }, { idempotencyKey: `rental-test-${payment.attempt_id}` })
      if (session.livemode || !session.url) throw new Error('Expected a sandbox Checkout Session.')
      must(await db.from('stripe_test_payments').update({ session_id: session.id, state: 'open' }).eq('attempt_id', payment.attempt_id).eq('state', 'creating'))
      return send(res, 200, { url: session.url })
    } catch {
      return send(res, 503, { error: 'Test payment service unavailable. Check server configuration, database migration and Stripe webhook forwarding.' })
    }
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assertTestKey(process.env.STRIPE_SECRET_KEY)
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_WEBHOOK_SECRET']
  for (const key of required) if (!process.env[key]) throw new Error(`${key} must be configured in the private server environment.`)
  const origin = process.env.PAYMENT_APP_ORIGIN || 'http://localhost:5173'
  if (!['http://localhost:5173', 'http://127.0.0.1:5173'].includes(origin)) throw new Error('This test server only supports localhost.')
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-10-28.endive' })
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  createPaymentServer({ stripe, db, origin, webhookSecret: process.env.STRIPE_WEBHOOK_SECRET }).listen(8787, '127.0.0.1', () => {
    console.log('Sandbox payments listening on http://127.0.0.1:8787. Live payments are disabled.')
  })
}
