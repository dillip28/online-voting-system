# VoteSecure — System Architecture

## Overview

VoteSecure is a secure online voting platform designed for college/university election environments. The system prioritizes vote privacy, election integrity, and administrative control while maintaining a professional, accessible user experience.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Vite + React 19 + TypeScript SPA                       │    │
│  │  • Tailwind CSS v4 (custom theme)                       │    │
│  │  • Zustand state management                             │    │
│  │  • React Router v7                                      │    │
│  │  • Recharts for data visualization                      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Express.js + TypeScript                                 │    │
│  │  • JWT authentication                                    │    │
│  │  • Role-based authorization (RBAC)                       │    │
│  │  • Zod request validation                                │    │
│  │  • Rate limiting                                         │    │
│  │  • Audit logging middleware                              │    │
│  │  • CORS configuration                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL 16                                           │    │
│  │  • ACID transactions                                     │    │
│  │  • Row-level locking for vote integrity                  │    │
│  │  • Unique constraints for duplicate prevention           │    │
│  │  • Cryptographic hash verification                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Module Architecture

### 1. Authentication Module
- JWT-based stateless authentication
- bcrypt password hashing (12 rounds)
- Access + refresh token pattern
- Session tracking for revocation capability
- Rate limiting on login attempts (5 attempts/15 min)

### 2. User Management Module
- Role hierarchy: `voter` → `election_officer` → `admin` → `super_admin`
- Profile management with student ID verification
- Email verification flow
- Password reset via secure tokens

### 3. Election Management Module
- State machine: `draft → scheduled → open → closed → counting → results_published → archived`
- Configurable election types (presidential, parliamentary, student council, etc.)
- Position-based candidate assignment
- Eligibility rules (department, year, etc.)
- NOTA (None of the Above) option support

### 4. Voting Engine Module
- Privacy-preserving ballot architecture (separated identity from ballot)
- Server-side duplicate vote prevention via database constraints
- Idempotent voting endpoints
- Ballot hash generation for integrity verification
- Transaction-safe vote recording

### 5. Results Module
- Real-time tallying from ballot records
- Position-wise results
- Turnout calculation
- Configurable result visibility
- Export capabilities

### 6. Audit Module
- Tamper-evident audit trail
- Structured logging (action, actor, target, metadata)
- Security event tracking
- IP and user agent logging

## Data Flow: Voting Process

```
1. VOTER LOGIN
   │
   ▼
2. ELIGIBILITY CHECK (server-side)
   │  • Verify voter registration
   │  • Check election eligibility rules
   │  • Confirm election is OPEN
   │
   ▼
3. BALLOT PRESENTATION
   │  • Load candidates for eligible positions
   │  • Display election information
   │
   ▼
4. BALLOT SUBMISSION
   │  • Validate all required fields
   │  • Check for duplicate vote (DB constraint)
   │  • Begin transaction
   │  • Record ballot (NO voter_id)
   │  • Record ballot choices
   │  • Update voter status (has_voted = true)
   │  • Generate ballot hash
   │  • Commit transaction
   │
   ▼
5. CONFIRMATION
   │  • Return confirmation token
   │  • Display success message
   │  • Log audit event
   │
   ▼
6. VERIFICATION (optional)
   • Voter can verify ballot was recorded
   • System confirms: "Your vote has been recorded"
   • System does NOT reveal: "You voted for X"
```

## Privacy Architecture

### Separated Identity Model

The system separates voter identity from ballot content:

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│      VOTER STATUS           │     │         BALLOT              │
│  (who voted)                │     │  (what was voted)           │
├─────────────────────────────┤     ├─────────────────────────────┤
│ election_id                 │     │ election_id                 │
│ voter_id                    │     │ ballot_hash                 │
│ has_voted = true            │     │ position_id                 │
│ voted_at = timestamp        │     │ candidate_id                │
│ vote_token_hash             │     │ submitted_at                │
│                             │     │                             │
│ NO candidate info           │     │ NO voter info               │
└─────────────────────────────┘     └─────────────────────────────┘
```

### What This Prevents
- Linking a voter to their specific vote choice
- Coercion through vote verification (voter can only prove they voted, not how)
- Database queries that reveal individual voting patterns

### Limitations
- **Not fully anonymous**: System knows *that* a voter voted, just not *for whom*
- **Timing correlation**: Server timestamps could theoretically be analyzed
- **Insider threat**: Database admins could potentially correlate data
- **No end-to-end verifiability**: Voters cannot independently verify their vote was counted correctly

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────┐
│ LAYER 1: Network Security               │
│ • HTTPS enforcement                     │
│ • CORS configuration                    │
│ • Rate limiting                         │
├─────────────────────────────────────────┤
│ LAYER 2: Authentication                 │
│ • JWT validation                        │
│ • Token expiration                      │
│ • Session tracking                      │
├─────────────────────────────────────────┤
│ LAYER 3: Authorization                  │
│ • Role-based access control             │
│ • Resource ownership validation         │
│ • Server-side checks (never trust       │
│   client-side role claims)              │
├─────────────────────────────────────────┤
│ LAYER 4: Input Validation               │
│ • Zod schema validation                 │
│ • Parameterized queries (Prisma)        │
│ • Output encoding                       │
├─────────────────────────────────────────┤
│ LAYER 5: Data Integrity                 │
│ • Database constraints                  │
│ • Transaction isolation                 │
│ • Cryptographic hashes                  │
│ • Audit logging                         │
└─────────────────────────────────────────┘
```

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend Framework | React 19 + Vite | Existing codebase, fast development |
| Backend Framework | Express.js | Lightweight, flexible, matches TypeScript stack |
| ORM | Prisma | Type-safe, excellent migration support |
| Database | PostgreSQL | ACID compliance, JSON support, row-level locking |
| Authentication | JWT | Stateless, scalable, industry standard |
| Validation | Zod | End-to-end type inference, runtime validation |
| Testing | Vitest + Playwright | Fast unit tests, reliable browser automation |
| CI/CD | GitHub Actions | Native to the repository |

## Scalability Considerations

### Current Design (College/University Scale)
- Single PostgreSQL instance
- Single Express server
- In-memory caching for hot data
- Suitable for 1,000-10,000 concurrent voters

### Future Scaling Options
- Connection pooling (PgBouncer)
- Read replicas for results reporting
- Redis for session/cache
- Load balancing for multiple API instances
- CDN for static assets

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│           Production Environment         │
├─────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    │
│  │   Nginx     │    │   Nginx     │    │
│  │  (Frontend) │    │  (API)      │    │
│  └──────┬──────┘    └──────┬──────┘    │
│         │                  │            │
│         ▼                  ▼            │
│  ┌─────────────┐    ┌─────────────┐    │
│  │ Static Files│    │ Express API │    │
│  │ (Vite build)│    │  (Node.js)  │    │
│  └─────────────┘    └──────┬──────┘    │
│                            │            │
│                            ▼            │
│                     ┌─────────────┐    │
│                     │ PostgreSQL  │    │
│                     └─────────────┘    │
└─────────────────────────────────────────┘
```

## Environment Configuration

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Token signing key (min 32 chars) | Yes |
| `JWT_EXPIRES_IN` | Token expiry (default: 1h) | No |
| `PORT` | Server port (default: 3000) | No |
| `CORS_ORIGIN` | Allowed frontend origin | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (default: 15min) | No |
| `RATE_LIMIT_MAX` | Max requests per window (default: 100) | No |

## Constraints & Assumptions

1. **Single-tenant**: Designed for one institution, not multi-tenant SaaS
2. **Moderate scale**: Optimized for thousands, not millions of voters
3. **Trusted administrators**: Super admins have significant system access
4. **Network security**: Assumes HTTPS in production
5. **Browser support**: Modern browsers only (ES2022+)

---

*Last updated: 2026-09-15*
