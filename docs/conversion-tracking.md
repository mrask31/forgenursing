# Conversion tracking

Browser practice events use an anonymous PostHog ID until Supabase supplies a
signed-in user UUID. Identify joins that activity to server conversions. Logout
and account switching reset identity; no email/name is added by this integration.

## Events

- `trial_started`: the authenticated account was created within the last 24 hours,
  has an unexpired app trial, and is neither beta nor Stripe-subscribed. Timestamp
  is account creation, not login. This measures newly verified trial access; an
  account that never signs in within 24 hours is not captured. It does not backfill
  older accounts. Source: `server_verified`; unique `conversion_id`: `trial:<UUID>`.
- `subscription_payment_confirmed`: a signed live `invoice.payment_succeeded`
  event with paid status, positive amount, a subscription, and a mapped customer.
  Amount is in currency minor units. This is payment collection, not net revenue
  after refunds/fees. Initial subscription invoices are distinguished from
  renewals/prorations by `billing_reason` and `is_initial_subscription_invoice`.
  Unique `conversion_id`: `invoice:<Stripe invoice ID>`.

Count distinct users for payer conversion and unique `conversion_id` for invoice
counts/amounts, rather than raw deliveries. Payload UUIDs and timestamps stay
stable on retry. Browser/ad-blocking can still limit anonymous attribution.

## Delivery and operations

The existing PostHog public project key and ingestion host are reused server-side.
Payment delivery failures return a retryable failure only from the new invoice
analytics branch. Stripe and the existing webhook retry job can redeliver it.
Checkout/access processing is unchanged; analytics cannot charge or change access.
The trial endpoint authenticates with `getUser`, scopes its read to that user's
profile, accepts no user-supplied identity/status, and never writes access data.

After deploying, add `invoice.payment_succeeded` to the existing Stripe endpoint's
enabled events, preserving its four existing subscription/checkout events and API
version. No Stripe SDK/API-version upgrade is included in this analytics patch.

## Verification

45 focused tests passed (conversion, checkout validation, recovery access, demo
retry, retake recovery); TypeScript passed. Tests cover renewal separation, unpaid,
zero-dollar and sandbox exclusions, delivery failures, customer mapping races,
stable retry payloads, beta exclusion, and logout/account switching.

A real settled payment and a newly provisioned trial remain end-to-end checks;
fixtures are not evidence that money moved or a production trial was provisioned.
