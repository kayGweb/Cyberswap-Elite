# AI.md — Technical Reference for CryptoSwap Elite

This document is for AI assistants interacting with the codebase. It describes the architecture, data flow, file responsibilities, and conventions used in this project.

## Architecture Overview

CryptoSwap Elite is a full-stack cryptocurrency exchange application built on:

- **Backend:** Express.js server (`server.ts`) running on port 3000
- **Frontend:** React 19 SPA with Vite, Tailwind CSS v4, and Framer Motion
- **Database:** Firebase Firestore (named database: `ai-studio-9c8e4c1d-7403-4356-96c6-5551c9c2c57c`)
- **Auth:** Firebase Authentication (Google provider) + mock/sandbox auth mode
- **Exchange API:** Changelly Exchange API v2 (JSON-RPC over HTTPS, RSA-SHA256 signed)

In development, Express embeds Vite as middleware (SPA middleware mode). In production, Express serves the built `dist/` folder statically.

## File Map

```
├── server.ts                    # Express backend: Changelly proxy + Vite middleware
├── vite.config.ts               # Vite config: React plugin, Tailwind plugin, HMR toggle
├── tsconfig.json                # TypeScript config (ES2022, bundler resolution, JSX)
├── package.json                 # Dependencies and scripts
├── index.html                   # Vite HTML entry point
├── firebase-applet-config.json  # Firebase project config (loaded by src/lib/firebase.ts)
├── firestore.rules              # Firestore security rules
├── .env                         # Runtime secrets (CHANGELLY_API_SECRET)
├── .env.example                 # Template for required env vars
├── src/
│   ├── main.tsx                 # React DOM entry point
│   ├── index.css                # Global styles / Tailwind imports
│   ├── vite-env.d.ts            # Vite client type declarations (ImportMeta.env)
│   ├── App.tsx                  # Root component: auth gate, tab router, layout
│   ├── lib/
│   │   └── firebase.ts          # Firebase init + mock Firestore layer
│   ├── services/
│   │   └── changellyService.ts  # Typed client for the /api/changelly proxy
│   └── components/
│       ├── FirebaseProvider.tsx  # Auth context: user state, profile, mock login
│       ├── Navigation.tsx       # Sidebar nav (Exchange, History, KYC, Favorites)
│       ├── SwapInterface.tsx    # Swap form: currency select, estimate, execute
│       ├── CurrencySelector.tsx # Dropdown search/select for currencies
│       ├── TransactionHistory.tsx # Real-time transaction list (Firestore onSnapshot)
│       ├── KycForm.tsx          # Basic KYC form (sets isKycVerified on profile)
│       └── FavoriteCoins.tsx    # Currency watchlist with toggle
```

## Data Flow

### Changelly API Proxy

```
Browser → POST /api/changelly { method, params }
       → server.ts signs request body with RSA-SHA256 (PKCS8 private key from env)
       → POST https://api.changelly.com/v2 (JSON-RPC 2.0)
       → Response piped back to browser
```

The client (`changellyService.ts`) never touches API credentials. Authentication headers are:
- `X-Api-Key`: SHA-256 hash of the DER-encoded public key (base64)
- `X-Api-Signature`: RSA-SHA256 signature of the JSON body (base64)

### Firebase / Firestore

Firestore stores data under per-user paths:
- `/users/{uid}` — profile document (fullName, isKycVerified, favoriteCoins, KYC fields)
- `/users/{uid}/transactions/{id}` — exchange transaction records

The `src/lib/firebase.ts` module exports wrapper functions (`doc`, `getDoc`, `setDoc`, `updateDoc`, `addDoc`, `collection`, `onSnapshot`, `query`, `orderBy`, `serverTimestamp`) that delegate to either real Firestore SDK or a localStorage-based mock layer depending on `isMockActive()`.

### Auth Modes

1. **Google Auth** — standard Firebase `signInWithPopup` with GoogleAuthProvider
2. **Mock/Sandbox** — creates a fake user object in memory + localStorage, uses mock Firestore wrappers. Toggled by `localStorage.firebase_mock_active`.

## Component Hierarchy

```
App (FirebaseProvider wraps everything)
└── MainContent
    ├── [Not authenticated] → Login screen (Google + Mock buttons)
    └── [Authenticated] → Layout
        ├── Navigation (sidebar, tabs, sign-out)
        ├── Header (KYC status, sandbox badge)
        └── Tab content (AnimatePresence):
            ├── SwapInterface
            │   └── CurrencySelector (×2)
            ├── TransactionHistory
            ├── KycForm
            └── FavoriteCoins
```

## State Management

- **Global auth state:** React Context via `FirebaseProvider` → `useAuth()` hook
- **Per-component state:** `useState` / `useEffect` (no Redux or external state lib)
- **Real-time updates:** Firestore `onSnapshot` in TransactionHistory
- **Debounced API calls:** `setTimeout` in SwapInterface for exchange amount estimates

## Styling

- Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js`)
- Dark theme: near-black backgrounds (`#0A0A0A`, `#0E0E0E`, `#121212`, `#161616`)
- Accent: indigo-500/600
- Typography: font-black uppercase tracking-widest for labels; system font stack
- Animations: Framer Motion (`motion/react`) for page transitions and list items

## Build & Dev Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `tsx server.ts` | Starts Express + Vite in middleware mode |
| `build` | `vite build && esbuild server.ts ...` | Builds frontend to `dist/` and bundles server |
| `start` | `node dist/server.cjs` | Runs production server |
| `lint` | `tsc --noEmit` | Type-checks without emitting |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CHANGELLY_API_SECRET` | Yes | PKCS8 private key in hex (DER-encoded) |
| `GEMINI_API_KEY` | No | For Gemini AI features (not currently wired) |
| `APP_URL` | No | Public URL (used in hosted environments) |
| `VITE_API_BASE_URL` | No | Override API base for split deployments |
| `NODE_ENV` | No | Set to `production` to serve static dist |
| `DISABLE_HMR` | No | Set to `true` to disable Vite HMR/file watching |

## Conventions

- All Changelly methods go through the `changellyService` client — never call the proxy directly from components.
- Firebase operations use the wrapper exports from `src/lib/firebase.ts` (not raw SDK imports) to support mock mode.
- KYC must be verified (`profile.isKycVerified === true`) before swaps are allowed.
- Transaction creation writes to both Changelly (via proxy) and Firestore (for history).
- The app uses tab-based navigation (not routing) — no react-router.

## Known Constraints

- The mock Firestore layer persists only in localStorage — it does not support queries/ordering, just basic CRUD.
- The Changelly key pair must be generated externally and the hex-encoded PKCS8 private key placed in `.env`.
- `firebase-applet-config.json` contains the Firebase project config and is committed (public Firebase keys are safe to commit per Firebase docs).
- No server-side session — auth is purely client-side Firebase Auth tokens. The proxy endpoint is unauthenticated (any request to `/api/changelly` is forwarded).
