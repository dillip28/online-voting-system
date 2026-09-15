# VoteSecure — Voting Model

## Overview

VoteSecure implements a **privacy-preserving voting model** that separates voter identity from ballot content. This document explains how votes are recorded, what privacy guarantees exist, and what limitations remain.

---

## Core Principle: Identity-Ballot Separation

The fundamental design principle is that **the system knows WHO voted but NOT HOW they voted**.

### Traditional (Insecure) Model

```
┌─────────────────────────────────────────┐
│           VOTE TABLE (INSECURE)          │
├─────────────────────────────────────────┤
│ voter_id  │ candidate_id │ election_id  │
│-----------│--------------│--------------│
│ voter-001 │ candidate-A  │ election-1   │
│ voter-002 │ candidate-B  │ election-1   │
│ voter-003 │ candidate-A  │ election-1   │
└─────────────────────────────────────────┘

PROBLEM: Direct link between voter and vote choice!
```

### VoteSecure (Privacy-Preserving) Model

```
┌─────────────────────────────────────────┐
│         VOTER STATUS TABLE               │
├─────────────────────────────────────────┤
│ election_id │ voter_id   │ has_voted    │
│-------------│------------│--------------│
│ election-1  │ voter-001  │ true         │
│ election-1  │ voter-002  │ true         │
│ election-1  │ voter-003  │ true         │
└─────────────────────────────────────────┘
         │
         │ "These voters voted"
         │ (NO candidate information)
         ▼
┌─────────────────────────────────────────┐
│            BALLOT TABLE                  │
├─────────────────────────────────────────┤
│ ballot_id  │ election_id │ ballot_hash  │
│------------│-------------│--------------│
│ ballot-A   │ election-1  │ sha256...    │
│ ballot-B   │ election-1  │ sha256...    │
│ ballot-C   │ election-1  │ sha256...    │
└─────────────────────────────────────────┘
         │
         │ "These ballots were cast"
         │ (NO voter information)
         ▼
┌─────────────────────────────────────────┐
│         BALLOT CHOICES TABLE             │
├─────────────────────────────────────────┤
│ ballot_id  │ position_id │ candidate_id │
│------------│-------------│--------------│
│ ballot-A   │ position-1  │ candidate-X  │
│ ballot-B   │ position-1  │ candidate-Y  │
│ ballot-C   │ position-1  │ candidate-X  │
└─────────────────────────────────────────┘

RESULT: No direct link between voter and vote choice!
```

---

## Voting Flow

### Step 1: Authentication

```
Voter logs in
    │
    ├── Server validates credentials
    ├── Server creates/validates JWT
    └── Server identifies voter_id from token
```

### Step 2: Eligibility Verification

```
Server checks: Is this voter eligible?
    │
    ├── Does voter_profile exist for this user?
    ├── Is voter registered for this election?
    ├── Is election status = 'open'?
    ├── Has voter already voted? (check has_voted)
    └── Are there any eligibility restrictions?
```

### Step 3: Ballot Presentation

```
Server loads ballot data
    │
    ├── Load positions for this election
    ├── Load approved candidates per position
    ├── Include NOTA option if configured
    └── Send to client (NO sensitive data)
```

### Step 4: Vote Submission (Critical)

```
Voter submits ballot
    │
    ├── Client sends: { election_id, choices: [{ position_id, candidate_id }] }
    │
    └── SERVER-SIDE PROCESSING:
        │
        ├── BEGIN TRANSACTION
        │
        ├── 1. LOCK voter status row
        │      SELECT ... FOR UPDATE
        │
        ├── 2. VERIFY eligibility (again!)
        │      - Check has_voted = false
        │      - Check election is open
        │
        ├── 3. INSERT ballot record
        │      INSERT INTO ballots (id, election_id, ballot_hash)
        │      -- NOTE: NO voter_id column!
        │
        ├── 4. INSERT ballot choices
        │      INSERT INTO ballot_choices (ballot_id, position_id, candidate_id)
        │
        ├── 5. UPDATE voter status
        │      UPDATE election_voter_eligibility
        │      SET has_voted = true, voted_at = NOW()
        │
        ├── 6. GENERATE ballot hash
        │      ballot_hash = SHA256(ballot_contents)
        │
        ├── COMMIT TRANSACTION
        │
        └── Return confirmation to voter
```

### Step 5: Confirmation

```
Voter receives confirmation
    │
    ├── "Your vote has been recorded"
    ├── Confirmation token (for verification)
    └── NO information about HOW they voted
```

---

## Privacy Guarantees

### What We Guarantee

| Guarantee | How It's Achieved |
|-----------|-------------------|
| Vote secrecy | Ballot table has no voter_id column |
| Plausible deniability | Voter can prove they voted, not how |
| No vote-buying | Voter cannot prove specific vote choice |
| Coercion resistance (limited) | Voter can claim they voted differently |

### What We DON'T Guarantee

| Limitation | Risk Level | Explanation |
|------------|------------|-------------|
| Full anonymity | Medium | System knows THAT a voter voted |
| Timing resistance | Low | Server timestamps could be analyzed |
| Insider protection | Medium | DB admins could correlate data |
| End-to-end verifiability | High | Voters cannot independently verify counting |

---

## Duplicate Vote Prevention

### Layer 1: Database Constraint (Primary)

```sql
ALTER TABLE election_voter_eligibility 
ADD CONSTRAINT uq_election_voter 
UNIQUE(election_id, voter_id);
```

This prevents any duplicate entries at the database level.

### Layer 2: Application Logic

```typescript
// In voting service
async submitBallot(electionId: string, voterId: string, choices: Choice[]) {
  return await prisma.$transaction(async (tx) => {
    // 1. Lock and check voter status
    const voterStatus = await tx.electionVoterEligibility.findUnique({
      where: { 
        electionId_voterId: { electionId, voterId } 
      },
      lock: true,  // Row-level lock
    });
    
    if (!voterStatus || voterStatus.hasVoted) {
      throw new Error('Already voted or not eligible');
    }
    
    // 2. Verify election is open
    const election = await tx.election.findUnique({
      where: { id: electionId }
    });
    
    if (election.status !== 'OPEN') {
      throw new Error('Election is not open');
    }
    
    // 3. Create ballot (NO voter_id!)
    const ballot = await tx.ballot.create({
      data: {
        electionId,
        ballotHash: this.generateBallotHash(choices),
      }
    });
    
    // 4. Create ballot choices
    await tx.ballotChoice.createMany({
      data: choices.map(c => ({
        ballotId: ballot.id,
        positionId: c.positionId,
        candidateId: c.candidateId,
      }))
    });
    
    // 5. Mark voter as having voted
    await tx.electionVoterEligibility.update({
      where: { 
        electionId_voterId: { electionId, voterId } 
      },
      data: {
        hasVoted: true,
        votedAt: new Date(),
      }
    });
    
    return { success: true, ballotId: ballot.id };
  });
}
```

### Layer 3: Race Condition Handling

```typescript
// Idempotent voting endpoint
app.post('/api/voting/ballot', async (req, res) => {
  try {
    const result = await votingService.submitBallot(...);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error.message === 'Already voted or not eligible') {
      // Return success anyway (idempotent)
      // But don't create another ballot
      res.json({ success: true, alreadyVoted: true });
    } else {
      throw error;
    }
  }
});
```

### Handling Concurrent Requests

```
Request A (Browser tab 1)     Request B (Browser tab 2)
         │                              │
         ▼                              ▼
    ┌─────────┐                   ┌─────────┐
    │ BEGIN   │                   │ BEGIN   │
    └────┬────┘                   └────┬────┘
         │                              │
         ▼                              ▼
    ┌─────────────────────────────────────┐
    │  LOCK election_voter_eligibility    │
    │  WHERE election_id = X              │
    │  AND voter_id = Y                   │
    │  FOR UPDATE                         │
    └─────────────────────────────────────┘
         │                              │
         ▼                              ▼
    Request A gets lock           Request B waits...
         │                              │
         ▼                              │
    ┌─────────┐                        │
    │ CHECK   │ ← has_voted = false    │
    └────┬────┘                        │
         │                              │
         ▼                              ▼
    ┌─────────┐                   ┌─────────┐
    │ INSERT  │                   │ (lock   │
    │ ballot  │                   │  acquired│)
    └────┬────┘                   └────┬────┘
         │                              │
         ▼                              ▼
    ┌─────────┐                   ┌─────────┐
    │ UPDATE  │                   │ CHECK   │ ← has_voted = true!
    │ has_voted│                  └────┬────┘
    └────┬────┘                        │
         │                              ▼
         ▼                         ┌─────────┐
    ┌─────────┐                    │ ROLLBACK│
    │ COMMIT  │                    └─────────┘
    └─────────┘
         │
         ▼
    Success!                  → Already voted (idempotent response)
```

---

## Ballot Integrity

### Ballot Hash Generation

```typescript
function generateBallotHash(choices: Choice[]): string {
  // Sort choices deterministically
  const sortedChoices = choices
    .sort((a, b) => a.positionId.localeCompare(b.positionId))
    .map(c => `${c.positionId}:${c.candidateId || 'NOTA'}`)
    .join('|');
  
  // Add election ID and timestamp
  const ballotString = `${electionId}|${sortedChoices}|${Date.now()}`;
  
  // Generate SHA-256 hash
  return createHash('sha256').update(ballotString).digest('hex');
}
```

### Integrity Verification

After election closes, administrators can verify:

1. **Ballot count matches expected**: `COUNT(ballots) = COUNT(voter_status WHERE has_voted = true)`
2. **All ballots have valid hashes**: No empty or NULL hashes
3. **No duplicate ballot IDs**: Ballot IDs are UUIDs, virtually impossible to collide

---

## Threat Analysis

### Attack: Voter tries to vote twice

| Layer | Protection |
|-------|------------|
| Frontend | Button disabled after first vote |
| API | Checks `has_voted` status |
| Database | UNIQUE constraint on `(election_id, voter_id)` |
| Transaction | Row-level lock prevents race conditions |

**Result**: BLOCKED at all layers

### Attack: Coercer tries to verify voter's choice

| Scenario | Result |
|----------|--------|
| Coercer asks voter to prove vote | Voter cannot prove (no receipt with candidate info) |
| Coercer asks system for vote record | System returns: "Voter voted" (no candidate info) |
| Coercer threatens voter | Voter can claim they voted differently (plausible deniability) |

**Result**: LIMITED protection (voter cannot prove choice, but also cannot prove they didn't vote a certain way)

### Attack: Insider tries to correlate votes

| Scenario | Difficulty |
|----------|------------|
| DB admin queries ballot + voter tables | No direct linkage possible |
| DB admin analyzes timestamps | Theoretically possible, but requires ballot ordering knowledge |
| DB admin modifies audit logs | Audit logs are append-only |

**Result**: POSSIBLE but requires significant effort and leaves evidence

### Attack: Attacker modifies vote after submission

| Layer | Protection |
|-------|------------|
| Application | Ballots are immutable after insert |
| Database | No UPDATE/DELETE on ballot_choices |
| Audit | All changes logged |
| Hash | Ballot hash would change if modified |

**Result**: DETECTED and PREVENTED

---

## Comparison with Other Systems

| Feature | VoteSecure | Paper Ballot | Blockchain | End-to-End Verifiable |
|---------|------------|--------------|------------|----------------------|
| Vote secrecy | ✓ | ✓ | ✓ | ✓ |
| No voter-linkage | ✓ | ✓ | ✗ | Varies |
| Coercion resistance | Limited | Limited | ✗ | ✓ |
| End-to-end verifiability | ✗ | ✗ | ✓ | ✓ |
| Auditability | ✓ | Limited | ✓ | ✓ |
| Complexity | Low | Low | High | Very High |

---

## Limitations Acknowledged

### 1. Not Fully Anonymous
The system records that a voter voted (in `election_voter_eligibility`). This is necessary to prevent duplicate voting but means the system is not fully anonymous.

### 2. No End-to-End Verifiability
Voters cannot independently verify that their vote was counted correctly. They must trust the server.

### 3. Server Trust Required
The server is trusted to:
- Count votes honestly
- Not reveal ballot contents
- Not modify votes after submission

### 4. Timing Analysis Possible
Server timestamps could theoretically be used to correlate voters with ballots, though this requires:
- Knowledge of ballot submission order
- Access to server logs
- Significant analysis effort

### 5. No Paper Trail
There is no physical paper ballot to audit. This is a trade-off for online voting convenience.

---

## Future Enhancements (Optional)

### End-to-End Verifiability
- Cryptographic receipts that allow voters to verify counting
- Zero-knowledge proofs for vote verification
- Significantly more complex implementation

### Homomorphic Encryption
- Tally votes without decrypting individual ballots
- Computationally expensive
- Requires key management infrastructure

### Mix-Networks
- Shuffle ballots to break timing correlation
- High complexity
- Not practical for small-scale elections

---

## Conclusion

VoteSecure provides **reasonable privacy protection** suitable for college/university elections where:

- Voters trust the system administrators to some degree
- Complete anonymity is not legally required
- Preventing duplicate voting is critical
- Simplicity and usability are valued

The system is **NOT suitable** for:
- High-stakes political elections requiring end-to-end verifiability
- Scenarios requiring complete voter anonymity
- Environments with untrusted system administrators

---

*Last updated: 2026-09-15*
