# FinFlow — End-to-End Tests (Playwright + TypeScript)

End-to-end coverage for the FinFlow personal finance tracker (Next.js client +
Node/MongoDB API).

## Highlights
- **Session reuse** via a dedicated `setup` project (`auth.setup.ts`) that logs
  in once and saves storage state — the rest of the suite starts authenticated.
- **Page-driven specs** for auth, dashboard, transactions and budgets.
- Cross-browser (Chromium + Firefox), parallel execution, traces/video on failure.

## Layout
```
e2e/
├── fixtures/test-data.ts   # shared users, transactions, budgets + helpers
├── tests/
│   ├── auth.setup.ts       # one-time login → storage/user.json
│   ├── auth.spec.ts        # login/register/guard (no stored session)
│   ├── dashboard.spec.ts
│   ├── transactions.spec.ts
│   └── budgets.spec.ts
└── playwright.config.ts
```

## Running
```bash
# from repo root, start the app:
npm run install:all
npm run dev            # client :3000, server :5000

# then:
cd e2e
npm install
npx playwright install --with-deps
npm test               # runs setup → chromium + firefox
npm run test:ui
```

Configure credentials / target:
```bash
TEST_EMAIL=qa@example.com TEST_PASSWORD='...' \
BASE_URL=https://staging.finflow.app npm test
```
