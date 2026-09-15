# VoteSecure — API Reference

## Overview

VoteSecure exposes a RESTful API for all operations. Every endpoint requires authentication (except login/register) and role-based authorization.

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.votesecure.example.com/api
```

## Authentication

### JWT Token Format

```typescript
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "voter" | "election_officer" | "admin" | "super_admin",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Token Transmission

```http
Authorization: Bearer <jwt_token>
```

### Token Storage

- **Access Token**: Memory or httpOnly cookie
- **Refresh Token**: httpOnly cookie (if using refresh flow)

---

## Response Format

### Success Response

```typescript
{
  "success": true,
  "data": { ... },           // Single item
  // OR
  "data": [ ... ],           // Array of items
  // OR
  "data": {
    "items": [ ... ],        // Paginated array
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Error Response

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [              // Optional, for validation errors
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Login | 5 attempts | 15 minutes |
| Password Reset | 3 attempts | 1 hour |
| Voting | 1 attempt | Per election |
| General API | 100 requests | 15 minutes |

Rate limit headers included in response:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## API Endpoints

### Authentication

#### POST /auth/login

Authenticate user and receive JWT token.

**Request:**
```typescript
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "voter",
      "profile": {
        "fullName": "John Doe",
        "studentId": "STU-2024-001"
      }
    }
  }
}
```

**Rate Limit:** 5 attempts per 15 minutes

---

#### POST /auth/register

Create new user account.

**Request:**
```typescript
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "role": "voter",
  "profile": {
    "fullName": "Jane Smith",
    "studentId": "STU-2024-002",
    "department": "Computer Science",
    "phone": "+1-555-0123"
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "role": "voter"
    },
    "message": "Registration successful. Please verify your email."
  }
}
```

---

#### POST /auth/logout

Invalidate current session.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```typescript
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### GET /auth/me

Get current authenticated user.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "voter",
    "isActive": true,
    "emailVerifiedAt": "2026-01-15T10:30:00Z",
    "profile": {
      "fullName": "John Doe",
      "studentId": "STU-2024-001",
      "department": "Computer Science",
      "isVerified": true
    }
  }
}
```

---

#### PUT /auth/profile

Update current user's profile.

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```typescript
{
  "fullName": "John Doe Updated",
  "phone": "+1-555-9999",
  "department": "Computer Science"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "John Doe Updated",
    "phone": "+1-555-9999"
  }
}
```

---

#### POST /auth/change-password

Change current user's password.

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```typescript
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response:**
```typescript
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### Elections

#### GET /elections

List all elections (filtered by user role and permissions).

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter by status: draft, scheduled, open, closed, results_published, archived |
| `search` | string | - | Search by title or description |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `sortBy` | string | start_time | Sort field |
| `sortOrder` | string | desc | Sort order: asc, desc |

**Response:**
```typescript
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Student Council Election 2026",
        "description": "Annual student council election",
        "type": "student",
        "status": "open",
        "startTime": "2026-03-01T09:00:00Z",
        "endTime": "2026-03-01T18:00:00Z",
        "positionsCount": 5,
        "candidatesCount": 15,
        "totalVotes": 1234,
        "createdAt": "2026-02-15T10:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

**Authorization:**
- `voter`: Can view elections they're eligible for
- `admin`: Can view elections they created + all non-draft elections
- `super_admin`: Can view all elections

---

#### GET /elections/:id

Get single election details.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Student Council Election 2026",
    "description": "Annual student council election for student representatives",
    "type": "student",
    "status": "open",
    "startTime": "2026-03-01T09:00:00Z",
    "endTime": "2026-03-01T18:00:00Z",
    "createdBy": {
      "id": "uuid",
      "email": "admin@college.edu",
      "profile": { "fullName": "Admin User" }
    },
    "settings": {
      "allowNOTA": true,
      "resultVisibility": "after_close",
      "requireStudentId": true
    },
    "positions": [
      {
        "id": "uuid",
        "title": "President",
        "description": "Student council president",
        "displayOrder": 1,
        "candidatesCount": 3
      }
    ],
    "integrityHash": "sha256:abc123...",
    "createdAt": "2026-02-15T10:00:00Z",
    "updatedAt": "2026-02-28T15:00:00Z"
  }
}
```

---

#### POST /elections

Create new election (admin/super_admin only).

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```typescript
{
  "title": "Department Representative Election",
  "description": "Election for CS department representative",
  "type": "student",
  "startTime": "2026-04-01T09:00:00Z",
  "endTime": "2026-04-01T18:00:00Z",
  "settings": {
    "allowNOTA": true,
    "resultVisibility": "after_close",
    "requireStudentId": true
  },
  "positions": [
    {
      "title": "Representative",
      "description": "Department representative",
      "displayOrder": 1,
      "maxSelections": 1
    }
  ]
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Department Representative Election",
    "status": "draft",
    "positions": [
      {
        "id": "uuid",
        "title": "Representative"
      }
    ],
    "createdAt": "2026-03-01T10:00:00Z"
  }
}
```

**Authorization:** `admin`, `super_admin`

---

#### PUT /elections/:id

Update election (only if status is `draft` or `scheduled`).

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```typescript
{
  "title": "Updated Election Title",
  "description": "Updated description",
  "startTime": "2026-04-02T09:00:00Z",
  "endTime": "2026-04-02T18:00:00Z"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Updated Election Title",
    "status": "draft",
    "updatedAt": "2026-03-01T11:00:00Z"
  }
}
```

**Authorization:** `admin` (own elections), `super_admin` (all elections)

---

#### POST /elections/:id/open

Open election for voting (transitions status to `open`).

**Headers:**
```http
Authorization: Bearer <token>
```

**Preconditions:**
- Election status must be `scheduled`
- Start time must be now or in the future
- At least one candidate must be approved

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "open",
    "openedAt": "2026-03-01T09:00:00Z"
  }
}
```

**Authorization:** `admin`, `super_admin`

---

#### POST /elections/:id/close

Close election (transitions status to `closed`).

**Headers:**
```http
Authorization: Bearer <token>
```

**Preconditions:**
- Election status must be `open`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "closed",
    "closedAt": "2026-03-01T18:00:00Z",
    "totalVotes": 1234
  }
}
```

**Authorization:** `admin`, `super_admin`

---

#### POST /elections/:id/publish-results

Publish election results (transitions status to `results_published`).

**Headers:**
```http
Authorization: Bearer <token>
```

**Preconditions:**
- Election status must be `closed` or `counting`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "results_published",
    "publishedAt": "2026-03-01T20:00:00Z"
  }
}
```

**Authorization:** `admin`, `super_admin`

---

#### GET /elections/:id/results

Get election results (only if results are visible).

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "electionId": "uuid",
    "title": "Student Council Election 2026",
    "status": "results_published",
    "totalEligibleVoters": 2450,
    "totalVotesCast": 1234,
    "turnoutPercentage": 50.37,
    "positions": [
      {
        "id": "uuid",
        "title": "President",
        "results": [
          {
            "candidateId": "uuid",
            "candidateName": "Alice Johnson",
            "voteCount": 567,
            "percentage": 45.94,
            "isWinner": true
          },
          {
            "candidateId": "uuid",
            "candidateName": "Bob Smith",
            "voteCount": 432,
            "percentage": 35.01,
            "isWinner": false
          },
          {
            "candidateId": "uuid",
            "candidateName": "Charlie Brown",
            "voteCount": 235,
            "percentage": 19.04,
            "isWinner": false
          },
          {
            "candidateId": null,
            "candidateName": "NOTA",
            "voteCount": 0,
            "percentage": 0,
            "isWinner": false
          }
        ]
      }
    ]
  }
}
```

**Result Visibility Rules:**
- `hidden`: Only super_admin can see
- `admin_only`: Only admin and super_admin
- `live`: Anyone can see (updates in real-time)
- `after_close`: Anyone can see after election closes
- `manual`: Only after manual publication

---

#### GET /elections/:id/voters

Get list of eligible voters for election (admin only).

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `voted` | boolean | all | Filter by voting status |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```typescript
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "voterId": "uuid",
        "studentId": "STU-2024-001",
        "fullName": "John Doe",
        "isEligible": true,
        "hasVoted": true,
        "votedAt": "2026-03-01T10:30:00Z"
      }
    ],
    "total": 2450,
    "page": 1,
    "limit": 20,
    "stats": {
      "totalEligible": 2450,
      "totalVoted": 1234,
      "turnoutPercentage": 50.37
    }
  }
}
```

**Authorization:** `admin`, `super_admin`

---

### Candidates

#### GET /candidates

List candidates (filtered by election).

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `electionId` | uuid | required | Filter by election |
| `positionId` | uuid | all | Filter by position |
| `status` | string | all | Filter by status |

**Response:**
```typescript
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "electionId": "uuid",
      "positionId": "uuid",
      "positionTitle": "President",
      "name": "Alice Johnson",
      "photoUrl": "/uploads/candidates/alice.jpg",
      "manifesto": "I will improve campus facilities...",
      "party": "Student Alliance",
      "status": "approved",
      "createdAt": "2026-02-15T12:00:00Z"
    }
  ]
}
```

---

#### POST /candidates

Add candidate to election (admin only).

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```typescript
{
  "electionId": "uuid",
  "positionId": "uuid",
  "name": "Alice Johnson",
  "photoUrl": "/uploads/candidates/alice.jpg",
  "manifesto": "I will improve campus facilities and increase student engagement...",
  "party": "Student Alliance",
  "status": "approved"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Alice Johnson",
    "status": "approved",
    "createdAt": "2026-02-15T12:00:00Z"
  }
}
```

**Authorization:** `admin` (own elections), `super_admin` (all elections)

---

#### PUT /candidates/:id

Update candidate (only if election is in draft/scheduled status).

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```typescript
{
  "name": "Alice Johnson Updated",
  "manifesto": "Updated manifesto...",
  "status": "approved"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Alice Johnson Updated",
    "updatedAt": "2026-02-15T13:00:00Z"
  }
}
```

---

#### DELETE /candidates/:id

Remove candidate from election.

**Headers:**
```http
Authorization: Bearer <token>
```

**Preconditions:**
- Election must be in `draft` or `scheduled` status
- Candidate must not have received any votes

**Response:**
```typescript
{
  "success": true,
  "message": "Candidate removed successfully"
}
```

---

### Voting

#### POST /voting/ballot

Submit a ballot (voter only).

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```typescript
{
  "electionId": "uuid",
  "choices": [
    {
      "positionId": "uuid",
      "candidateId": "uuid"
    },
    {
      "positionId": "uuid",
      "candidateId": null  // NOTA
    }
  ]
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "ballotId": "uuid",
    "confirmationToken": "CONFIRM-abc123...",
    "message": "Your vote has been recorded successfully.",
    "votedAt": "2026-03-01T10:30:00Z"
  }
}
```

**Error Responses:**
| Error | Code | Description |
|-------|------|-------------|
| Not eligible | `NOT_ELIGIBLE` | Voter not eligible for this election |
| Already voted | `ALREADY_VOTED` | Voter has already voted |
| Election closed | `ELECTION_CLOSED` | Election is not open for voting |
| Invalid choice | `INVALID_CHOICE` | Candidate not valid for position |

**Rate Limit:** 1 attempt per election per voter

**Idempotent:** Yes (returns same result for duplicate requests)

---

#### GET /voting/status/:electionId

Check if current voter has voted in election.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "electionId": "uuid",
    "isEligible": true,
    "hasVoted": true,
    "votedAt": "2026-03-01T10:30:00Z"
  }
}
```

---

#### GET /voting/history

Get current voter's voting history.

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```typescript
{
  "success": true,
  "data": {
    "items": [
      {
        "electionId": "uuid",
        "electionTitle": "Student Council Election 2026",
        "votedAt": "2026-03-01T10:30:00Z",
        "status": "submitted"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

**Note:** Does NOT reveal which candidates were voted for.

---

### Voters (Admin Management)

#### GET /voters

List all voters (admin only).

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Search by name, email, or student ID |
| `department` | string | all | Filter by department |
| `verified` | boolean | all | Filter by verification status |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```typescript
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "userId": "uuid",
        "email": "student@college.edu",
        "studentId": "STU-2024-001",
        "fullName": "John Doe",
        "department": "Computer Science",
        "yearOfStudy": 3,
        "isVerified": true,
        "isActive": true,
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ],
    "total": 2450,
    "page": 1,
    "limit": 20
  }
}
```

---

#### POST /voters/import

Bulk import voters (admin only).

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request:**
```
file: voters.csv
```

**CSV Format:**
```csv
student_id,full_name,email,department,year_of_study,phone
STU-2024-001,John Doe,john@college.edu,Computer Science,3,+1-555-0123
STU-2024-002,Jane Smith,jane@college.edu,Computer Science,2,+1-555-0456
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "importId": "uuid",
    "totalRows": 100,
    "successful": 95,
    "failed": 5,
    "errors": [
      {
        "row": 23,
        "error": "Email already exists"
      }
    ]
  }
}
```

---

#### PATCH /voters/:id/status

Update voter verification status.

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```typescript
{
  "isVerified": true
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "isVerified": true,
    "verifiedAt": "2026-02-15T14:00:00Z"
  }
}
```

---

### Admin Dashboard

#### GET /admin/dashboard

Get dashboard statistics (admin only).

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "stats": {
      "totalVoters": 2450,
      "eligibleVoters": 2200,
      "verifiedVoters": 2100,
      "activeElections": 2,
      "upcomingElections": 3,
      "completedElections": 15,
      "totalVotesCast": 4500,
      "turnoutPercentage": 65.5
    },
    "recentElections": [
      {
        "id": "uuid",
        "title": "Student Council Election",
        "status": "open",
        "totalVotes": 1234,
        "turnoutPercentage": 50.37,
        "endTime": "2026-03-01T18:00:00Z"
      }
    ],
    "recentAuditLogs": [
      {
        "id": "uuid",
        "action": "ELECTION_OPENED",
        "actorEmail": "admin@college.edu",
        "targetType": "election",
        "createdAt": "2026-03-01T09:00:00Z"
      }
    ]
  }
}
```

---

#### GET /admin/audit-logs

Get audit logs (admin only).

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `action` | string | all | Filter by action type |
| `actorId` | uuid | all | Filter by actor |
| `startDate` | ISO date | all | Filter from date |
| `endDate` | ISO date | all | Filter to date |
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page |

**Response:**
```typescript
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "action": "ELECTION_OPENED",
        "actorId": "uuid",
        "actorEmail": "admin@college.edu",
        "actorName": "Admin User",
        "targetType": "election",
        "targetId": "uuid",
        "metadata": {
          "electionTitle": "Student Council Election",
          "previousStatus": "scheduled",
          "newStatus": "open"
        },
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2026-03-01T09:00:00Z"
      }
    ],
    "total": 1500,
    "page": 1,
    "limit": 50
  }
}
```

---

#### GET /admin/settings

Get system settings.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "siteName": "VoteSecure",
    "allowRegistration": true,
    "requireEmailVerification": true,
    "defaultElectionDuration": 8,
    "maxCandidatesPerPosition": 10,
    "enableNOTA": true,
    "resultVisibility": "after_close"
  }
}
```

---

#### PUT /admin/settings

Update system settings (super_admin only).

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```typescript
{
  "allowRegistration": true,
  "requireEmailVerification": true,
  "defaultElectionDuration": 8
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "message": "Settings updated successfully",
    "updatedAt": "2026-03-01T10:00:00Z"
  }
}
```

**Authorization:** `super_admin` only

---

### Notifications

#### GET /notifications

Get current user's notifications.

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `unreadOnly` | boolean | false | Only unread notifications |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```typescript
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Election Results Published",
        "message": "Results for Student Council Election are now available.",
        "type": "info",
        "isRead": false,
        "link": "/elections/uuid/results",
        "createdAt": "2026-03-01T20:00:00Z"
      }
    ],
    "total": 15,
    "unreadCount": 3,
    "page": 1,
    "limit": 20
  }
}
```

---

#### PATCH /notifications/:id/read

Mark notification as read.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "isRead": true,
    "readAt": "2026-03-01T21:00:00Z"
  }
}
```

---

#### PATCH /notifications/read-all

Mark all notifications as read.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "markedCount": 3
  }
}
```

---

#### DELETE /notifications/:id

Delete notification.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```typescript
{
  "success": true,
  "message": "Notification deleted"
}
```

---

## Authorization Summary

| Endpoint | Auth Required | Roles |
|----------|---------------|-------|
| POST /auth/login | No | - |
| POST /auth/register | No | - |
| POST /auth/logout | Yes | Any |
| GET /auth/me | Yes | Any |
| PUT /auth/profile | Yes | Any |
| POST /auth/change-password | Yes | Any |
| GET /elections | Yes | Any |
| GET /elections/:id | Yes | Any (filtered) |
| POST /elections | Yes | admin, super_admin |
| PUT /elections/:id | Yes | admin (own), super_admin |
| POST /elections/:id/open | Yes | admin, super_admin |
| POST /elections/:id/close | Yes | admin, super_admin |
| POST /elections/:id/publish-results | Yes | admin, super_admin |
| GET /elections/:id/results | Yes | Any (visibility rules) |
| GET /elections/:id/voters | Yes | admin, super_admin |
| GET /candidates | Yes | Any |
| POST /candidates | Yes | admin, super_admin |
| PUT /candidates/:id | Yes | admin (own), super_admin |
| DELETE /candidates/:id | Yes | admin (own), super_admin |
| POST /voting/ballot | Yes | voter |
| GET /voting/status/:electionId | Yes | Any |
| GET /voting/history | Yes | Any |
| GET /voters | Yes | admin, super_admin |
| POST /voters/import | Yes | admin, super_admin |
| PATCH /voters/:id/status | Yes | admin, super_admin |
| GET /admin/dashboard | Yes | admin, super_admin |
| GET /admin/audit-logs | Yes | admin, super_admin |
| GET /admin/settings | Yes | Any |
| PUT /admin/settings | Yes | super_admin |
| GET /notifications | Yes | Any |
| PATCH /notifications/:id/read | Yes | Any |
| PATCH /notifications/read-all | Yes | Any |
| DELETE /notifications/:id | Yes | Any |

---

*Last updated: 2026-09-15*
