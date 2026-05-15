# FinFlow — Personal Finance Tracker

> Take control of your money. Track income, expenses, budgets, and accounts in one clean dashboard.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Features

- **Dashboard** — Net worth, monthly income vs expenses chart, top spending categories, budget health, recent transactions
- **Transactions** — Full CRUD with search, date range, category and account filters, pagination
- **Budgets** — Set spending limits per category with live progress bars and over-budget alerts
- **Accounts** — Track multiple accounts (checking, savings, credit, cash, investment) with real-time balances
- **Authentication** — Secure register/login with encrypted password transmission and persistent sessions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose ODM |
| Auth | JWT in `httpOnly` cookies |
| Encryption | RSA-2048 (client) + bcrypt (server) |
| Charts | Recharts |
| State | TanStack Query v5 |
| Validation | Zod (client), express-validator (server) |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Next.js)                  │
│                                                     │
│  React Pages → TanStack Query → Axios (cookies)    │
│  Web Crypto API encrypts password before any send   │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS (HTTP in dev)
                     ▼
┌─────────────────────────────────────────────────────┐
│               Express API (port 5000)                │
│                                                     │
│  Helmet → CORS → Rate Limiter → mongoSanitize → HPP │
│  RSA decrypt → validate → bcrypt → JWT cookie       │
└────────────────────┬────────────────────────────────┘
                     │ Mongoose
                     ▼
┌─────────────────────────────────────────────────────┐
│                    MongoDB                           │
│  users · accounts · categories · transactions ·     │
│  budgets                                            │
└─────────────────────────────────────────────────────┘
```

---

## Security

| Threat | Mitigation |
|---|---|
| Password exposure in transit | RSA-2048 client-side encryption — plaintext never sent |
| Weak passwords stored | bcrypt (cost 12) — one-way hash, never reversible |
| Password in API response | `select: false` on schema field |
| Brute force login | Rate limiting: 10 auth attempts / 15 min per IP |
| NoSQL injection | `express-mongo-sanitize` strips `$` operators |
| XSS / clickjacking | Helmet security headers (CSP, X-Frame-Options, etc.) |
| CSRF | `sameSite: strict` cookie, CORS origin whitelist |
| User enumeration | Constant-time dummy bcrypt compare when email not found |
| Oversized payloads (DoS) | 10kb body limit |
| HTTP Parameter Pollution | `hpp` middleware |
| Weak JWT secret | Startup validation — crashes if secret < 32 chars |
| Regex injection in search | Metacharacters escaped before MongoDB `$regex` |
| Session token exposure | `httpOnly` cookie — inaccessible to JavaScript |
| Stale RSA keys on restart | Keys persisted to disk in `.keys/` (gitignored) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 7 running locally (`brew services start mongodb-community@7.0`)

### 1. Clone and install

```bash
git clone https://github.com/your-username/finflow.git
cd finflow
npm run install:all
```

### 2. Configure environment

```bash
# Backend
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finflow
JWT_SECRET=<generate a 32+ char random string — see below>
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```bash
# Frontend
cp client/.env.local.example client/.env.local
```

`client/.env.local` default is fine for local dev:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Run

```bash
npm run dev
```

This starts both the backend (`:5000`) and frontend (`:3000`) concurrently.

Open [http://localhost:3000](http://localhost:3000) — register an account, and 15 default categories + a main account are created automatically.

---

## Project Structure

```
finflow/
├── package.json              # Root scripts (dev, build, install:all)
│
├── server/                   # Express REST API
│   ├── server.js             # Entry point — middleware stack
│   ├── .env.example          # Environment template
│   ├── .keys/                # RSA key pair (gitignored, auto-generated)
│   └── src/
│       ├── config/
│       │   ├── db.js         # MongoDB connection
│       │   └── env.js        # Startup env validation
│       ├── models/           # Mongoose schemas
│       │   ├── User.js
│       │   ├── Account.js
│       │   ├── Category.js
│       │   ├── Transaction.js
│       │   └── Budget.js
│       ├── controllers/      # Route handlers / business logic
│       ├── routes/           # Express routers
│       ├── middleware/
│       │   ├── auth.js       # JWT verification
│       │   ├── errorHandler.js
│       │   └── rateLimiter.js
│       └── utils/
│           ├── keyManager.js       # RSA key generation & decryption
│           └── defaultCategories.js
│
└── client/                   # Next.js 14 App Router
    ├── app/
    │   ├── (auth)/           # Login, Register pages
    │   └── (dashboard)/      # Protected pages
    │       ├── dashboard/
    │       ├── transactions/
    │       ├── budgets/
    │       └── accounts/
    ├── components/
    │   ├── layout/           # Sidebar, Header
    │   ├── ui/               # Modal, Badge (shared)
    │   ├── dashboard/        # Stats, Charts, Recent transactions
    │   ├── transactions/     # Transaction form & list
    │   ├── budgets/          # Budget cards & form
    │   └── accounts/         # Account cards & form
    ├── hooks/
    │   └── useAuth.ts
    ├── lib/
    │   ├── api.ts            # Axios instance + typed API calls
    │   ├── crypto.ts         # Browser-side RSA encryption (Web Crypto API)
    │   └── utils.ts          # Formatters, constants
    ├── types/
    │   └── index.ts          # Shared TypeScript types
    └── middleware.ts         # Route protection (redirect unauthenticated)
```

---

## API Reference

All endpoints except `/api/auth/*` and `/api/health` require a valid session cookie.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/public-key` | Fetch RSA public key for client-side password encryption |
| `POST` | `/api/auth/register` | Register — body: `{ name, email, encryptedPassword }` |
| `POST` | `/api/auth/login` | Login — body: `{ email, encryptedPassword }` |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Current user |

### Accounts
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/accounts` | All accounts |
| `POST` | `/api/accounts` | Create account |
| `PUT` | `/api/accounts/:id` | Update account |
| `DELETE` | `/api/accounts/:id` | Delete (only if no transactions) |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions` | Paginated list — query: `page, limit, type, category, account, startDate, endDate, search` |
| `POST` | `/api/transactions` | Create — auto-updates account balance |
| `PUT` | `/api/transactions/:id` | Update — reverses old balance effect, applies new |
| `DELETE` | `/api/transactions/:id` | Delete — reverses balance effect |
| `GET` | `/api/transactions/stats/monthly` | 6-month income/expense totals for chart |

### Budgets
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/budgets` | All budgets with live `spent` / `remaining` / `percentage` |
| `POST` | `/api/budgets` | Create — body: `{ categoryId, amount, period, month? }` |
| `PUT` | `/api/budgets/:id` | Update |
| `DELETE` | `/api/budgets/:id` | Delete |

### Categories & Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories` | All categories (seeded on register) |
| `POST/PUT/DELETE` | `/api/categories/:id` | Manage custom categories |
| `GET` | `/api/dashboard/summary` | All dashboard data in one request |

---

## Deployment

### Backend (Railway / Render / Fly.io)

1. Set environment variables in the platform dashboard — never commit `.env`
2. Set `NODE_ENV=production`
3. Set `CLIENT_URL` to your frontend domain
4. MongoDB: use [MongoDB Atlas](https://cloud.mongodb.com) free tier

### Frontend (Vercel)

1. Connect your GitHub repo
2. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL
3. Vercel handles HTTPS automatically — the `secure` cookie flag activates in production

---

## License

MIT — see [LICENSE](LICENSE)
