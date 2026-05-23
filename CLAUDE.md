# SubsTrack — Claude Code Instructions

## What This Project Is
A personal subscription manager for real users. Tracks every subscription a user pays for,
detects price increases automatically, shows a 12-month spending forecast, and tells the user
the exact last safe day to cancel each subscription before the next charge hits.
Bank accounts are connected via Plaid. Alerts go out via in-app notifications and email.

## Three Core Features
1. **Cancellation Timing Engine** — calculates the exact last day to cancel before the next billing cycle
2. **Price Creep Tracker** — detects when a subscription quietly raised its price and alerts the user
3. **12-Month Spending Forecast** — projects total subscription cost over the next 12 months

## Tech Stack
- **Backend:** Java 21 + Spring Boot 3 (REST API)
- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS
- **Database:** PostgreSQL
- **Bank Connection:** Plaid Java SDK
- **Email:** SendGrid
- **Auth:** Spring Security + JWT
- **Build:** Maven 3.9

## Folder Structure
SubsTrack/
├── backend/          # Spring Boot Java API
│   └── src/main/java/com/substrack/
│       ├── controller/   # REST endpoints
│       ├── service/      # Business logic
│       ├── repository/   # Database access
│       ├── model/        # JPA entities
│       ├── dto/          # Request/response objects
│       ├── config/       # Security, Plaid, mail config
│       └── exception/    # Custom exceptions + handlers
└── frontend/         # Next.js TypeScript app
└── app/
├── (auth)/       # Login, register pages
├── dashboard/    # Main dashboard
├── subscriptions/# Subscription management
└── api/          # Next.js API routes

## Naming Conventions
- Java classes: PascalCase (`SubscriptionService.java`)
- Java methods and variables: camelCase (`calculateCancellationDate()`)
- REST endpoints: kebab-case (`/api/subscriptions/cancellation-date`)
- Database tables: snake_case (`subscription_price_history`)
- React components: PascalCase (`SubscriptionCard.tsx`)
- TypeScript files: camelCase (`useForecast.ts`)
- Environment variables: SCREAMING_SNAKE_CASE (`PLAID_CLIENT_ID`)

## Git Workflow — Follow This Every Time
- `main` is protected — never commit directly to main
- Every feature gets its own branch: `feature/cancellation-engine`, `feature/price-tracker`, `feature/forecast`
- Every bug fix branch: `fix/jwt-expiry`, `fix/plaid-webhook`
- After completing any task: stage all changes, commit, push to the feature branch
- Commit message format: `type(scope): description`
  - `feat(backend): add cancellation date calculation endpoint`
  - `feat(frontend): add subscription card component`
  - `fix(auth): resolve JWT token expiry issue`
  - `chore(config): add Plaid sandbox environment variables`
- Never push directly to main — always open a PR

## Security Rules — Never Break These
- Never hardcode secrets, API keys, or tokens in any file
- All secrets go in `.env` (backend) and `.env.local` (frontend) — both are gitignored
- Plaid access tokens are stored encrypted in the database, never in plain text
- All API endpoints require authentication except `/api/auth/login` and `/api/auth/register`
- Validate and sanitize every input on the backend before processing

## Definition of Done
A task is complete when:
1. The feature works end-to-end
2. There is at least one test covering the core logic
3. No secrets are hardcoded
4. Code is committed with a proper message and pushed to the feature branch

