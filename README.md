# Snail Racing Dashboard

Small full-stack application for simulated snail-racing statistics and balance
top-ups through SnailPay. The project is being built in reviewed milestones.

## Current milestone: local persistence

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
- a tested `storageService` for users, sessions, balances and transactions.

Registration, authentication, dashboard data and SnailPay behavior are
intentionally not implemented yet.

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
