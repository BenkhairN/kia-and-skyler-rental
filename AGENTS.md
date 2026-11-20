# Project workflow

- Never push or deploy without explicit user approval.
- Verification: `npm run test:payments`, `npm run build`, `npm run lint`. Existing lint and bundle-size warnings are non-blocking.
- PowerShell is the active shell. Use separate commands rather than Bash heredocs or `&&`.

# Local Stripe sandbox integration

- `npm run payments:dev` starts the loopback-only payment backend on port 8787. Vite proxies `/api/stripe-test` to it.
- Copy `.env.payments.example` to the gitignored `.env.payments.local` and configure values privately. Never print keys or use a VITE_ prefix for server credentials. Prefer a restricted Stripe sandbox key with the required Checkout permissions.
- Set `VITE_ENABLE_STRIPE_TEST_CHECKOUT=true` in `.env.local` to enable the localhost-only UI. Restart Vite after environment changes. The production build excludes the test UI.
- Run `stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired --forward-to http://127.0.0.1:8787/api/stripe-test/webhook` and privately save its signing secret in STRIPE_WEBHOOK_SECRET.
- `supabase/migrations/202611200001_stripe_test_payments.sql` is prepared but not applied. Obtain approval and inspect the target schema before applying it. Prefer an isolated Supabase development database containing the existing rental schema and synthetic bookings.
- Sandbox payments are tracked in stripe_test_payments and deliberately never change real bookings.paid. Local admin lists poll test state every 15 seconds when enabled.
- Active/paid sandbox checkouts lock financial, vehicle, date, status and real-paid edits to their booking; do not test against operational customer bookings. Expired/failed sessions release edit protection. Timed-out creation attempts require developer reconciliation with Stripe before retrying. Refund reconciliation is not implemented; use synthetic data only.
- Automated payment tests use a mocked database/Stripe checkout and real SDK-generated webhook signatures; they do not prove database migration or end-to-end sandbox operation. Those require private credentials, an approved migration, and webhook forwarding.
