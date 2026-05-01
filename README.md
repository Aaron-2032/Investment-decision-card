# Investment Decision OS

A minimalist, dark-themed web app that helps investors **record, track and review** every trading and investment decision with discipline.

---

## Features

| Page | Description |
|------|-------------|
| **Decision Card** | Create / edit decisions with 8 required fields; save is blocked until all are filled |
| **Decision List** | Browse Active / Closed / Archived decisions with full-text search |
| **Result Tracker** | Live P&L table, portfolio totals, stop-loss breach alerts, target-hit flags |
| **Review Flow** | 3-step forced modal triggered on every sell event: sell details → post-mortem → summary |
| **Quick Note** | Floating button on every data page to capture ad-hoc notes, optionally linked to a Decision Card |

---

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (custom dark trading theme)
- **Firebase** — Firestore (NoSQL) + Authentication (Email/Password + Google OAuth)
- **Alpha Vantage** — serverless `/api/prices` route to fetch daily close prices
- **react-hot-toast** — toast notifications
- **Jest + Testing Library** — unit tests for pure functions

---

## Firestore Schema

```
users/{userId}
  ├── decisions/{decisionId}        ← Decision Card
  │     ├── ticker          string  (required)
  │     ├── companyName     string
  │     ├── entryPrice      number  (required)
  │     ├── entryDate       Timestamp (required)
  │     ├── thesis          string  (required)
  │     ├── positionSize    number  (required)
  │     ├── positionUnit    "dollars" | "shares" (required)
  │     ├── stopLoss        number  (required)
  │     ├── targetPrice     number  (required)
  │     ├── direction       "long" | "short"
  │     ├── sector          string
  │     ├── tags            string[]
  │     ├── notes           string
  │     ├── status          "active" | "closed" | "archived"
  │     ├── exitPrice       number | null
  │     ├── exitDate        Timestamp | null
  │     ├── currentPrice    number | null
  │     ├── lastPriceFetch  Timestamp | null
  │     ├── createdAt       Timestamp
  │     ├── updatedAt       Timestamp
  │     │
  │     └── reviews/{reviewId}      ← Post-mortem Review
  │           ├── exitPrice         number
  │           ├── exitDate          Timestamp
  │           ├── outcome           "win" | "loss" | "breakeven"
  │           ├── thesisValidated   boolean
  │           ├── followedPlan      boolean
  │           ├── emotionalState    string
  │           ├── whatWentRight     string
  │           ├── whatWentWrong     string
  │           ├── lessonsLearned    string
  │           ├── rating            number (1–5)
  │           ├── createdAt         Timestamp
  │           └── updatedAt         Timestamp
  │
  └── notes/{noteId}                ← Quick Notes (global, linked optionally)
        ├── content       string
        ├── decisionId    string | null
        ├── createdAt     Timestamp
        └── updatedAt     Timestamp
```

---

## API Endpoints

### `GET /api/prices?ticker=AAPL`

Serverless route that proxies **Alpha Vantage GLOBAL_QUOTE**.

| Query param | Type   | Required | Description              |
|-------------|--------|----------|--------------------------|
| `ticker`    | string | yes      | Stock/ETF ticker symbol  |

**Response**
```json
{ "ticker": "AAPL", "price": 189.30 }
```
or on error:
```json
{ "ticker": "XYZ", "price": null, "error": "Ticker not found or API rate limit reached" }
```

Responses are cached in-memory for 15 minutes per ticker to stay within the free-tier limit (25 requests/day).

---

## Local Development

### 1. Prerequisites

- Node.js ≥ 18
- A Firebase project with Firestore and Authentication enabled
- (Optional) Alpha Vantage free API key

### 2. Clone & install

```bash
git clone <your-repo>
cd investment-decision-os
npm install
```

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Firebase credentials and (optionally) your Alpha Vantage key:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

ALPHA_VANTAGE_API_KEY=...   # omit to use demo key (MSFT only)
```

### 4. Firebase setup

In the Firebase console:

1. **Authentication** → Enable **Email/Password** and **Google** providers.
2. **Firestore** → Create database in **production mode**.
3. Add these **Security Rules** (paste into Firestore Rules tab):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Tests

```bash
npm test
```

---

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts. When asked for environment variables, add all `NEXT_PUBLIC_FIREBASE_*` vars and `ALPHA_VANTAGE_API_KEY`.

### Option B — GitHub integration

1. Push to GitHub.
2. In Vercel, click **Add New Project** → import your repo.
3. Under **Environment Variables**, add all vars from `.env.local`.
4. Click **Deploy**.

---

## Deploy to Netlify

```bash
npm run build
# then drag-and-drop the .next folder to Netlify, or:
netlify deploy --prod --dir=.next
```

Add environment variables in the Netlify dashboard under **Site settings → Environment variables**.

---

## Acceptance Criteria Checklist

- [x] Create / edit Decision Card — save **blocked** when any required field is empty
- [x] Auto-calc P&L from stored entry price and latest close (via `/api/prices`)
- [x] Forced 3-step review modal whenever a sell is recorded
- [x] Floating Quick Note button on all data pages, notes linkable to Decision Cards
- [x] Decision List with Active / Closed / Archived tabs
- [x] Result Tracker with unrealised P&L, realised P&L, win rate, stop-loss alerts
- [x] Email & Google authentication

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                  ← Auth-guarded layout
│   │   ├── decisions/          ← Page B: Decision List
│   │   │   ├── new/            ← Page A: Create form
│   │   │   └── [id]/           ← Page A: View / edit + sell trigger
│   │   └── tracker/            ← Page C: Result Tracker
│   ├── api/prices/             ← Serverless price route
│   ├── auth/                   ← Sign-in / sign-up page
│   └── layout.tsx
├── components/
│   ├── decisions/              ← DecisionForm, DecisionCardView, DecisionListItem
│   ├── layout/                 ← Navbar, QuickNoteButton
│   ├── review/                 ← ReviewModal (Page D)
│   └── ui/                     ← Button, Modal, Badge, Input, PnLCell
├── contexts/AuthContext.tsx
├── hooks/                      ← useDecisions, useNotes
├── lib/
│   ├── types.ts                ← Firestore schema types
│   ├── firebase.ts             ← Firebase init
│   ├── firestore.ts            ← CRUD helpers + PnL math
│   └── utils.ts                ← Formatting helpers
└── __tests__/                  ← Unit tests
```
