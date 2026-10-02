# Snail Racing Dashboard

Small full-stack application for simulated snail-racing statistics and balance
top-ups through SnailPay. The project is being built in reviewed milestones.

## Current milestone: dashboard base

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
- a protected, responsive dashboard shell with account balance and logout.

Simulated racing data, charts and SnailPay behavior are intentionally not
implemented yet. Their dashboard areas use explicit empty or disabled states
until those modules are introduced.

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

They can also be started independently with `npm run dev -w frontend` and
`npm run dev -w backend`.

## Verification

```bash
npm test
npm run typecheck
npm run build
```
