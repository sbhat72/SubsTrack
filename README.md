# SubsTrack

**A full-stack personal subscription manager built with Java 21, Spring Boot 3, and Next.js 15.**

SubsTrack connects to your bank account via Plaid, automatically detects recurring subscriptions from your transaction history, and gives you three things most subscription trackers don't: the exact last safe day to cancel before your next charge, automatic detection when a service quietly raises its price, and a 12-month forecast of exactly what you'll spend.

---


---

## Core Features

### Cancellation Timing Engine
Calculates the exact last safe day to cancel each subscription before the next billing cycle charges you. Monthly subscriptions show a 1-day buffer, yearly subscriptions show a 3-day buffer. If the deadline has already passed, it automatically rolls forward to the next cycle. Deadlines are sorted by urgency — the most time-sensitive ones appear first.

### Price Creep Tracker
Every time a subscription amount is updated, SubsTrack compares the new amount to the previous one. If the price went up, it automatically records the change in the price history table and fires an in-app notification. No more discovering a $3 price increase six months after it happened.

### 12-Month Spending Forecast
Projects exactly what your subscriptions will cost over the next 12 months, broken down by month. Monthly subscriptions appear in all 12 months, yearly subscriptions appear in the one month they bill, and weekly subscriptions are counted by exact billing dates per month. Each month is expandable to show a line-item breakdown.

### Plaid Bank Integration
Uses Plaid's secure OAuth flow — your bank credentials never touch SubsTrack's servers. After connecting, SubsTrack fetches 12 months of transaction history, groups charges by merchant, detects billing intervals (weekly, biweekly, monthly, yearly), and presents detected subscriptions for review.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Java 21 + Spring Boot 3.4 |
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| Database | PostgreSQL 16 |
| Authentication | Spring Security + JWT (jjwt) |
| Bank Connection | Plaid Java SDK |
| Password Hashing | BCrypt |
| Build Tool | Maven 3.9 |
| ORM | Spring Data JPA + Hibernate |

---

## Architecture

```
SubsTrack/
├── backend/                          # Spring Boot REST API
│   └── src/main/java/com/substrack/
│       ├── controller/               # HTTP endpoints
│       ├── service/                  # Business logic
│       ├── repository/               # JPA repositories
│       ├── model/                    # JPA entities
│       ├── dto/                      # Request/response objects
│       ├── config/                   # Security, Plaid, CORS config
│       └── exception/                # Global exception handling
└── frontend/                         # Next.js app
    └── app/
        ├── (auth)/                   # Login, register
        └── dashboard/                # All authenticated pages
            ├── page.tsx              # Overview with stat cards
            ├── subscriptions/        # CRUD + bank connection
            ├── cancellations/        # Deadline tracking
            ├── forecast/             # 12-month projection
            └── notifications/        # Price change alerts
```

---

## Database Schema

```sql
users                     -- Accounts with BCrypt-hashed passwords
subscriptions             -- Per-user subscription records
subscription_price_history -- Price change audit trail
notifications             -- In-app alerts (price increases, reminders)
plaid_connections         -- Stored Plaid access tokens per user
```

---

## API Endpoints

**Auth**
```
POST /api/auth/register
POST /api/auth/login
```

**Subscriptions**
```
GET    /api/subscriptions
POST   /api/subscriptions
PUT    /api/subscriptions/{id}
DELETE /api/subscriptions/{id}
GET    /api/subscriptions/cancellation-deadlines
GET    /api/subscriptions/{id}/cancellation-deadline
```

**Forecast**
```
GET /api/forecast
```

**Notifications**
```
GET /api/notifications
GET /api/notifications/unread-count
PUT /api/notifications/{id}/read
```

**Plaid**
```
POST /api/plaid/link-token
POST /api/plaid/exchange-token
GET  /api/plaid/detect-subscriptions
```

---

## Security

- JWT tokens with 24-hour expiry — stateless, no server-side sessions
- BCrypt password hashing — never stores plain text passwords
- Spring Security filter chain — all endpoints protected by default, auth routes explicitly permitted
- Plaid OAuth flow — bank credentials never touch the application server
- Environment variables for all secrets — nothing hardcoded, nothing committed

---

## Local Setup

**Prerequisites:** Java 21, Maven 3.9, Node 22, PostgreSQL 16

**1. Clone and set up the database**
```bash
git clone https://github.com/sbhat72/SubsTrack.git
cd SubsTrack
psql -U postgres -c "CREATE DATABASE substrack;"
psql -U postgres -d substrack -f backend/src/main/resources/schema.sql
```

**2. Configure backend environment**

Create `backend/.env`:
```
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_jwt_secret_min_32_chars
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_sandbox_secret
PLAID_ENV=sandbox
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
```

**3. Run the backend**
```bash
cd backend
mvn spring-boot:run
```
Backend starts on `http://localhost:8080`

**4. Configure frontend environment**

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**5. Run the frontend**
```bash
cd frontend
npm install
npm run dev
```
Frontend starts on `http://localhost:3000`

---

## Development Workflow

Every feature is built on a dedicated branch, committed with structured messages, and merged via pull request. `main` is branch-protected — nothing merges without a PR.

Commit message format: `type(scope): description`

Examples:
```
feat(backend): add cancellation deadline calculation endpoint
fix(frontend): align AuthResponse type with backend response shape
chore(config): add CORS configuration for localhost:3000
```

---

## What's Next

- Deployment — Railway (backend) + Vercel (frontend)
- Plaid Development access for real bank connections
- Email notifications via SendGrid for price increase alerts
- Plaid webhook support for automatic transaction updates
- Account settings and data deletion
