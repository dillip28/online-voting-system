# VoteSecure — Database Design

## Overview

VoteSecure uses **PostgreSQL 16** with **Prisma ORM** for type-safe database operations. The schema is designed around the privacy-preserving voting model, where voter identity is separated from ballot content.

## Database Selection Rationale

| Feature | PostgreSQL | Why It Matters |
|---------|------------|----------------|
| ACID Transactions | ✓ | Critical for vote integrity |
| Row-Level Locking | ✓ | Prevents duplicate votes |
| Unique Constraints | ✓ | Enforces data integrity |
| JSON Support | ✓ | Flexible metadata storage |
| UUID Support | ✓ | Non-guessable identifiers |
| Mature Ecosystem | ✓ | Battle-tested for elections |

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USERS                                       │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                       │
│ email (VARCHAR, UNIQUE)                                             │
│ password_hash (VARCHAR)                                             │
│ role (ENUM: voter, election_officer, admin, super_admin)            │
│ is_active (BOOLEAN)                                                 │
│ email_verified_at (TIMESTAMP, NULLABLE)                             │
│ created_at (TIMESTAMP)                                              │
│ updated_at (TIMESTAMP)                                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:1
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      VOTER_PROFILES                                  │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                       │
│ user_id (UUID, FK → users.id, UNIQUE)                               │
│ student_id (VARCHAR, UNIQUE)                                        │
│ full_name (VARCHAR)                                                 │
│ department (VARCHAR)                                                │
│ year_of_study (INTEGER, NULLABLE)                                   │
│ phone (VARCHAR, NULLABLE)                                           │
│ is_verified (BOOLEAN)                                               │
│ verified_at (TIMESTAMP, NULLABLE)                                   │
│ created_at (TIMESTAMP)                                              │
│ updated_at (TIMESTAMP)                                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         ELECTIONS                                    │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                       │
│ title (VARCHAR)                                                     │
│ description (TEXT)                                                  │
│ type (ENUM: presidential, parliamentary, student, organizational)   │
│ status (ENUM: draft, scheduled, open, closed, counting,            │
│              results_published, archived)                           │
│ start_time (TIMESTAMP)                                              │
│ end_time (TIMESTAMP)                                                │
│ created_by (UUID, FK → users.id)                                    │
│ settings (JSONB)                                                    │
│ integrity_hash (VARCHAR, NULLABLE)                                  │
│ created_at (TIMESTAMP)                                              │
│ updated_at (TIMESTAMP)                                              │
└─────────────────────────────────────────────────────────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ELECTION_POSITIONS                                 │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                       │
│ election_id (UUID, FK → elections.id)                               │
│ title (VARCHAR)                                                     │
│ description (TEXT, NULLABLE)                                        │
│ display_order (INTEGER)                                             │
│ max_selections (INTEGER, DEFAULT 1)                                 │
│ created_at (TIMESTAMP)                                              │
└─────────────────────────────────────────────────────────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       CANDIDATES                                     │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                       │
│ election_id (UUID, FK → elections.id)                               │
│ position_id (UUID, FK → election_positions.id)                      │
│ name (VARCHAR)                                                      │
│ photo_url (VARCHAR, NULLABLE)                                       │
│ manifesto (TEXT, NULLABLE)                                          │
│ party (VARCHAR, NULLABLE)                                           │
│ status (ENUM: pending, approved, rejected, withdrawn)               │
│ created_at (TIMESTAMP)                                              │
│ updated_at (TIMESTAMP)                                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                  ELECTION_VOTER_ELIGIBILITY                          │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                       │
│ election_id (UUID, FK → elections.id)                               │
│ voter_id (UUID, FK → voter_profiles.id)                             │
│ is_eligible (BOOLEAN)                                               │
│ has_voted (BOOLEAN, DEFAULT false)                                  │
│ voted_at (TIMESTAMP, NULLABLE)                                      │
│ vote_token_hash (VARCHAR, NULLABLE)                                 │
│ created_at (TIMESTAMP)                                              │
│ updated_at (TIMESTAMP)                                              │
│                                                                     │
│ UNIQUE (election_id, voter_id)                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          BALLOTS                                     │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                       │
│ election_id (UUID, FK → elections.id)                               │
│ ballot_hash (VARCHAR)                                               │
│ submitted_at (TIMESTAMP)                                            │
│                                                                     │
│ NOTE: NO voter_id column!                                           │
│ This table is intentionally disconnected from voter identity.       │
└─────────────────────────────────────────────────────────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BALLOT_CHOICES                                   │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                       │
│ ballot_id (UUID, FK → ballots.id)                                   │
│ position_id (UUID, FK → election_positions.id)                      │
│ candidate_id (UUID, FK → candidates.id, NULLABLE for NOTA)          │
│ created_at (TIMESTAMP)                                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     RESULTS_CACHE                                    │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                       │
│ election_id (UUID, FK → elections.id)                               │
│ position_id (UUID, FK → election_positions.id)                      │
│ candidate_id (UUID, FK → candidates.id, NULLABLE for NOTA)          │
│ vote_count (INTEGER, DEFAULT 0)                                     │
│ percentage (DECIMAL(5,2))                                           │
│ last_calculated (TIMESTAMP)                                         │
│                                                                     │
│ UNIQUE (election_id, position_id, candidate_id)                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        AUDIT_LOGS                                    │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                       │
│ action (VARCHAR)                                                    │
│ actor_id (UUID, FK → users.id, NULLABLE for system actions)         │
│ target_type (VARCHAR)                                               │
│ target_id (VARCHAR, NULLABLE)                                       │
│ metadata (JSONB, NULLABLE)                                          │
│ ip_address (VARCHAR, NULLABLE)                                      │
│ user_agent (VARCHAR, NULLABLE)                                      │
│ created_at (TIMESTAMP)                                              │
│                                                                     │
│ INDEX: idx_audit_logs_action, idx_audit_logs_actor,                 │
│        idx_audit_logs_created                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     SECURITY_EVENTS                                  │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                       │
│ event_type (VARCHAR)                                                │
│ severity (ENUM: low, medium, high, critical)                        │
│ details (JSONB, NULLABLE)                                           │
│ ip_address (VARCHAR, NULLABLE)                                      │
│ user_agent (VARCHAR, NULLABLE)                                      │
│ resolved_at (TIMESTAMP, NULLABLE)                                   │
│ resolved_by (UUID, FK → users.id, NULLABLE)                         │
│ created_at (TIMESTAMP)                                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         SESSIONS                                     │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                       │
│ user_id (UUID, FK → users.id)                                       │
│ token_hash (VARCHAR)                                                │
│ ip_address (VARCHAR, NULLABLE)                                      │
│ user_agent (VARCHAR, NULLABLE)                                      │
│ expires_at (TIMESTAMP)                                              │
│ created_at (TIMESTAMP)                                              │
│                                                                     │
│ INDEX: idx_sessions_user, idx_sessions_token, idx_sessions_expiry   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       NOTIFICATIONS                                  │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                       │
│ user_id (UUID, FK → users.id)                                       │
│ title (VARCHAR)                                                     │
│ message (TEXT)                                                      │
│ type (ENUM: info, warning, success, error)                          │
│ is_read (BOOLEAN, DEFAULT false)                                    │
│ link (VARCHAR, NULLABLE)                                            │
│ created_at (TIMESTAMP)                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Indexes

```sql
-- Performance-critical indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_voter_profiles_user_id ON voter_profiles(user_id);
CREATE INDEX idx_voter_profiles_student_id ON voter_profiles(student_id);

CREATE INDEX idx_elections_status ON elections(status);
CREATE INDEX idx_elections_created_by ON elections(created_by);
CREATE INDEX idx_elections_start_time ON elections(start_time);

CREATE INDEX idx_election_positions_election ON election_positions(election_id);

CREATE INDEX idx_candidates_election ON candidates(election_id);
CREATE INDEX idx_candidates_position ON candidates(position_id);

CREATE INDEX idx_election_voter_election ON election_voter_eligibility(election_id);
CREATE INDEX idx_election_voter_voter ON election_voter_eligibility(voter_id);

CREATE INDEX idx_ballots_election ON ballots(election_id);
CREATE INDEX idx_ballot_choices_ballot ON ballot_choices(ballot_id);
CREATE INDEX idx_ballot_choices_position ON ballot_choices(position_id);

CREATE INDEX idx_results_cache_election ON results_cache(election_id);

CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_created ON security_events(created_at);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

---

## Constraints

```sql
-- Unique constraints
ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE(email);
ALTER TABLE voter_profiles ADD CONSTRAINT uq_voter_profiles_user UNIQUE(user_id);
ALTER TABLE voter_profiles ADD CONSTRAINT uq_voter_profiles_student UNIQUE(student_id);

-- Critical: Prevent duplicate votes
ALTER TABLE election_voter_eligibility 
  ADD CONSTRAINT uq_election_voter UNIQUE(election_id, voter_id);

-- Results uniqueness
ALTER TABLE results_cache 
  ADD CONSTRAINT uq_results_candidate UNIQUE(election_id, position_id, candidate_id);

-- Foreign key constraints (with cascading behavior)
ALTER TABLE voter_profiles 
  ADD CONSTRAINT fk_voter_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE elections 
  ADD CONSTRAINT fk_election_creator 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE election_positions 
  ADD CONSTRAINT fk_position_election 
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE;

ALTER TABLE candidates 
  ADD CONSTRAINT fk_candidate_election 
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE;

ALTER TABLE candidates 
  ADD CONSTRAINT fk_candidate_position 
  FOREIGN KEY (position_id) REFERENCES election_positions(id) ON DELETE CASCADE;

ALTER TABLE election_voter_eligibility 
  ADD CONSTRAINT fk_eligibility_election 
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE;

ALTER TABLE election_voter_eligibility 
  ADD CONSTRAINT fk_eligibility_voter 
  FOREIGN KEY (voter_id) REFERENCES voter_profiles(id) ON DELETE CASCADE;

ALTER TABLE ballots 
  ADD CONSTRAINT fk_ballot_election 
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE RESTRICT;

ALTER TABLE ballot_choices 
  ADD CONSTRAINT fk_choice_ballot 
  FOREIGN KEY (ballot_id) REFERENCES ballots(id) ON DELETE CASCADE;

ALTER TABLE ballot_choices 
  ADD CONSTRAINT fk_choice_position 
  FOREIGN KEY (position_id) REFERENCES election_positions(id) ON DELETE RESTRICT;

ALTER TABLE ballot_choices 
  ADD CONSTRAINT fk_choice_candidate 
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE RESTRICT;

ALTER TABLE results_cache 
  ADD CONSTRAINT fk_result_election 
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE;

ALTER TABLE audit_logs 
  ADD CONSTRAINT fk_audit_actor 
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE sessions 
  ADD CONSTRAINT fk_session_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications 
  ADD CONSTRAINT fk_notification_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

---

## Migration Strategy

### Development
```bash
# Create new migration
npx prisma migrate dev --name <migration_name>

# Reset database (destructive)
npx prisma migrate reset

# Apply pending migrations
npx prisma migrate dev
```

### Production
```bash
# Generate migration SQL
npx prisma migrate diff

# Apply migrations (with backup!)
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

### Migration Best Practices

1. **Always backup** before applying migrations
2. **Test migrations** on staging environment first
3. **Never modify** applied migrations; create new ones
4. **Use transactions** for data migrations
5. **Verify** migration success with queries

---

## Query Patterns

### Vote Submission (Critical Transaction)

```sql
BEGIN;

-- 1. Lock voter status row
SELECT * FROM election_voter_eligibility 
WHERE election_id = $1 AND voter_id = $2 
FOR UPDATE;

-- 2. Check eligibility (application layer)
-- If has_voted = true, ROLLBACK

-- 3. Insert ballot (no voter_id!)
INSERT INTO ballots (id, election_id, ballot_hash, submitted_at)
VALUES ($3, $1, $4, NOW())
RETURNING id;

-- 4. Insert ballot choices
INSERT INTO ballot_choices (ballot_id, position_id, candidate_id)
VALUES ($5, $6, $7), ($8, $9, $10);

-- 5. Update voter status
UPDATE election_voter_eligibility 
SET has_voted = true, voted_at = NOW(), vote_token_hash = $11
WHERE election_id = $1 AND voter_id = $2;

COMMIT;
```

### Results Tallying

```sql
-- Count votes per candidate
SELECT 
  c.id as candidate_id,
  c.name as candidate_name,
  ep.id as position_id,
  ep.title as position_title,
  COUNT(bc.id) as vote_count
FROM candidates c
JOIN election_positions ep ON c.position_id = ep.id
LEFT JOIN ballot_choices bc ON bc.candidate_id = c.id
WHERE c.election_id = $1
GROUP BY c.id, c.name, ep.id, ep.title;
```

### Audit Trail Query

```sql
-- Get recent audit logs with actor info
SELECT 
  al.*,
  u.email as actor_email,
  vp.full_name as actor_name
FROM audit_logs al
LEFT JOIN users u ON al.actor_id = u.id
LEFT JOIN voter_profiles vp ON u.id = vp.user_id
ORDER BY al.created_at DESC
LIMIT 50;
```

---

## Data Integrity Checks

### Ballot Hash Verification

```sql
-- Verify all ballots have valid hashes
SELECT 
  b.id,
  b.ballot_hash,
  COUNT(bc.id) as choice_count
FROM ballots b
JOIN ballot_choices bc ON bc.ballot_id = b.id
GROUP BY b.id, b.ballot_hash
HAVING b.ballot_hash IS NULL OR b.ballot_hash = '';
```

### Vote Count Consistency

```sql
-- Verify results_cache matches actual ballot count
SELECT 
  rc.election_id,
  rc.position_id,
  rc.candidate_id,
  rc.vote_count as cached_count,
  COUNT(bc.id) as actual_count
FROM results_cache rc
LEFT JOIN ballot_choices bc ON bc.candidate_id = rc.candidate_id
GROUP BY rc.election_id, rc.position_id, rc.candidate_id, rc.vote_count
HAVING rc.vote_count != COUNT(bc.id);
```

---

## Backup Strategy

### Daily Backups
```bash
pg_dump -Fc --verbose --file=backup_$(date +%Y%m%d).dump votsecure
```

### Backup Verification
```bash
# Test restore to staging
pg_restore --verbose --clean --no-owner \
  --dbname=votsecure_staging \
  backup_20260915.dump
```

### Retention Policy
- **Daily backups**: 30 days
- **Weekly backups**: 12 weeks
- **Monthly backups**: 12 months
- **Pre-migration backups**: Until verified

---

*Last updated: 2026-09-15*
