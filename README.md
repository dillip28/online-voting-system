# VoteSecure — Online Voting System

A secure, production-grade online voting platform for college and university elections. Built with privacy-preserving ballot architecture, role-based access control, and real-time election management.

## Features

- **Privacy-Preserving Ballots** — Voter identity separated from ballot content
- **Election Lifecycle** — Draft → Scheduled → Open → Closed → Counting → Published → Archived
- **Role-Based Access** — Voter, Admin, Super Admin with granular permissions
- **Real-Time Dashboard** — Live vote counts, turnout analytics, audit logs
- **Bulk Voter Import** — CSV-style voter registration with department/year filtering
- **Candidate Management** — Per-position candidate approval workflow
- **NOTA Support** — None of the Above option on every ballot
- **Results Publishing** — Manual or automatic result visibility controls
- **Audit Trail** — Every action logged with actor, timestamp, and metadata

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Recharts |
| Backend | Express.js, TypeScript, Prisma ORM, Zod validation |
| Database | PostgreSQL 16 (Docker) |
| Auth | JWT (access + refresh tokens), bcrypt |
| Testing | Vitest (unit + integration) |

## Project Structure

```
online-voting-system/
├── backend/
│   ├── src/
│   │   ├── config/         # Environment config
│   │   ├── lib/            # JWT, Prisma client
│   │   ├── middleware/      # Auth, RBAC, rate-limiting, validation, error handling
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   ├── validators/     # Zod schemas
│   │   └── index.ts        # Express server entry
│   ├── tests/              # Unit + integration tests
│   ├── prisma/             # Schema + migrations
│   └── docker-compose.yml
├── frontend/
│   ├── src/
│   │   ├── api/            # API client + endpoint modules
│   │   ├── components/     # Reusable UI components
│   │   ├── layouts/        # Page layouts (admin, dashboard, public)
│   │   ├── lib/            # Utilities
│   │   ├── pages/          # Route pages (admin, voter, super-admin, auth)
│   │   ├── store/          # Zustand stores
│   │   └── types/          # TypeScript types
│   └── vite.config.ts
├── docs/                   # Architecture, API, design docs
└── .github/workflows/      # CI pipeline
```

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for PostgreSQL)

### 1. Clone & Install

```bash
git clone https://github.com/dillip28/online-voting-system.git
cd online-voting-system

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Start Database

```bash
cd backend
docker-compose up -d
```

### 3. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your JWT_SECRET, DATABASE_URL, etc.
```

### 4. Run Migrations & Seed

```bash
npx prisma migrate dev
npx prisma db seed
```

### 5. Start Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Voter | `voter@test.com` | `password123` |
| Admin | `admin@test.com` | `password123` |
| Super Admin | `superadmin@test.com` | `password123` |

> **Note:** Auth currently uses mock login (no backend required). To enable real API auth, revert `frontend/src/store/auth-store.ts` to use `authApi.login()`.

## API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register (voter only)
- `POST /api/auth/logout` — Logout
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Reset password with token

### Elections
- `GET /api/elections` — List elections (paginated, filterable)
- `POST /api/elections` — Create election (admin)
- `GET /api/elections/:id` — Get election detail
- `PUT /api/elections/:id` — Update election
- `POST /api/elections/:id/open` — Open election for voting
- `POST /api/elections/:id/close` — Close election
- `POST /api/elections/:id/publish-results` — Publish results

### Voting
- `POST /api/voting/ballot` — Cast ballot
- `GET /api/voting/status/:electionId` — Check voting status
- `GET /api/voting/history` — Voting history

### Admin
- `GET /api/admin/dashboard` — Dashboard stats
- `GET /api/admin/audit-logs` — Audit log list
- `GET /api/admin/settings` — System settings
- `PUT /api/admin/settings` — Update settings

### Candidates
- `GET /api/candidates` — List candidates
- `POST /api/candidates` — Create candidate
- `PUT /api/candidates/:id` — Update candidate
- `DELETE /api/candidates/:id` — Delete candidate

### Voters
- `GET /api/voters` — List voters
- `POST /api/voters/import` — Bulk import voters
- `POST /api/voters/assign` — Assign voters to election

## Scripts

```bash
# Backend
npm run dev          # Start dev server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code

# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | — |
| `JWT_EXPIRES_IN` | Token expiry (seconds) | `3600` |
| `CORS_ORIGIN` | Allowed origin | `http://localhost:3000` |

## Security Features

- bcrypt password hashing (12 rounds)
- JWT with short-lived access tokens
- Row-level locking for vote integrity (SELECT FOR UPDATE)
- Rate limiting on auth endpoints (5 req/15min)
- Input validation on all endpoints (Zod)
- Audit logging for all state changes
- Privacy-preserving ballot design (no voter-ballot link)
- CORS with origin whitelist

## License

MIT
