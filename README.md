# VoteSecure — Online Voting System

A frontend demo of an online voting platform for college and university elections. Built with React, TypeScript, and Tailwind CSS, this project simulates a complete election workflow — from creating elections to casting votes and publishing results — using browser `localStorage` for data persistence.

> **Note:** This is a frontend-only demonstration project. It is not intended for real-world elections without a secure backend, database, and proper authentication infrastructure.

## Features

- **Admin Dashboard** — Overview of elections, voters, votes cast, and recent activity with charts
- **Election Creation & Lifecycle** — Create elections with schedule, manage full lifecycle from Draft to Published Results
- **Position Management** — Define multiple positions per election (e.g., President, Secretary, Treasurer)
- **Candidate Management** — Add, edit, approve, reject, and delete candidates with party and manifesto details
- **Voter Management** — Admin can view, add, edit, and toggle voter eligibility status
- **Voting Interface** — Step-by-step voting flow: select candidates per position, review ballot, confirm submission
- **Duplicate-Vote Prevention** — Each voter can only vote once per election (tracked in localStorage)
- **Results Dashboard** — Vote counts, percentages, turnout, and winner badges per position with charts
- **Audit Logs** — Track all administrative actions with timestamp, actor, and details
- **NOTA Support** — None of the Above option on every ballot
- **Role-Based Access** — Voter, Admin, and Super Admin roles with separate dashboards
- **Responsive Design** — Works on desktop and mobile devices
- **Dark Mode** — Toggle dark mode with preference persistence

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| State Management | Zustand |
| Routing | React Router DOM v7 |
| Charts | Recharts |
| Icons | Lucide React |
| Utilities | clsx, tailwind-merge, date-fns |

## Project Structure

```
online-voting-system/
├── frontend/
│   ├── src/
│   │   ├── api/            # API layer (localStorage-based)
│   │   ├── components/     # Reusable UI components
│   │   ├── layouts/        # Page layouts (admin, dashboard, public)
│   │   ├── lib/            # Utility functions
│   │   ├── mocks/          # Mock data for demo
│   │   ├── pages/          # Route pages (admin, voter, auth)
│   │   ├── services/       # localStorage data layer
│   │   ├── store/          # Zustand stores
│   │   └── types/          # TypeScript type definitions
│   ├── vite.config.ts
│   └── package.json
├── docs/                   # Architecture documentation
├── .github/workflows/      # CI pipeline
└── package.json            # Root package.json
```

## How to Run

### Prerequisites

- Node.js 18+

### Install & Start

```bash
# Clone the repository
git clone https://github.com/dillip28/online-voting-system.git
cd online-voting-system

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Other Commands

```bash
npm run build        # Build for production
npm run lint         # Lint the codebase
npm run typecheck    # Run TypeScript type checking
```

## How It Works

```
Admin Login
  → Create Election (title, type, schedule, positions)
  → Add Candidates under each position
  → Add Voters
  → Activate Election

Voter Login
  → View active elections
  → Select candidates per position (or NOTA)
  → Review ballot
  → Confirm vote
  → Receive confirmation receipt

Admin
  → Close Election
  → Publish Results
  → View Results Dashboard (vote counts, turnout, winners)
  → Review Audit Logs
```

## Data Storage

All data is stored in the browser's `localStorage`. No external database or backend server is required.

| Key | Content |
|-----|---------|
| `vs_elections` | Election records with positions |
| `vs_candidates` | Candidate records per election/position |
| `vs_votes` | Vote tallies per election |
| `vs_voted_users` | Tracks which voters have voted in which elections |
| `vs_audit_logs` | Administrative action audit trail |

Demo data (sample elections, candidates, voters) is automatically seeded on first visit. A "Reset Demo Data" option is available in Admin Settings.

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Voter | `voter@test.com` | `password123` |
| Admin | `admin@test.com` | `password123` |
| Super Admin | `superadmin@test.com` | `password123` |

## Limitations

- **Frontend-only demo** — No backend server, database, or real API
- **localStorage persistence** — Data is stored in the browser and tied to the device/browser instance
- **No real authentication** — Login uses hardcoded demo credentials with mock tokens
- **No server-side security** — No bcrypt hashing, no JWT verification, no rate limiting
- **No cross-device sync** — Each browser has its own independent data
- **Not suitable for real elections** — Would require a secure backend, encrypted database, proper authentication, and independent auditing

## Future Improvements

- Backend API with Express.js or similar
- PostgreSQL database with Prisma ORM
- Secure authentication (JWT, bcrypt)
- Server-side vote integrity checks
- Encrypted ballot storage
- Multi-device support
- CSV voter import
- Email notifications
- Production deployment

## License

MIT
