# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Investment Decision OS** — A Next.js 14 web app for investors to record, track, and review trading decisions with discipline. Users log investment theses, track P&L, and complete mandatory post-mortems when closing positions.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm start          # Start production server
npm test           # Run Jest tests
npm run test:watch # Jest watch mode
npm run lint       # ESLint
```

To run a single test file:
```bash
npx jest src/__tests__/pnl.test.ts
```

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in Firebase credentials:
- `NEXT_PUBLIC_FIREBASE_*` — Firebase project config (required)
- `ALPHA_VANTAGE_API_KEY` — Stock quote API (optional; defaults to `"demo"` which only works for MSFT)

Alpha Vantage free tier: 25 requests/day. The `/api/prices` route caches quotes in-memory for 15 minutes to stay within limits.

## Architecture

### Data Flow

1. **AuthContext** (`src/contexts/AuthContext.tsx`) — wraps the app, exposes `useAuth()` hook with Firebase auth state
2. **Firestore hooks** (`src/hooks/`) — `useDecisions` and `useNotes` use `onSnapshot` for real-time listeners; components subscribe to these
3. **firestore.ts** (`src/lib/firestore.ts`) — all CRUD operations + P&L math as pure functions
4. **API route** (`src/app/api/prices/route.ts`) — serverless proxy to Alpha Vantage with 15-min in-memory cache

### Route Structure

- `/` — redirects based on auth state
- `/auth` — sign-in / sign-up
- `/(app)/decisions` — decision list (Active / Closed / Archived tabs)
- `/(app)/decisions/new` — create decision (8 required fields block save)
- `/(app)/decisions/[id]` — view/edit + trigger sell flow
- `/(app)/decisions/[id]/edit` — edit form
- `/(app)/tracker` — P&L tracker, holdings, alerts

### Key Patterns

- **Forced modal on sell**: closing a position triggers `ReviewModal` (3-step post-mortem) before status updates
- **Required fields** (8): ticker, entryPrice, entryDate, thesis, positionSize, positionUnit, stopLoss, targetPrice — UI blocks save if any are empty
- **P&L calculations** are pure functions in `firestore.ts`, tested in `src/__tests__/pnl.test.ts`
- Route group `(app)/` applies auth-guarded layout; `layout.tsx` wraps with `AuthProvider` + `Toaster`

### Firestore Schema

```
users/{userId}/
  decisions/{decisionId}      # ticker, status ("active"|"closed"|"archived"), thesis, prices, etc.
    reviews/{reviewId}        # exitPrice, outcome, thesisValidated, lessonsLearned
  notes/{noteId}              # content, optional decisionId link
```

Security rules in `firestore.rules` restrict all reads/writes to `users/{userId}/**` matching the authenticated UID.

## Design System

Tailwind config defines a dark trading theme — use these semantic tokens, not raw colors:

| Token | Purpose |
|-------|---------|
| `surface` | Dark page background |
| `raised` / `overlay` | Card / modal backgrounds |
| `border` | Dividers |
| `brand` | Purple accent |
| `gain` | Positive P&L (green) |
| `loss` | Negative P&L (red) |
| `warn` | Alert/warning (amber) |

Path alias `@/*` maps to `src/*`.
