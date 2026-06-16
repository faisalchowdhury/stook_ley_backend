# Stook Ley — Backend

Node + Express + TypeScript + MongoDB (Mongoose).

## Stripe Payments (Checkout, hosted)

Sells one fixed digital product via Stripe Checkout. The **webhook is the source
of truth** for a paid order — the browser redirect alone never marks an order paid.

### Environment variables

Add these to `.env` (see `.env.sample`):

| Var | Example | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Server-side only — never expose to the frontend. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From the Stripe CLI / dashboard. |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin. Used for redirect URLs and CORS. Must point at the React frontend so Stripe redirects land on `/payment/success` and `/payment/cancel`. |
| `PRODUCT_PRICE_ID` | `price_...` | Stripe Price id of the product being sold. |

### 1. Create the product + price

In the [Stripe Dashboard](https://dashboard.stripe.com/test/products): create a
Product, add a one-time Price, then copy the Price id (`price_...`) into
`PRODUCT_PRICE_ID`. (You can also create it via a one-off script using
`stripe.products.create` + `stripe.prices.create`.)

### 2. Run the webhook listener locally

The server runs on **port 8080** (see `src/config/index.ts`). Forward Stripe
events to the local webhook route:

```bash
stripe listen --forward-to localhost:8080/api/payments/webhook
```

The CLI prints a signing secret (`whsec_...`) — copy it into `STRIPE_WEBHOOK_SECRET`
and restart the server.

### 3. Test card

Use Stripe's test card on the hosted Checkout page:

```
4242 4242 4242 4242   any future expiry   any CVC   any ZIP
```

### Endpoints (mounted under `/api/payments`)

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `POST` | `/api/payments/create-checkout-session` | `{ productId?, quantity?, customerEmail? }` | `{ url, sessionId }` |
| `POST` | `/api/payments/webhook` | raw Stripe event (server-to-server) | `200 { received: true }`, `400` on bad signature |
| `GET` | `/api/payments/status/:sessionId` | — | `{ status, amountTotal, currency, customerEmail, productName }`, `404` if not found |

The webhook handles `checkout.session.completed` (→ `paid`),
`checkout.session.expired` (→ `expired`), and `payment_intent.payment_failed`
(→ `failed`). It is idempotent — redelivery of the same event is safe.

> The webhook route is registered with `express.raw()` **before** the global
> `express.json()` parser (in `src/app.ts`) so the raw body is available for
> signature verification.
