# tb-wallet-api

NestJS API for **wallet service**: balance, transactions, orders (PSP), and mock auth/PSP.

## Features

- **Swagger** – API docs at `GET /api` (Bearer auth supported)
- **MySQL** – TypeORM, migrations in `db/migrations`
- **Auth** – Mock `tb-backend-service`: verify token, get user (replace with real HTTP client later)
- **Wallet** – Balance check (checkout flow), debit-for-booking
- **Transactions** – Logs per user (credit/debit with reference_type and reference_id)
- **Orders** – Create order with **mocked PSP** (token + redirect_url) or **PayU Hosted Checkout**; confirm success to credit wallet
- **Generic schema** – `payment_providers` table for swapping mock vs real gateway (e.g. `type: 'mock'` or `type: 'payu'`)

## Installation

**Requirements:** Node.js **20.0.0 or higher** (`package.json` → `engines.node`: `>=20.0.0`). Use **npm** as the package manager. The runtime (e.g. Hostinger) must use Node 20+ so the engine field matches the environment. Dependencies such as `glob`, `jackspeak`, and `lru-cache` (used by Nest CLI, ESLint, Jest) require Node 20; they are not used in application source code.

```bash
npm install
```

## Configuration

Copy env example and set your MySQL credentials:

```bash
cp .env.example .env
```

Edit `.env`:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` – MySQL
- `SKIP_DB=true` – run without DB (health/Swagger only)
- `PORT` – API port (default `3000`)

## Database

```bash
npm run db:create    # create DB if missing
npm run migration:run
```

## Running the app

```bash
npm run start:dev
```

- **http://localhost:3000/api** – Swagger UI

## Deployment (Hostinger / Node hosting)

After building (`npm run build`), the compiled entry file is **`dist/src/main.js`** (Nest outputs under `dist/src/`). In your host’s Node.js settings set:

- **Entry File (or Start File):** `dist/src/main.js`
- **Start command** (if used instead): `node dist/src/main.js` or `npm run start:prod`

The app directory must be the project root (where `package.json` and `dist/` live).

## Mock auth (tb-backend-service)

Use **Bearer token** in `Authorization` header. Mock accepts:

- `mock-token-1` → user `user-ext-1`, user1@example.com
- `mock-token-2` → user `user-ext-2`, user2@example.com
- `mock-admin-token` → admin user (use for approve/reject credit requests)

Replace `TbBackendService` with HTTP call to real `tb-backend-service` when ready.

## Wallet & checkout flow

| Method | Path | Description |
|--------|------|-------------|
| GET | `/wallet/balance` | Check balance (checkout step 2–3) |
| POST | `/wallet/debit-for-booking` | Debit on booking success (step 8) |
| GET | `/transactions` | Transaction logs per user |
| POST | `/orders` | Create order; returns `psp_token`, `redirect_url` (mock) or `redirect_url` + `payment_params` (PayU) |
| PATCH | `/orders/:id/confirm` | Confirm order success → credit wallet |
| POST | `/orders/payu/success` | **PayU callback** (surl) – do not call directly |
| POST | `/orders/payu/failure` | **PayU callback** (furl) – do not call directly |
| POST | `/wallet/credit-requests` | Request credit (goes to approval flow) |
| GET | `/wallet/credit-requests` | List my credit requests |
| PATCH | `/admin/credit-requests/:id/approve` | **Admin** – approve credit → wallet credited, transaction logged |
| PATCH | `/admin/credit-requests/:id/reject` | **Admin** – reject credit request |
| GET | `/admin/credit-requests` | **Admin** – list all credit requests (optional ?status= & pagination) |
| GET | `/admin/credit-requests/:id` | **Admin** – get credit request details by ID (includes user) |
| GET | `/admin/credit-requests/:id/logs` | **Admin** – log entries for a credit request |

Amounts are in **smallest unit** (e.g. paise): `amount_cents`, `balance_cents`.

## PayU Hosted Checkout

When the selected payment provider has `type: 'payu'` and PayU env vars are set, creating an order returns:

- `redirect_url` – PayU payment page URL (e.g. `https://test.payu.in/_payment`)
- `payment_params` – Form fields to POST to that URL (key, txnid, amount, hash, surl, furl, etc.)

**Flow:** Frontend builds a form with `action=redirect_url` and inputs from `payment_params`, then POSTs (or redirects the user) to PayU. After payment, PayU POSTs to your **surl** (success) or **furl** (failure); this API implements those at `POST /orders/payu/success` and `POST /orders/payu/failure`. Hash is verified, order status is updated, and the user is redirected to `PAYU_SUCCESS_REDIRECT_URL` or `PAYU_FAILURE_REDIRECT_URL`.

**Required env:** `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `PAYU_SUCCESS_URL`, `PAYU_FAILURE_URL` (full URLs to this API’s callback routes), and optionally `PAYU_SUCCESS_REDIRECT_URL`, `PAYU_FAILURE_REDIRECT_URL` (frontend URLs). See `.env.example`.

**Provider:** Add a row in `payment_providers` with `type: 'payu'` and `is_active: true`, and pass its `id` as `provider_id` when creating the order (or set PayU as default in your app logic).

## Withdrawal

Planned: admin-approval flow for withdrawal requests (similar to credit requests). Not yet implemented.

## License

UNLICENSED
