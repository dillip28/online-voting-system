# VoteSecure — Security Model

## Security Philosophy

Security in VoteSecure is implemented as **defense in depth** — multiple overlapping layers of protection where the failure of any single layer does not compromise the entire system. This document describes the threat model, implemented protections, known limitations, and responsible disclosure process.

---

## Threat Model

### Assets Protected

| Asset | Priority | Description |
|-------|----------|-------------|
| Vote Privacy | Critical | Individual vote choices must not be linkable to voter identity |
| Vote Integrity | Critical | Votes must not be altered, deleted, or fabricated |
| Election Integrity | Critical | Election configuration must not be tampered with |
| Voter Eligibility | High | Only eligible voters may vote; each voter votes once |
| Administrative Access | High | Admin functions must be properly authorized |
| User Credentials | High | Passwords and tokens must be protected |
| Audit Trail | High | Security events must be logged immutably |
| System Availability | Medium | System must resist denial-of-service attempts |

### Adversaries Considered

| Adversary | Capability | Mitigation |
|-----------|------------|------------|
| Malicious Voter | Multiple vote attempts, credential theft | Server-side duplicate prevention, rate limiting |
| Coercer | Forces voter to reveal vote | Privacy-preserving ballot design (limited protection) |
| Malicious Admin | Unauthorized election modification | Role-based access control, audit logging |
| External Attacker | SQL injection, XSS, CSRF | Input validation, parameterized queries, CORS |
| Insider Threat | Direct database access | Audit trail, integrity hashes, separation of concerns |
| Bot/Automated Attack | Brute force, credential stuffing | Rate limiting, account lockout, CAPTCHA consideration |

---

## Security Controls

### 1. Authentication Security

#### Password Hashing
- **Algorithm**: bcrypt
- **Work Factor**: 12 (configurable)
- **Salt**: Auto-generated per password
- **Storage**: Only hash stored, never plaintext

#### JWT Tokens
- **Algorithm**: HS256 (symmetric) or RS256 (asymmetric, recommended for production)
- **Expiration**: 1 hour (configurable)
- **Claims**: user_id, role, issued_at
- **Refresh**: Token rotation on sensitive operations
- **Revocation**: Session tracking for immediate invalidation

#### Session Management
- **Storage**: Database-backed sessions (not just JWT)
- **Revocation**: Immediate on logout, password change, or security event
- **Expiry**: Automatic cleanup of expired sessions
- **Binding**: Optional IP/user-agent binding

### 2. Authorization Security

#### Role-Based Access Control (RBAC)

```
SUPER_ADMIN
    ├── Can manage all admins
    ├── Can manage system settings
    ├── Can access all elections
    └── Can view all audit logs

ADMIN
    ├── Can create/edit elections
    ├── Can manage candidates
    ├── Can import voters
    ├── Can open/close elections
    └── Can publish results

ELECTION_OFFICER
    ├── Can view elections
    ├── Can view candidates
    └── Can monitor voting progress

VOTER
    ├── Can view available elections
    ├── Can cast votes
    └── Can view own voting history
```

#### Resource Ownership Validation
- Every protected endpoint validates the requesting user's authorization
- Users can only access their own profile data
- Admins can only manage elections they created (unless super_admin)
- Voters can only vote in elections they're eligible for

### 3. Input Validation

#### Zod Schema Validation
- All API inputs validated against Zod schemas
- Type inference provides compile-time type safety
- Runtime validation catches malformed requests

#### SQL Injection Prevention
- **Prisma ORM**: Parameterized queries by default
- **No raw SQL**: Avoided except in migration scripts
- **Input sanitization**: Additional layer on user inputs

#### XSS Prevention
- **React auto-escaping**: Default behavior for JSX
- **DOMPurify**: Sanitize any HTML inputs (admin rich text)
- **Content-Security-Policy**: Restrict script sources (production)
- **Output encoding**: Context-aware encoding

### 4. Network Security

#### CORS Configuration
```typescript
// Production CORS settings
{
  origin: process.env.CORS_ORIGIN,  // Specific frontend URL only
  credentials: true,                // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400                     // Preflight cache: 24 hours
}
```

#### Rate Limiting
- **Login**: 5 attempts per 15 minutes per IP
- **Voting**: 1 attempt per election per voter (database constraint)
- **API General**: 100 requests per 15 minutes per IP
- **Sensitive Operations**: 10 requests per hour (password reset, etc.)

#### HTTPS Enforcement
- Production requires HTTPS
- HTTP requests redirected to HTTPS
- HSTS header enabled
- Secure cookie flags set

### 5. Data Protection

#### Encryption at Rest
- Database encryption (PostgreSQL TDE or disk-level)
- Sensitive fields encrypted (if required)

#### Encryption in Transit
- TLS 1.2+ required for all connections
- Certificate validation enforced

#### Data Minimization
- Only collect necessary voter information
- No unnecessary PII stored
- Vote choices not linked to voter identity

### 6. Audit & Monitoring

#### Audit Log Fields
```typescript
{
  id: string;
  action: string;           // e.g., 'ELECTION_OPENED'
  actor_id: string;         // Who performed the action
  target_type: string;      // e.g., 'election'
  target_id: string;        // e.g., 'election-uuid'
  metadata: object;         // Action-specific details
  ip_address: string;       // Client IP
  user_agent: string;       // Client software
  created_at: Date;         // Timestamp
}
```

#### Monitored Events
- Authentication events (login, logout, failed attempts)
- Election lifecycle events (created, opened, closed, published)
- Voter management events (imported, verified, eligibility changes)
- Administrative actions (settings changes, admin creation)
- Security events (unauthorized access attempts, rate limit hits)

#### Immutability
- Audit logs are append-only
- No UPDATE or DELETE operations on audit_logs table
- Periodic hash chain verification (future enhancement)

### 7. Voting-Specific Security

#### Duplicate Vote Prevention
- **Database Constraint**: Unique constraint on `(election_id, voter_id)` in `voter_status`
- **Application Layer**: Double-check before insert
- **Transaction Isolation**: Serializable isolation for vote submission
- **Row Locking**: `SELECT FOR UPDATE` on voter status during voting

#### Ballot Integrity
- **Ballot Hash**: SHA-256 hash of ballot contents
- **Immutable Records**: Ballots cannot be modified after submission
- **Integrity Verification**: Admin can verify ballot count matches hash chain

#### Election State Machine
- **Server-Side Enforcement**: State transitions validated in backend
- **Invalid Transitions Blocked**: e.g., cannot vote in DRAFT election
- **Audit Trail**: All state changes logged

---

## Known Limitations

### 1. Vote Privacy Limitations

| Limitation | Risk Level | Description |
|------------|------------|-------------|
| Server knows voter voted | Medium | System records that a voter voted, not how |
| Timing correlation | Low | Server timestamps could theoretically be analyzed |
| Insider access | Medium | Database admins could correlate data |
| No coercion resistance | Medium | Voter cannot prove they voted a specific way, but also cannot prove they didn't |

### 2. Verifiability Limitations

| Limitation | Risk Level | Description |
|------------|------------|-------------|
| No end-to-end verifiability | High | Voters cannot independently verify their vote was counted correctly |
| Trust in server | High | Must trust the server counted votes honestly |
| No paper trail | Medium | No physical audit trail (unless hybrid system) |

### 3. Infrastructure Limitations

| Limitation | Risk Level | Description |
|------------|------------|-------------|
| Single points of failure | Medium | Single database, single API server |
| DDoS vulnerability | Medium | Limited DDoS protection without CDN/WAF |
| Backup integrity | Low | Backup integrity not cryptographically verified |

### 4. Operational Limitations

| Limitation | Risk Level | Description |
|------------|------------|-------------|
| Admin trust | High | Super admins have significant system access |
| Key management | Medium | JWT secret rotation not automated |
| Incident response | Medium | No automated alerting system |

---

## Security Recommendations

### For Production Deployment

1. **Enable HTTPS**: Use TLS certificates (Let's Encrypt or commercial)
2. **WAF**: Deploy Web Application Firewall (Cloudflare, AWS WAF)
3. **CDN**: Use CDN for DDoS protection and static assets
4. **Monitoring**: Set up uptime monitoring and alerting
5. **Backups**: Regular encrypted backups with tested restoration
6. **Key Rotation**: Rotate JWT secrets periodically
7. **Access Logging**: Enable database query logging
8. **Penetration Testing**: Conduct professional security audit
9. **Incident Response**: Document and practice incident response plan

### For Development Environment

1. **Never commit secrets**: Use `.env` files (gitignored)
2. **Use strong passwords**: Even for development databases
3. **Keep dependencies updated**: Regular security updates
4. **Run security audits**: `npm audit` regularly
5. **Code review**: Review security-critical changes

---

## Responsible Disclosure

### Reporting Security Issues

If you discover a security vulnerability in VoteSecure:

1. **Do NOT** open a public GitHub issue
2. **Do NOT** attempt to exploit the vulnerability
3. **DO** report privately via email: [security@example.com]
4. **DO** include detailed reproduction steps
5. **DO** allow reasonable time for response before public disclosure

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if any)
- Your contact information for follow-up

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix Implementation**: Depends on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: Next release

---

## Security Checklist

### Authentication
- [ ] Passwords hashed with bcrypt (12+ rounds)
- [ ] JWT tokens have short expiration
- [ ] Refresh token rotation implemented
- [ ] Failed login rate limiting active
- [ ] Account lockout after repeated failures

### Authorization
- [ ] RBAC enforced on all endpoints
- [ ] Resource ownership validated
- [ ] No IDOR vulnerabilities
- [ ] Admin actions require appropriate role

### Input Validation
- [ ] All inputs validated with Zod
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (output encoding)
- [ ] File uploads validated (if applicable)

### Data Protection
- [ ] HTTPS enforced in production
- [ ] Sensitive data encrypted at rest
- [ ] No secrets in code or version control
- [ ] Environment variables properly configured

### Audit & Monitoring
- [ ] All security events logged
- [ ] Audit logs are append-only
- [ ] Failed authentication attempts logged
- [ ] Administrative actions logged

### Voting Security
- [ ] Duplicate vote prevention (database constraint)
- [ ] Vote submission is idempotent
- [ ] Election state transitions enforced server-side
- [ ] Ballot integrity hashes generated

---

## Glossary

| Term | Definition |
|------|------------|
| **IDOR** | Insecure Direct Object Reference — accessing resources by guessing IDs |
| **RBAC** | Role-Based Access Control — authorization based on user roles |
| **JWT** | JSON Web Token — stateless authentication token |
| **bcrypt** | Password hashing algorithm with adjustable work factor |
| **CORS** | Cross-Origin Resource Sharing — controls cross-origin requests |
| **HSTS** | HTTP Strict Transport Security — forces HTTPS |
| **WAF** | Web Application Firewall — filters malicious requests |
| **NOTA** | None of the Above — ballot option to reject all candidates |
| **TDE** | Transparent Data Encryption — encryption at rest |

---

*Last updated: 2026-09-15*
