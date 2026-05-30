<<<<<<< HEAD

# Cyberswap-Elite

Simple Swap build for the Cyber inititve

# CryptoSwap Elite

A cryptocurrency exchange application powered by the Changelly API v2. Supports real-time exchange rate estimates, transaction execution, basic KYC verification, and a personal coin watchlist.

## Features

- **Crypto Exchange** — Swap between 200+ cryptocurrencies with live rate estimation
- **Transaction History** — Real-time ledger of past exchanges stored in Firestore
- **KYC Verification** — Basic identity enrollment to unlock swap functionality
- **Favorite Coins** — Personal watchlist for quick access to preferred assets
- **Sandbox Mode** — Mock login and localStorage-based Firestore for testing without credentials

## Getting Started

### Prerequisites

- Node.js 18+
- A Changelly API key pair (RSA, PKCS8 format)
- A Firebase project with Firestore and Authentication enabled

### Installation

```bash
npm install
```

### Configuration

Copy the environment template and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:

| Variable               | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `CHANGELLY_API_SECRET` | Your PKCS8 private key in hex-encoded DER format |

The Firebase config is stored in `firebase-applet-config.json`. Update it with your own project details if deploying to a different Firebase project.

### Running in Development

```bash
npm run dev
```

Open `http://localhost:3000`. This starts a single Express server that serves both the React frontend (via Vite middleware) and the `/api/changelly` proxy endpoint.

**Do not** use the raw Vite dev server URL (typically port 5173) — it won't have access to the backend API routes.

### Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### "Failed to communicate with Changelly API"

- Verify `CHANGELLY_API_SECRET` is set in `.env`
- The secret must be a hex-encoded PKCS8 DER private key (not PEM, not base64)
- Check server console for detailed error messages

### "Unexpected token '<'" / HTML instead of JSON from API

- This means the Changelly API rejected the request (returned an HTML error page)
- Usually caused by incorrect authentication — verify your key pair is valid
- Ensure you're hitting `https://api.changelly.com/v2` (the v2 endpoint uses RSA-SHA256, not HMAC)

### Port 3000 already in use

```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Firebase Auth not working

- Ensure Google sign-in is enabled in your Firebase Console under Authentication > Sign-in methods
- The `authDomain` in `firebase-applet-config.json` must match your Firebase project
- For local testing without Firebase credentials, use the "Sandbox Mode" login button

### KYC required before swapping

This is by design. Complete the KYC form (Verification tab) to set `isKycVerified = true` on your profile before the Exchange tab will process transactions.

### Sandbox/Mock mode

Click "Use Mock Login (Sandbox)" on the login screen. This bypasses Firebase Auth and uses localStorage for all Firestore operations. Useful for UI testing without backend dependencies. To exit sandbox mode, sign out — it clears the mock flag and reloads the page.

## Tech Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4
- Framer Motion (via `motion/react`)
- Express.js (backend proxy)
- Firebase Auth + Firestore
- Changelly Exchange API v2 (JSON-RPC, RSA-SHA256 auth)
- Lucide React (icons)

## License

Apache-2.0

> > > > > > > baf7250 (Initial Commit)
