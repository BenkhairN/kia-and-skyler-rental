import assert from 'node:assert/strict'
import { test } from 'node:test'
import Stripe from 'stripe'
import { assertTestKey, amountInCents, paymentState, createPaymentServer } from './stripe-payments.mjs'

const event = (type, status = 'paid', livemode = false) => ({ type, livemode, data: { object: { payment_status: status, livemode } } })

test('only sandbox keys are accepted', () => {
  assertTestKey('rk_test_example')
  assertTestKey('sk_test_example')
  for (const key of ['sk_live_example', 'rk_live_example', '', 'pk_test_example']) assert.throws(() => assertTestKey(key))
})

test('rental and refundable deposit use integer USD cents', () => {
  assert.equal(amountInCents('140.00', '100.00'), 24000)
  assert.equal(amountInCents(0.1, 0.9), 100)
})

test('invalid amounts cannot create checkout', () => {
  for (const args of [[-1, 100], [100, -1], [NaN, 100], [0, 0], [Infinity, 1]]) assert.throws(() => amountInCents(...args))
})

test('webhooks distinguish processing, paid, failed and expired', () => {
  assert.equal(paymentState(event('checkout.session.completed', 'unpaid')), 'processing')
  assert.equal(paymentState(event('checkout.session.completed')), 'paid')
  assert.equal(paymentState(event('checkout.session.async_payment_succeeded')), 'paid')
  assert.equal(paymentState(event('checkout.session.async_payment_failed', 'unpaid')), 'failed')
  assert.equal(paymentState(event('checkout.session.expired', 'unpaid')), 'expired')
  assert.equal(paymentState(event('customer.created')), null)
  assert.throws(() => paymentState(event('checkout.session.completed', 'paid', true)))
})

function fixture() {
  let payment = null
  let creates = 0
  const booking = { reference: 'BK-TEST', status: 'confirmed', paid: false, total: 140, deposit: 100 }
  const db = {
    rpc: async (name, params) => {
      if (name === 'lookup_booking') return { data: params.p_phone === '1234567890' ? [booking] : [] }
      payment ||= { reference: booking.reference, attempt_id: 'attempt-1', amount: 24000, currency: 'usd', state: 'creating', session_id: null, created_at: new Date().toISOString() }
      return { data: { ...payment } }
    },
    from: () => {
      let patch
      const filters = []
      const result = () => {
        const matched = payment && filters.every(([key, values]) => values.includes(payment[key]))
        if (matched && patch) Object.assign(payment, patch)
        return { data: matched ? { ...payment } : null }
      }
      const query = {
        select: () => query,
        update: (value) => { patch = value; return query },
        eq: (key, value) => { filters.push([key, [value]]); return query },
        in: (key, values) => { filters.push([key, values]); return query },
        maybeSingle: async () => result(),
        then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject),
      }
      return query
    },
  }
  const stripe = new Stripe('sk_test_example')
  stripe.checkout.sessions.create = async () => {
    creates++
    return { id: 'cs_test_example', livemode: false, url: 'https://checkout.stripe.com/c/pay/cs_test_example' }
  }
  stripe.checkout.sessions.retrieve = async () => ({ status: 'open', livemode: false, url: 'https://checkout.stripe.com/c/pay/cs_test_example' })
  return { stripe, db, booking, payment: () => payment, creates: () => creates }
}

async function withServer(t, run) {
  const f = fixture()
  const origin = 'http://localhost:5173'
  const secret = 'whsec_test_fixture'
  const server = createPaymentServer({ ...f, origin, webhookSecret: secret })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => { server.closeAllConnections(); server.close() })
  const base = `http://127.0.0.1:${server.address().port}`
  const post = (path, data, headers = {}) => fetch(`${base}/api/stripe-test/${path}`, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data),
  })
  await run({ ...f, post, secret })
}

const credentials = { reference: 'BK-TEST', phone: '1234567890' }

test('wrong credentials, unconfirmed and real-paid bookings are denied', async (t) => withServer(t, async ({ post, booking, creates }) => {
  assert.equal((await post('checkout', { ...credentials, phone: '9999999999' })).status, 404)
  booking.status = 'pending'
  assert.equal((await post('checkout', credentials)).status, 409)
  booking.status = 'confirmed'
  booking.paid = true
  assert.equal((await post('checkout', credentials)).status, 409)
  assert.equal(creates(), 0)
}))

test('checkout ignores browser amounts and reuses the existing session', async (t) => withServer(t, async ({ post, payment, creates }) => {
  assert.equal((await post('checkout', { ...credentials, amount: 1 })).status, 200)
  assert.equal(payment().amount, 24000)
  assert.equal((await post('checkout', credentials)).status, 200)
  assert.equal(creates(), 1)
  assert.equal(payment().state, 'open')
}))

test('webhook signatures are mandatory', async (t) => withServer(t, async ({ post }) => {
  assert.equal((await post('webhook', event('checkout.session.completed'))).status, 400)
}))

test('verified webhook records test-paid, tolerates duplicates and never marks real payment paid', async (t) => withServer(t, async ({ post, stripe, secret, payment, booking }) => {
  await post('checkout', credentials)
  const payload = event('checkout.session.completed')
  Object.assign(payload.data.object, { id: 'cs_test_example', amount_total: 24000, currency: 'usd', metadata: { booking_reference: 'BK-TEST', attempt_id: 'attempt-1' } })
  const signed = () => ({ 'stripe-signature': stripe.webhooks.generateTestHeaderString({ payload: JSON.stringify(payload), secret }) })
  assert.equal((await post('webhook', payload, signed())).status, 200)
  assert.equal((await post('webhook', payload, signed())).status, 200)
  payload.type = 'checkout.session.expired'
  assert.equal((await post('webhook', payload, signed())).status, 200)
  assert.equal(payment().state, 'paid')
  assert.equal(booking.paid, false)
  assert.equal((await post('checkout', credentials)).status, 409)
}))

test('signed webhook with incorrect amount does not mark paid', async (t) => withServer(t, async ({ post, stripe, secret, payment }) => {
  await post('checkout', credentials)
  const payload = event('checkout.session.completed')
  Object.assign(payload.data.object, { id: 'cs_test_example', amount_total: 1, currency: 'usd', metadata: { booking_reference: 'BK-TEST', attempt_id: 'attempt-1' } })
  const signature = stripe.webhooks.generateTestHeaderString({ payload: JSON.stringify(payload), secret })
  assert.equal((await post('webhook', payload, { 'stripe-signature': signature })).status, 400)
  assert.equal(payment().state, 'open')
}))

test('cross-origin checkout is denied', async (t) => withServer(t, async ({ post }) => {
  assert.equal((await post('checkout', credentials, { Origin: 'https://untrusted.example' })).status, 403)
}))
