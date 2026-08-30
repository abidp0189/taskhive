# Microjob Marketplace Platform — Product & Implementation Specification

> **Purpose:** This document is a build specification for Antigravity (or another coding agent) to implement a complete, production-oriented microjob marketplace.
>
> **Primary reference:** `https://workupjob.com/job`
>
> **Important:** Do **not** copy the reference site's branding, text, assets, or code. Use it only to understand workflow patterns and information architecture. Build an original UI and implementation.

---

# 1. Project Understanding

The owner requirements describe a **microjob marketplace** with three main actors:

1. **Worker** — browses small tasks, completes them, submits proof, and earns money after approval.
2. **Employer / Client** — deposits funds, creates jobs, specifies worker count and reward, and reviews completed work.
3. **Admin** — manages users, jobs, submissions, balances, withdrawals, fraud, and platform configuration.

The core business workflow is:

```text
Employer deposits funds
        ↓
Employer creates a job
        ↓
Admin validation (optional/configurable)
        ↓
Job becomes active
        ↓
Workers browse eligible jobs
        ↓
Worker reserves/starts a task
        ↓
Worker completes instructions
        ↓
Worker submits required proof
        ↓
Employer/Admin reviews submission
        ↓
Approved → worker earning balance credited
Rejected → worker can optionally resubmit
        ↓
Worker requests withdrawal
        ↓
Admin approves/processes withdrawal
```

The supplied feature list explicitly requires registration/login, worker dashboard, jobs, proof submission, earnings, withdrawals, profile/referral, employer job creation/reviewing, and a powerful admin panel. It also specifies the proof → review → reward workflow. fileciteturn0file0L3-L12 fileciteturn0file0L20-L33 fileciteturn0file0L36-L48

---

# 2. Requirements Analysis: What Is Clear vs What Needs Assumptions

## 2.1 Clearly Required (Must Build)

### Authentication
- Registration
- Login/logout
- Password reset
- Email verification
- Secure sessions/JWT
- Role-based authorization

### Worker Features
- Dashboard
- Browse available jobs
- Job details
- Start/reserve task
- Submit proof
- View submitted jobs
- Track pending/approved/rejected tasks
- Earnings balance
- Withdrawal request
- Profile
- Referral system
- Notifications
- Transaction history

### Employer Features
- Employer dashboard
- Deposit balance
- Create job
- Set worker quantity
- Set reward per worker/task
- Select category and target location
- Provide instructions
- Define proof requirements
- Review submissions
- Approve/reject/resubmit
- View job statistics

### Admin Features
- User management
- Job management
- Submission moderation
- Withdrawal management
- Manual balance adjustments
- Reports
- Fraud detection / suspicious activity flags

These requirements come directly from the owner's feature document. fileciteturn0file0L3-L33

---

## 2.2 Features Observed in the Demo / Reference Material

The provided screenshots and reference platform suggest additional functionality that should be included or kept configurable:

### Job discovery
- Category filter
- Location/region filter
- Sort controls
- Pinned jobs
- Job progress indicators
- Reward display
- Remaining worker slots

### Job posting wizard
A 4-step flow is recommended:

1. Select location
2. Select category/subcategory
3. Job information
4. Budget & scheduling

Observed configuration concepts include:
- region targeting
- country targeting
- category
- subcategory
- title
- optional note
- task instructions
- required proof
- worker count
- reward per worker
- screenshot requirements
- estimated duration/days
- scheduling/start time

### Wallet
The demo material shows separation between concepts similar to:
- earnings balance
- deposit balance
- transaction history
- withdrawal history
- deposit methods
- currency conversion

### Additional modules visible in the screenshots
These should be treated as **Phase 2 / configurable modules**, unless the owner confirms they are mandatory:
- Premium subscription
- Advertisement/banner purchasing
- Ticket/lottery/event system
- Top worker / leaderboard statistics
- Account health score
- Detailed user analytics
- Multiple deposit providers

---

# 3. Recommended Product Scope

Build the platform in three layers:

## Phase A — Core MVP (Highest Priority)

- Authentication
- Worker dashboard
- Employer job creation
- Job browsing
- Task submission
- Submission approval/rejection
- Wallet ledger
- Manual withdrawal requests
- Referral system
- Admin panel
- Notifications

## Phase B — Marketplace Improvements

- Country targeting
- Advanced search/filtering
- Job scheduling
- Pinned jobs
- Employer analytics
- Fraud detection rules
- File/image proof storage
- Email notifications
- Support tickets
- Premium plans

## Phase C — Optional Business Features

- Payment gateway integration
- Automated payouts
- Advertisement marketplace
- Lucky draw/ticket system
- Mobile app API
- KYC/live verification
- Advanced fraud scoring
- Real-time notifications

Do **not** delay the core task lifecycle for optional features.

---

# 4. Recommended Technology Stack

Use a modern JavaScript/TypeScript stack for maintainability.

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui or a clean component library
- React Router
- TanStack Query
- React Hook Form + Zod
- Zustand only where global client state is genuinely needed

## Backend
- Node.js
- Express.js or NestJS
- TypeScript
- Prisma ORM
- REST API

## Database
- MySQL

## Storage
- S3-compatible object storage for screenshots/proofs
- Local development fallback

## Authentication
- JWT access token
- Refresh token rotation
- HTTP-only secure refresh cookie
- bcrypt/argon2 password hashing

## Deployment
- Docker + Docker Compose
- Nginx reverse proxy
- Environment-based configuration

The original requirement document recommends a JavaScript frontend, Node.js/Laravel backend, MySQL, custom admin panel, and starting withdrawals manually before integrating payment APIs. fileciteturn0file0L43-L50

---

# 5. Monorepo Structure

Create a monorepo:

```text
microjob-platform/
│
├── apps/
│   ├── web/                 # React frontend
│   ├── api/                 # Node/Express backend
│   └── admin/               # Optional separate admin frontend
│
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── types/               # Shared TypeScript types
│   └── config/              # Shared configs
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   ├── FLOWS.md
│   └── OWNER_QUESTIONS.md
│
├── docker-compose.yml
├── .env.example
├── README.md
└── package.json
```

If monorepo complexity slows development, a simpler structure is acceptable:

```text
frontend/
backend/
README.md
```

---

# 6. User Roles and Permissions

## 6.1 Worker

Can:
- Register/login
- Complete profile
- Browse jobs
- Start eligible jobs
- Submit proof
- View task history
- View earnings
- Request withdrawal
- Use referral link
- Receive notifications

Cannot:
- Approve own work
- Modify job reward
- Access admin data
- Withdraw unavailable/pending funds

## 6.2 Employer

Can:
- Maintain deposit wallet
- Create jobs
- Edit draft jobs
- Pause/cancel eligible jobs
- Review submissions
- Approve/reject submissions
- View job statistics

Cannot:
- Directly modify worker balances
- Approve submissions after job ownership changes
- Access other employers' jobs

## 6.3 Admin

Can:
- Manage all users
- Suspend/ban users
- Manage jobs
- Review submissions
- Process withdrawals
- Adjust balances with audit logs
- Configure fees and limits
- Manage categories and countries
- View fraud reports
- Configure referral percentages

## 6.4 Moderator (Optional)

Limited admin role:
- Review jobs
- Review proofs
- Handle reports

No direct access to financial configuration.

---

# 7. Core Data Model

Use proper relational modeling and money-safe decimal fields.

## 7.1 User

```text
User
- id
- name
- email
- passwordHash
- role (WORKER | EMPLOYER | ADMIN | MODERATOR)
- status (ACTIVE | SUSPENDED | BANNED | PENDING_VERIFICATION)
- avatarUrl
- countryId
- referralCode
- referredByUserId
- emailVerifiedAt
- lastLoginAt
- createdAt
- updatedAt
```

A single account may eventually act as both worker and employer. Prefer permissions/capabilities over forcing separate accounts.

---

## 7.2 Category

```text
Category
- id
- name
- slug
- description
- icon
- isActive
- sortOrder
```

```text
Subcategory
- id
- categoryId
- name
- slug
- isActive
```

Seed categories inspired by the demo but keep them admin-configurable:

- Social media
- Website visit
- Video watching
- Search/click
- Sign-up
- App testing
- Survey
- Data entry
- Writing
- Graphics design
- Programming
- Referral
- Review
- Typing
- Audio/music
- Other

Do not hard-code categories into frontend logic.

---

## 7.3 Job

```text
Job
- id
- employerId
- categoryId
- subcategoryId
- title
- shortDescription
- instructions
- proofRequirements
- targetUrl (nullable)
- rewardPerWorker
- totalWorkers
- completedWorkers
- approvedWorkers
- rejectedWorkers
- status
- visibility
- priority
- startAt
- endAt
- createdAt
- updatedAt
```

### Job Status

```text
DRAFT
PENDING_REVIEW
ACTIVE
PAUSED
COMPLETED
EXPIRED
REJECTED
CANCELLED
```

### Visibility

```text
NORMAL
PINNED
PREMIUM
```

---

## 7.4 Job Targeting

A job can target regions/countries.

```text
JobTarget
- id
- jobId
- targetType (GLOBAL | REGION | COUNTRY)
- regionCode
- countryCode
```

Workers should only see jobs matching their location rules, unless the job is global.

---

## 7.5 Task Assignment

This is extremely important. A job is not the same thing as a worker's task instance.

```text
TaskAssignment
- id
- jobId
- workerId
- status
- startedAt
- submittedAt
- reviewedAt
- reviewerId
- rejectionReason
- rewardAmount
- resubmitCount
- expiresAt
```

### Task Status

```text
RESERVED
IN_PROGRESS
SUBMITTED
APPROVED
REJECTED
RESUBMIT_REQUIRED
EXPIRED
CANCELLED
```

Prevent a worker from creating multiple assignments for the same job unless explicitly allowed.

---

## 7.6 Submission Proof

```text
SubmissionProof
- id
- assignmentId
- type (TEXT | URL | IMAGE | FILE)
- content
- fileUrl
- createdAt
```

A proof requirement can accept multiple proof types.

Examples:
- Screenshot
- Username
- URL
- Text answer
- Transaction ID

---

## 7.7 Wallet

Do not store financial truth only as a mutable `balance` column.

Use a ledger.

```text
Wallet
- id
- userId
- currency
- availableBalance
- pendingBalance
- lockedBalance
- depositBalance
- createdAt
```

```text
WalletTransaction
- id
- walletId
- type
- amount
- direction (CREDIT | DEBIT)
- status
- referenceType
- referenceId
- description
- balanceAfter
- createdAt
```

Transaction types:

```text
TASK_REWARD
TASK_REVERSAL
DEPOSIT
DEPOSIT_FEE
WITHDRAWAL_REQUEST
WITHDRAWAL_APPROVED
WITHDRAWAL_REJECTED
WITHDRAWAL_FEE
REFERRAL_COMMISSION
ADMIN_ADJUSTMENT
JOB_BUDGET_LOCK
JOB_BUDGET_RELEASE
JOB_BUDGET_SPEND
```

**Never use JavaScript floating-point arithmetic for money.**

---

## 7.8 Withdrawal

```text
WithdrawalRequest
- id
- userId
- amount
- fee
- netAmount
- methodId
- accountDetailsEncrypted
- status
- requestedAt
- processedAt
- processedByAdminId
- rejectionReason
- externalReference
```

Statuses:

```text
PENDING
PROCESSING
PAID
REJECTED
CANCELLED
```

---

## 7.9 Deposit

```text
Deposit
- id
- userId
- amount
- currency
- paymentMethod
- providerReference
- status
- createdAt
- confirmedAt
```

Start with:
- Manual deposit
- Admin confirmation

Later integrate gateways.

---

## 7.10 Referral

```text
Referral
- id
- referrerId
- referredUserId
- createdAt
```

```text
ReferralCommission
- id
- referralId
- sourceType (DEPOSIT | TASK)
- sourceAmount
- commissionRate
- commissionAmount
- walletTransactionId
- createdAt
```

Commission percentages must come from platform configuration, not hard-coded values.

---

## 7.11 Notification

```text
Notification
- id
- userId
- type
- title
- message
- link
- isRead
- createdAt
```

Notify users when:
- task approved
- task rejected
- job paused/completed
- withdrawal status changed
- deposit confirmed
- referral commission credited
- account suspended

---

## 7.12 Audit Log

```text
AuditLog
- id
- actorId
- action
- entityType
- entityId
- oldValue
- newValue
- ipAddress
- userAgent
- createdAt
```

Mandatory for:
- balance changes
- withdrawals
- job approval/rejection
- user bans
- manual financial adjustments

---

# 8. Financial Rules and Escrow Logic

This is one of the most important parts of the system.

## When Employer Creates a Job

Example:

```text
Workers required: 100
Reward per worker: $0.10
Total task budget: $10.00
Platform fee: configurable
```

The system should:

1. Calculate required budget.
2. Validate employer deposit balance.
3. Lock/reserve the required amount.
4. Create the job.
5. Deduct actual cost only according to approved task logic.

Recommended approach:

```text
Employer Deposit Balance
        ↓
Job Budget Locked
        ↓
Worker Submission Approved
        ↓
Job Locked Budget decreases
        ↓
Worker Pending/Available Earnings credited
```

Use database transactions so that task approval and wallet updates are atomic.

The supplied requirement gives the same fundamental lifecycle: worker completes a task, submits proof, the work is reviewed, and approval adds the reward to the worker's balance. fileciteturn0file0L36-L42

---

# 9. Worker User Experience

## 9.1 Worker Dashboard

Show cards:

- Available balance
- Pending earnings
- Available jobs
- Tasks in progress
- Completed tasks
- Pending review

Quick actions:

- Browse Jobs
- My Tasks
- Withdraw
- Referral

Also show:
- Recent transactions
- Recent notifications
- Referral earnings

---

## 9.2 Find Jobs Page

### Filters
- Search title/keyword
- Category
- Subcategory
- Country/region
- Minimum reward
- Maximum reward
- Job type
- Pinned jobs
- Newest

### Job Card

Display:

```text
Job title
Category
Reward
Workers completed / total workers
Time remaining (if applicable)
Country eligibility
Proof type
Pinned badge
Start Job button
```

Do not expose the full sensitive task instructions until the worker is eligible and has started/reserved the task if that is required by business rules.

---

## 9.3 Job Details

Sections:

1. Overview
2. Instructions
3. Required proof
4. Reward
5. Available slots
6. Target location
7. Completion rules
8. Start task button

On start:
- Check user verification status.
- Check location eligibility.
- Check worker has not already completed the job.
- Check job still has slots.
- Create assignment atomically.

---

## 9.4 Submit Proof

Dynamic form based on job requirements.

Possible fields:
- Text input
- URL
- Screenshot upload
- Multiple images
- File upload

Validation:
- Required proof cannot be skipped.
- File type and size limits.
- Prevent executable uploads.
- Virus scan when production storage supports it.

After submission:

```text
IN_PROGRESS → SUBMITTED
```

Worker sees:
- Submission timestamp
- Current status
- Reward amount
- Rejection reason if applicable
- Resubmit button when allowed

---

# 10. Employer User Experience

## 10.1 Employer Dashboard

Cards:

- Deposit balance
- Active jobs
- Total job budget
- Pending submissions
- Approved submissions
- Total spent

Charts:
- Jobs over time
- Spending over time
- Approval/rejection ratio

---

## 10.2 Create Job Wizard

### Step 1 — Location

Options:
- Global
- Region
- Specific countries

The UI should support multi-select country targeting.

### Step 2 — Category

- Category
- Subcategory

Changing category should dynamically load valid subcategories.

### Step 3 — Job Information

Fields:

```text
Job title
Short description
Full task instructions
Target URL (optional)
Required proof instructions
Proof types allowed
Optional note
```

### Step 4 — Budget & Settings

Fields:

```text
Workers required
Reward per worker
Total budget (calculated)
Platform fee (calculated)
Total cost (calculated)
Start date/time
End date/time
Task expiration period
Pinned job option
```

Before submission show a final cost summary.

### Validation

- Minimum reward configurable.
- Minimum worker count configurable.
- Employer must have enough deposit balance.
- Job title length limits.
- Instructions required.
- Proof requirements required.
- Prevent dangerous or prohibited task URLs.

---

# 11. Submission Review System

Employer review page:

```text
Tabs:
- Pending
- Approved
- Rejected
- Resubmission requested
```

For each submission show:
- Worker identifier (privacy-aware)
- Submitted proofs
- Submission time
- Previous review history
- Fraud flags

Actions:
- Approve
- Reject
- Request resubmission

Rejecting must require a reason.

## Approval Transaction

Run in one database transaction:

1. Lock assignment row.
2. Confirm assignment is SUBMITTED.
3. Confirm job has available budget.
4. Change assignment to APPROVED.
5. Update job counters.
6. Debit job escrow/locked budget.
7. Credit worker earnings.
8. Create wallet transactions.
9. Calculate referral commission if applicable.
10. Create notifications.
11. Create audit log.

Make approval **idempotent** to prevent double payment from double clicks/retries.

---

# 12. Admin Panel

Use a separate admin layout with role protection.

## 12.1 Admin Dashboard

Metrics:
- Total users
- Active users
- Total jobs
- Active jobs
- Pending submissions
- Pending withdrawals
- Total deposits
- Total payouts
- Platform fees
- Fraud alerts

## 12.2 User Management

Features:
- Search/filter users
- View profile
- View balances
- View jobs/tasks
- View transaction history
- Suspend
- Ban
- Reactivate
- Manual balance adjustment

Every manual financial change requires:
- amount
- reason
- admin confirmation
- audit log

## 12.3 Job Management

- Search jobs
- View details
- Approve pending jobs
- Reject jobs with reason
- Pause job
- Cancel job
- Force complete/expire
- Review reports

## 12.4 Submission Moderation

Admin can intervene in disputes.

Possible actions:
- Approve
- Reject
- Request resubmission
- Override employer decision with audit reason

## 12.5 Withdrawal Management

Queue view:

```text
User
Amount
Method
Requested date
Risk score
Status
Actions
```

Actions:
- Mark processing
- Mark paid
- Reject

Do not allow a withdrawal to become PAID without recording an audit event and payment reference.

## 12.6 Platform Settings

Configurable values:

```text
Minimum withdrawal amount
Withdrawal fee
Minimum job reward
Minimum job budget
Platform commission
Referral deposit commission
Referral task commission
Maximum proof upload size
Allowed file types
Task expiration duration
Maximum resubmissions
```

---

# 13. Fraud Detection Rules (Initial Version)

Implement simple rule-based detection first.

Flag events such as:

- Same IP used by many accounts
- Same device fingerprint across many accounts
- Many workers submitting identical proof text
- Same screenshot hash reused
- Extremely fast task completion
- High rejection rate
- Multiple accounts using same withdrawal account
- Referral self-loop
- Unusual rapid withdrawals
- Employer repeatedly rejecting all work

Create:

```text
FraudFlag
- id
- userId
- assignmentId
- ruleCode
- severity
- details
- status
- createdAt
- resolvedAt
```

Important: fraud flags should not automatically ban users unless the rule explicitly supports automated action.

---

# 14. Referral System

Each user receives a unique referral code.

Example:

```text
https://yourdomain.com/register?ref=ABC123
```

Registration flow:

```text
Visitor opens referral link
        ↓
Referral code stored temporarily
        ↓
Visitor registers
        ↓
Referral relationship created
        ↓
Future eligible events generate commission
```

Track:
- Total referrals
- Active referrals
- Deposit commissions
- Task commissions
- Total referral earnings

Prevent:
- Self referral
- Circular referral chains
- Changing referrer after account verification (unless admin allows)

---

# 15. Support and Notification System

## Notifications

Implement in-app notifications first.

Optional later:
- Email
- Push notification
- SMS

## Support Tickets

Fields:

```text
Subject
Category
Priority
Message
Attachments
Status
```

Statuses:

```text
OPEN
IN_PROGRESS
WAITING_FOR_USER
RESOLVED
CLOSED
```

---

# 16. Frontend Pages and Routes

## Public

```text
/
/about
/how-it-works
/jobs
/jobs/:slugOrId
/login
/register
/forgot-password
/reset-password
/terms
/privacy
/faq
/contact
```

## Authenticated Worker

```text
/dashboard
/jobs
/jobs/:id
/my-tasks
/my-tasks/:id
/wallet
/withdraw
/withdraw/history
/referral
/profile
/notifications
/transactions
/support
```

## Employer

```text
/employer/dashboard
/employer/jobs
/employer/jobs/new
/employer/jobs/:id
/employer/jobs/:id/edit
/employer/jobs/:id/submissions
/employer/wallet
/employer/transactions
```

## Admin

```text
/admin
/admin/users
/admin/users/:id
/admin/jobs
/admin/jobs/:id
/admin/submissions
/admin/withdrawals
/admin/deposits
/admin/transactions
/admin/fraud
/admin/categories
/admin/countries
/admin/settings
/admin/audit-logs
```

---

# 17. Backend API Design

Use REST endpoints with consistent response format.

## Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email
GET    /api/auth/me
```

## Jobs

```text
GET    /api/jobs
GET    /api/jobs/:id
POST   /api/jobs
PATCH  /api/jobs/:id
POST   /api/jobs/:id/pause
POST   /api/jobs/:id/resume
POST   /api/jobs/:id/cancel
```

## Tasks

```text
POST   /api/jobs/:id/start
GET    /api/tasks
GET    /api/tasks/:id
POST   /api/tasks/:id/submit
POST   /api/tasks/:id/resubmit
```

## Reviews

```text
GET    /api/employer/jobs/:id/submissions
POST   /api/submissions/:id/approve
POST   /api/submissions/:id/reject
POST   /api/submissions/:id/resubmit-request
```

## Wallet

```text
GET    /api/wallet
GET    /api/wallet/transactions
POST   /api/wallet/withdrawals
GET    /api/wallet/withdrawals
POST   /api/deposits
```

## Referral

```text
GET    /api/referral
GET    /api/referral/stats
```

## Admin

```text
GET    /api/admin/dashboard
GET    /api/admin/users
PATCH  /api/admin/users/:id/status
POST   /api/admin/users/:id/balance-adjustment
GET    /api/admin/jobs
PATCH  /api/admin/jobs/:id/status
GET    /api/admin/withdrawals
POST   /api/admin/withdrawals/:id/process
POST   /api/admin/withdrawals/:id/reject
GET    /api/admin/fraud-flags
PATCH  /api/admin/settings
```

---

# 18. API Response Standard

Success:

```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {}
}
```

Paginated:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "rewardPerWorker": "Minimum reward is required"
  }
}
```

---

# 19. UI/UX Direction

The reference platform demonstrates a dense dashboard-based workflow with a left navigation panel, wallet indicators, job lists, filters, and multi-step job posting. Use the workflow, but create a cleaner and more modern interface.

## Design Principles

- Responsive first
- Clear financial information
- Minimal clutter
- Strong task status indicators
- Confirmation dialogs for financial actions
- Accessible forms
- Keyboard navigation
- Mobile-friendly side navigation
- Dark mode optional, not required for MVP

## Suggested Main Navigation

```text
Logo
Dashboard
Find Jobs
Post Job
My Work
My Jobs
Wallet
Referral
Notifications
Support
Profile
```

Use role-aware navigation: workers should not see irrelevant employer/admin controls.

---

# 20. Security Requirements

Mandatory:

- HTTPS in production
- Password hashing with bcrypt or argon2
- JWT expiration
- Refresh token rotation
- Rate limiting
- Input validation with Zod
- SQL injection protection via ORM
- XSS-safe rendering
- CSRF protection if cookie auth is used
- Secure file upload validation
- Authorization middleware on every protected route
- Admin action audit logs
- Environment variables for secrets
- No secrets committed to Git

Additional:
- CAPTCHA after repeated login failures
- Email verification
- Optional 2FA for admins
- Suspicious login alerts

---

# 21. Database Integrity Rules

These constraints are important:

1. One worker cannot complete the same job twice unless explicitly configured.
2. Completed workers cannot exceed `totalWorkers`.
3. Approved submissions cannot be approved again.
4. A rejected submission cannot receive a reward unless explicitly overridden.
5. Withdrawal amount cannot exceed available earnings.
6. Employer cannot create a funded job without sufficient deposit balance.
7. Wallet changes must generate ledger transactions.
8. Admin balance changes must generate audit logs.
9. Referral commission should be generated only once per qualifying event.
10. Job counters should be transaction-safe.

---

# 22. Edge Cases to Handle

## Worker starts task when final slot is available
Use row/database locking or atomic update to avoid oversubscription.

## Two reviewers approve simultaneously
Approval endpoint must be idempotent.

## Employer runs out of funds
New task starts should stop if budget cannot cover another reward.

## Worker submits proof after expiration
Reject submission automatically unless extension is allowed.

## Job is cancelled with active assignments
Define policy:
- Allow active assignments to finish, OR
- Cancel assignments and release reserved budget.

Make this configurable/documented.

## Withdrawal is rejected
Reserved withdrawal funds must return to available balance.

## Payment provider callback arrives twice
Deposit webhooks must use provider transaction IDs and idempotency.

## Referral manipulation
Block self-referral and duplicate commission generation.

---

# 23. Development Plan for Antigravity

## STEP 1 — Initialize Project

Create:

- TypeScript configuration
- Frontend React app
- Backend API
- MySQL connection
- Prisma schema
- ESLint/Prettier
- Environment configuration
- Docker development environment

Deliverable: project runs locally.

---

## STEP 2 — Authentication and RBAC

Implement:

- Register
- Login
- Logout
- Current user
- Password hashing
- JWT/refresh flow
- Role middleware
- Protected routes

Deliverable: Worker, Employer, Admin access control works.

---

## STEP 3 — Database Foundation

Create Prisma models for:

- User
- Role/capability logic
- Category
- Subcategory
- Country
- Job
- JobTarget
- TaskAssignment
- SubmissionProof
- Wallet
- WalletTransaction
- WithdrawalRequest
- Referral
- Notification
- AuditLog
- FraudFlag

Create seed data for categories and test users.

Deliverable: migrations and seed scripts work.

---

## STEP 4 — Worker Job Marketplace

Build:

- Job listing API
- Search/filtering
- Category filter
- Location filter
- Job details
- Eligibility checks
- Start task

Deliverable: worker can discover and reserve a job.

---

## STEP 5 — Proof Submission

Build:

- Dynamic proof requirements
- Text proof
- URL proof
- Screenshot/file upload
- Submission history
- Resubmission flow

Deliverable: complete worker task lifecycle until SUBMITTED.

---

## STEP 6 — Employer Job Creation

Build 4-step wizard:

1. Location
2. Category
3. Job information
4. Budget/settings

Implement:
- Cost calculation
- Validation
- Draft saving
- Submit job

Deliverable: employer can create and fund a job.

---

## STEP 7 — Review and Approval Engine

Implement:

- Pending submission queue
- Proof viewer
- Approve
- Reject
- Resubmit request
- Atomic wallet credit
- Job counter updates
- Notifications

Deliverable: approved task automatically creates earnings.

---

## STEP 8 — Wallet System

Build:

- Earnings balance
- Deposit balance
- Pending/locked balance
- Ledger transactions
- Transaction history
- Employer job budget locking

Deliverable: all financial events are traceable.

---

## STEP 9 — Withdrawal System

Implement manual withdrawal:

- Withdrawal method setup
- Request form
- Minimum amount validation
- Balance reservation
- Admin processing
- Paid/rejected states
- History

Deliverable: end-to-end withdrawal workflow works without payment API.

---

## STEP 10 — Referral System

Implement:

- Unique referral link
- Referral attribution
- Statistics
- Configurable commissions
- Commission ledger entries

Deliverable: referral earnings work correctly.

---

## STEP 11 — Admin Panel

Implement:

- Dashboard metrics
- User management
- Job management
- Submission management
- Withdrawals
- Balance adjustments
- Categories
- Settings
- Fraud flags
- Audit logs

Deliverable: admin can operate the marketplace.

---

## STEP 12 — Notifications and Support

Implement:

- In-app notification center
- Notification triggers
- Support tickets

Deliverable: users receive workflow updates.

---

## STEP 13 — Security and Testing

Add:

- Unit tests for financial calculations
- Integration tests for task approval
- Authorization tests
- API validation tests
- Rate limiting
- File validation
- Error handling

Critical tests:

```text
✓ Cannot approve submission twice
✓ Cannot withdraw more than available balance
✓ Cannot start a full job
✓ Cannot complete same job twice
✓ Referral commission is not duplicated
✓ Employer cannot access another employer's job
✓ Worker cannot approve submissions
✓ Suspended user cannot access protected actions
✓ Wallet ledger remains consistent
```

---

# 24. Acceptance Criteria for MVP

The MVP is complete only when all of these work:

## Worker

- [ ] Can register and login
- [ ] Can browse filtered jobs
- [ ] Can open job details
- [ ] Can start a task
- [ ] Can submit proof
- [ ] Can see submission status
- [ ] Can see approved earnings
- [ ] Can request withdrawal
- [ ] Can see transaction history
- [ ] Can access referral link/statistics

## Employer

- [ ] Can deposit/manage funds (manual initially)
- [ ] Can create job through wizard
- [ ] Can define workers and reward
- [ ] Can review submissions
- [ ] Can approve/reject work
- [ ] Can see job statistics

## Admin

- [ ] Can manage users
- [ ] Can manage jobs
- [ ] Can manage submissions
- [ ] Can process withdrawals
- [ ] Can adjust balances with audit logs
- [ ] Can manage categories/settings
- [ ] Can view fraud flags

## System

- [ ] Wallet ledger is transaction-safe
- [ ] No duplicate rewards
- [ ] Role-based authorization works
- [ ] Mobile layout works
- [ ] Validation and error states are implemented
- [ ] Production environment configuration exists

---

# 25. Owner Questions That Must Be Confirmed

The owner requirements are not fully specified. Before production launch, ask these questions.

## Business Model

1. What currency will the platform use?
2. Is there one wallet or separate earning/deposit wallets?
3. Does the employer pay a platform fee?
4. Is there a fee for withdrawals?
5. What is the minimum withdrawal amount?
6. What is the minimum reward per task?
7. Can employers cancel jobs and receive unused funds?

## Review Process

8. Does employer review all submissions or can admin review too?
9. What is the maximum review time?
10. Can a worker resubmit after rejection?
11. How many resubmissions are allowed?
12. Can workers dispute rejection?

## Worker Eligibility

13. Is account verification required before working?
14. Should jobs be country restricted?
15. Can one person have multiple accounts?
16. Are VPN/proxy users restricted?

## Payment

17. Which deposit methods are required?
18. Which withdrawal methods are required?
19. Are withdrawals manual or automated initially?
20. Which countries must be supported?

## Referral

21. What exact referral percentages apply?
22. Is commission earned from deposits, tasks, or both?
23. Is referral commission lifetime or limited?

## Optional Modules

24. Is premium subscription required?
25. Is the advertisement system required?
26. Is the ticket/lottery system required?
27. Is KYC/live verification required?
28. Is a mobile application planned?

---

# 26. Important Build Instructions for Antigravity

Follow these rules while generating the project:

1. Build incrementally; do not attempt every feature in one uncontrolled step.
2. Complete backend business logic before polishing UI.
3. Use TypeScript end-to-end.
4. Use Prisma migrations; do not manually assume database structure.
5. Never use floating-point numbers for financial calculations.
6. Use database transactions for approvals, wallet operations, and withdrawals.
7. Every financial event must create a ledger record.
8. Every admin financial action must create an audit log.
9. Implement RBAC on backend, not only frontend.
10. Validate all API input server-side.
11. Make approval/payment operations idempotent.
12. Build reusable UI components.
13. Do not hard-code categories, fees, or commission percentages.
14. Add loading, empty, error, and success states for every important screen.
15. Keep optional modules isolated so they can be enabled later.
16. Use seed data for local development.
17. Write clear setup instructions in README.
18. Create `.env.example` without secrets.
19. Add API documentation.
20. Test critical financial workflows before considering the application complete.

---

# 27. Suggested Initial UI Build Order

```text
1. Public landing page
2. Authentication pages
3. App shell/sidebar/header
4. Worker dashboard
5. Job listing
6. Job details
7. Start task + submit proof
8. My tasks
9. Wallet
10. Employer dashboard
11. Create job wizard
12. Submission review
13. Withdrawal pages
14. Referral pages
15. Admin dashboard
16. Admin management pages
17. Notifications/support
18. Optional premium/payment modules
```

---

# 28. Final Definition of the Product

The final product should be a **secure microtask marketplace**, not simply a job listing website.

The most important domain objects are:

```text
USER
  ├── WORKER
  ├── EMPLOYER
  └── ADMIN

JOB
  └── TASK ASSIGNMENT
        └── SUBMISSION PROOF
              └── REVIEW
                    └── WALLET TRANSACTION
                          └── WITHDRAWAL
```

The critical engineering challenge is the combination of:

- job slot management
- proof submission
- approval workflow
- escrow/budget locking
- wallet ledger accuracy
- role permissions
- fraud prevention

**Prioritize correctness of these workflows over copying the visual appearance of the reference website.**

---

# 29. Recommended First Prompt for Antigravity

Use this README as the source of truth and begin with the following implementation goal:

> Build this project incrementally as a production-oriented TypeScript microjob marketplace. Start by scaffolding the monorepo, frontend, backend, MySQL database, Prisma schema, authentication, RBAC, and core domain models. Do not implement optional premium, advertisement, lottery, or payment gateway features until the core worker → submission → review → wallet → withdrawal lifecycle is fully functional and tested. After each major phase, verify the application works before proceeding to the next phase.

