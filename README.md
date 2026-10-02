# Snail Racing Dashboard

Small full-stack application for simulated snail-racing statistics and balance
top-ups through SnailPay. The project is being built in reviewed milestones.

## Current milestone: SnailPay backend

The technical foundation now includes explicit domain contracts and a single
browser-persistence boundary:

- React, TypeScript and Vite frontend;
- React Router and Recharts installed for upcoming modules;
- Express and TypeScript backend;
- Vitest, React Testing Library and Supertest configured;
- strict TypeScript configuration for both workspaces;
- a minimal UI shell and API health endpoint;
- typed user and session models;
- the typed SnailPay request and response contract;
- a tested `storageService` for users, sessions, balances and transactions;
- an accessible registration form with validation and duplicate-email handling;
- credential verification through a responsive login form;
- session creation, restoration and logout through a shared authentication
  context;
- a reusable `ProtectedRoute` that redirects unauthenticated visitors to login;
- a protected, responsive dashboard shell with account balance and logout;
- a stable six-snail, six-race dataset with betting totals for analytics;
- accessible donut and bar charts powered by the deterministic dataset;
- a typed `POST /api/snailpay/charge` endpoint with reproducible approval,
  rejection, validation, system-error and timeout responses.

The SnailPay decision logic now lives exclusively in Express. The dashboard
payment action remains disabled until the frontend integration module is
introduced.

### Local password handling

Registration derives a password hash with PBKDF2-SHA-256, a random 16-byte
salt and 100,000 iterations before saving the user. The original password is
never written to `localStorage`.

This is defense-in-depth for the exercise, not production authentication. The
entire account system still runs in the browser, so a real application would
authenticate and store password hashes on a trusted server.

The login module verifies the stored PBKDF2 value without exposing whether an
email or password was incorrect. A successful login stores only the user ID
and authentication flag in the session. `AuthProvider` restores that user on
page load, while logout removes only the session and preserves registration
data.

### Storage keys

Only `storageService` reads or writes these keys:

| Key | Stored value |
| --- | --- |
| `snail-racing:user` | Registered user, password hash and balance |
| `snail-racing:session` | Active local session |
| `snail-racing:transactions` | Approved balance transactions |

## Requirements

- Node.js 22.12 or later
- npm 10 or later

## Installation

From the repository root:

```bash
npm install
```

## Development

Run both applications:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:3000/api/health`
- SnailPay charge: `http://localhost:3000/api/snailpay/charge`

They can also be started independently with `npm run dev -w frontend` and
`npm run dev -w backend`.

## Verification

```bash
npm test
npm run typecheck
npm run build
```

## SnailPay scenarios

All requests also require a non-empty cardholder name and payer ID, a valid
email, and an amount greater than zero.

| Scenario | Card | Exp | CVV | Expected |
| --- | --- | --- | --- | --- |
| Approved | `1234123412341234` | `12/26` | `543` | HTTP 201, `approved` |
| Rejected | `4000000000000002` | `12/26` | `543` | HTTP 200, `card_declined` |
| System error | `5000000000000000` | `12/26` | `543` | HTTP 500, `internal_error` |
| Timeout | `9999999999999999` | `12/26` | `543` | Delayed HTTP 504, `timeout` |

Example approved request:

```bash
curl --request POST http://localhost:3000/api/snailpay/charge \
  --header 'Content-Type: application/json' \
  --data '{"cardNumber":"1234123412341234","expirationDate":"12/26","cvv":"543","fullName":"Ada Dashboard","amount":500,"payerId":"user-1","payerEmail":"ada@example.com"}'
```

## Technical decisions

- Express owns every payment decision; the frontend will only consume the
  result.
- Every outcome uses the same typed response shape so client error handling is
  predictable.
- The mock echoes `card_number` and `cvv` only because the requested exercise
  contract includes them. A production payment API must never return or log a
  CVV and should expose only a masked card number.
- The timeout card waits two seconds intentionally, allowing the frontend to
  demonstrate client-side cancellation in the next module.
