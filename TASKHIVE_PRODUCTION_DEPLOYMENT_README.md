# TaskHive / Tomar Kaj — Production Deployment Runbook

> **Purpose:** This document is the single production-deployment workflow for the TaskHive / Tomar Kaj application.
>
> **Target production domain:** `tomarkaj.com`
>
> **Current frontend:** `https://amader-kaj.vercel.app/`
>
> **Repository:** `https://github.com/abidp0189/taskhive`
>
> **Target architecture:** Namecheap + Vercel + Render + Aiven MySQL + Cloudflare R2.
>
> **Primary deployment goal:** Move the current localhost/Vercel application to a stable commercial deployment suitable for an initial user base of approximately 1,000 registered users, with a clean path to scale.

---

## 1. IMPORTANT — READ BEFORE CHANGING CODE

This repository is already a working application. Do **not** rewrite the application or change its business logic just to deploy it.

The deployment work must preserve:

- Worker functionality
- Employer functionality
- Admin functionality
- Authentication and RBAC
- Jobs
- Tasks
- Wallet/ledger logic
- Deposits
- Withdrawals
- Referrals
- Notifications
- Support tickets
- Categories
- Existing Prisma data model
- Existing UI and routes

Only make changes that are required for:

1. Production configuration
2. Security
3. Persistent file storage
4. Domain configuration
5. Environment configuration
6. Reliable database deployment
7. Production testing
8. Monitoring/backup readiness

### Never do these actions without explicit approval

- Drop the production database
- Delete production tables
- Run destructive Prisma commands
- Delete user/financial records
- Change financial/escrow calculations
- Change wallet balances
- Replace MySQL with another database
- Replace the current frontend/backend architecture
- Commit `.env` files or secrets
- Force-push over the production branch
- Delete existing uploaded files

---

# 2. CURRENT APPLICATION AUDIT

## 2.1 Repository

Repository:

```text
https://github.com/abidp0189/taskhive
```

Current branch:

```text
main
```

Repository structure:

```text
taskhive/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── uploads/
│   ├── .env.example
│   └── package.json
│
├── DEPLOYMENT.md
└── README.md
```

The project uses:

- React 19
- Vite
- Tailwind CSS
- React Router
- Axios
- Framer Motion
- React Hook Form
- Node.js
- Express.js
- Prisma ORM
- MySQL
- JWT authentication
- Multer
- Decimal.js
- Helmet
- CORS
- express-rate-limit
- Zod

---

# 3. TARGET PRODUCTION ARCHITECTURE

Use this architecture:

```text
                         INTERNET
                            |
                            v
                    +----------------+
                    |   Namecheap    |
                    |  tomarkaj.com  |
                    +--------+-------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
       +--------------+              +---------------+
       |    Vercel    |              |  Cloudflare   |
       | React / Vite |              |      R2       |
       |  Frontend    |              | Images/Files  |
       +------+-------+              +---------------+
              |
              | HTTPS API
              v
       +--------------+
       |    Render    |
       | Node/Express |
       |    Backend   |
       +------+-------+
              |
              | TLS MySQL
              v
       +--------------+
       |    Aiven     |
       |    MySQL     |
       |   Database   |
       +--------------+
```

Production domains:

```text
https://tomarkaj.com
https://www.tomarkaj.com
https://api.tomarkaj.com
https://cdn.tomarkaj.com
```

Responsibilities:

| Service | Responsibility |
|---|---|
| Namecheap | Domain registration/DNS |
| Vercel | React frontend |
| Render | Node/Express API |
| Aiven | MySQL database |
| Cloudflare R2 | Uploaded images/files |
| GitHub | Source control / deployment trigger |

---

# 4. DEPLOYMENT ORDER

Follow this order.

```text
1. Audit local application
        ↓
2. Clean production configuration
        ↓
3. Prepare Aiven MySQL
        ↓
4. Prepare Cloudflare R2
        ↓
5. Modify backend upload system for R2
        ↓
6. Test backend locally with production-like environment
        ↓
7. Deploy backend to Render
        ↓
8. Verify Render API
        ↓
9. Configure Vercel frontend
        ↓
10. Configure Namecheap DNS
        ↓
11. Configure custom domains
        ↓
12. Configure CORS
        ↓
13. Run complete end-to-end tests
        ↓
14. Security hardening
        ↓
15. Backup/monitoring setup
        ↓
16. Production launch
```

Do not skip directly from localhost to public production.

---

# 5. PHASE 0 — LOCAL BACKUP

Before modifying anything:

```bash
git status
git branch
git log --oneline -10
```

Create a backup branch:

```bash
git checkout -b production-preparation
```

If everything is clean, push it:

```bash
git push -u origin production-preparation
```

Also make a database backup before changing production database structure.

---

# 6. PHASE 1 — LOCAL APPLICATION VERIFICATION

## 6.1 Backend

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

Expected backend:

```text
http://localhost:5000
```

Health endpoint:

```text
http://localhost:5000/health
```

Expected response:

```json
{
  "success": true,
  "message": "API is running"
}
```

## 6.2 Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Expected frontend:

```text
http://localhost:5173
```

---

# 7. PHASE 2 — FRONTEND ENVIRONMENT

Current frontend environment example:

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

For local development:

```env
VITE_API_URL=http://localhost:5000/api
```

For production:

```env
VITE_API_URL=https://api.tomarkaj.com/api
```

The frontend already creates its Axios client using:

```text
import.meta.env.VITE_API_URL
```

Therefore production API configuration must be supplied through Vercel environment variables.

### Important

Never put backend secrets into Vite environment variables.

Anything beginning with:

```text
VITE_
```

is intended for frontend/build-time use and must be considered public.

---

# 8. PHASE 3 — BACKEND ENVIRONMENT

The backend currently expects:

```env
NODE_ENV=production
PORT=5000

DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE?ssl-mode=REQUIRED"

JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=15m

REFRESH_TOKEN_SECRET=<strong-random-secret>
REFRESH_TOKEN_EXPIRES_IN=7d

FRONTEND_URL=https://tomarkaj.com

MAX_FILE_SIZE_MB=10
```

After R2 integration, add:

```env
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
R2_BUCKET_NAME=<bucket-name>
R2_PUBLIC_BASE_URL=https://cdn.tomarkaj.com
```

Use the exact variable names implemented by the final R2 integration.

Never commit real values.

---

# 9. PHASE 4 — GENERATE PRODUCTION SECRETS

Generate strong secrets locally.

Example:

```bash
openssl rand -hex 32
```

Generate separate values for:

```text
JWT_SECRET
REFRESH_TOKEN_SECRET
```

Do NOT reuse:

```text
JWT_SECRET
=
REFRESH_TOKEN_SECRET
```

Do not use development secrets in production.

---

# 10. PHASE 5 — AIVEN MYSQL

Create or select the production MySQL service in Aiven.

The Prisma schema currently uses:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Keep MySQL.

Do not migrate to PostgreSQL unless there is a separate approved project requirement.

## 10.1 Database connection

Copy the Aiven MySQL connection URI.

It should follow this general pattern:

```text
mysql://USER:PASSWORD@HOST:PORT/DATABASE?ssl-mode=REQUIRED
```

Use the Aiven connection values exactly as supplied by Aiven.

## 10.2 TLS

Production database connections must use TLS.

Use:

```text
ssl-mode=REQUIRED
```

or the equivalent connection configuration supported by the deployed Prisma version.

## 10.3 Database migration strategy

The repository currently has a Prisma schema and uses:

```bash
npx prisma db push
```

for setup.

For a commercial production system, prefer versioned Prisma migrations going forward.

Before introducing migrations:

1. Back up the database.
2. Inspect the current production schema.
3. Compare it with `schema.prisma`.
4. Do not reset the database.
5. Create a baseline migration only after verifying the current schema.
6. Future production schema changes should use:

```bash
npx prisma migrate deploy
```

Never use:

```bash
npx prisma migrate reset
```

against production.

Never run:

```bash
prisma db push --force-reset
```

against production.

---

# 11. PHASE 6 — DATABASE SEEDING

The repository contains:

```text
backend/prisma/seed.js
```

The seed contains initial application data and demo accounts.

For production:

### Do not blindly run the development seed.

Before production launch:

- Inspect `seed.js`
- Separate required system/reference data from demo/test users
- Do not create public demo accounts with known passwords
- Remove or disable test balances
- Do not seed fake financial balances into production
- Do not overwrite existing records

If seed data is required for categories/settings/countries, make the seed idempotent.

Production seed commands must be safe to run more than once.

---

# 12. PHASE 7 — CLOUDflare R2 FILE STORAGE

## Current problem

The current backend stores uploaded proof files on the local filesystem.

Current implementation uses:

```text
backend/uploads/proofs/
```

and Multer disk storage.

The upload route currently:

```text
POST /api/upload/proof
```

accepts up to 5 files and writes them to local storage.

It also converts image files to base64 data URLs in the response.

This is not the desired production architecture.

### Why it must change

Render's application filesystem must not be treated as permanent user storage.

Production file storage must be:

```text
Cloudflare R2
```

not:

```text
Render local filesystem
```

---

# 13. R2 PRODUCTION UPLOAD FLOW

Implement this architecture:

```text
User
 |
 v
React
 |
 | Request upload authorization
 v
Express API
 |
 | Authenticate user
 | Validate file type
 | Validate file size
 | Generate unique object key
 | Generate presigned URL
 |
 v
React
 |
 | Direct PUT upload
 v
Cloudflare R2
 |
 v
MySQL metadata
```

Do not expose R2 secret credentials to React.

---

# 14. R2 BUCKET

Create a production bucket, for example:

```text
tomarkaj-production
```

Recommended object structure:

```text
users/
  <user-id>/
    avatars/
      <uuid>.<ext>

proofs/
  <task-id>/
    <uuid>.<ext>

documents/
  <user-id>/
    <uuid>.<ext>
```

Never use the original filename as the primary object key.

Use UUID/randomized names.

---

# 15. R2 SECURITY

Create an R2 API token/access key with the minimum required permissions.

Do not use broad account permissions if bucket-scoped access is sufficient.

Secrets stay only on the backend.

Backend:

```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
```

Frontend:

```text
NO R2 SECRET
NO R2 ACCESS KEY
NO R2 ACCOUNT TOKEN
```

---

# 16. R2 PRESIGNED URL

The backend should generate temporary upload URLs.

Conceptually:

```text
POST /api/upload/presign
```

Request:

```json
{
  "filename": "proof.png",
  "contentType": "image/png",
  "size": 123456
}
```

Backend:

1. Authenticates the user.
2. Checks file size.
3. Checks MIME type.
4. Generates unique R2 object key.
5. Generates presigned PUT URL.
6. Returns the URL and object key.

Frontend:

```text
PUT presigned-url
```

Then backend records the resulting object metadata.

---

# 17. R2 FILE VALIDATION

The production backend must validate:

- MIME type
- Extension
- File size
- Number of files
- Authenticated user
- Object ownership
- Upload purpose

Current allowed types include:

```text
image/jpeg
image/png
image/gif
image/webp
application/pdf
text/plain
```

Do not expand allowed file types without a security review.

---

# 18. R2 CORS

Configure the R2 bucket CORS for:

```text
https://tomarkaj.com
https://www.tomarkaj.com
```

During development, optionally allow:

```text
http://localhost:5173
```

Only allow the methods actually needed, normally:

```text
GET
PUT
```

Do not use:

```text
AllowedOrigins: *
```

for the production application unless there is a specific reason.

---

# 19. R2 PUBLIC VS PRIVATE FILES

Use public access only for genuinely public assets.

For user/task proof files, prefer private storage.

Recommended:

```text
Proof screenshots
    ↓
Private R2 object
    ↓
Backend authorization
    ↓
Short-lived signed GET URL
```

For public images, a custom domain can be used:

```text
https://cdn.tomarkaj.com/...
```

Do not use the R2 `r2.dev` development URL as the production CDN endpoint.

---

# 20. DATABASE FILE METADATA

Store metadata in MySQL, not the file itself.

Recommended metadata:

```text
id
userId
taskId
objectKey
originalName
mimeType
size
createdAt
```

Example:

```text
objectKey:
proofs/8b6b9c0e/7d8e9f1a-1234.png
```

The database should not contain huge base64 image strings.

---

# 21. IMPORTANT — REMOVE BASE64 IMAGE STORAGE/RESPONSES

The current upload implementation reads uploaded images from disk and creates:

```text
data:image/...;base64,...
```

Do not use this as the production file-storage mechanism.

Replace it with:

```text
R2 object
+
object key
+
signed/public URL when required
```

This avoids sending large files through JSON responses.

---

# 22. PHASE 8 — BACKEND PRODUCTION CHANGES

Before deployment, review:

```text
backend/src/server.js
backend/src/app.js
backend/src/routes/upload.routes.js
backend/src/middleware/upload.middleware.js
backend/src/utils/
```

## Server

The server currently listens using:

```js
const PORT = process.env.PORT || 5000;
```

Keep this pattern.

Render provides the production port/environment.

Do not hardcode a production port.

---

# 23. HEALTH CHECK

Keep:

```text
GET /health
```

Expected:

```json
{
  "success": true,
  "message": "API is running"
}
```

Use this endpoint as the Render health check if appropriate.

It should not require authentication.

It should be lightweight and should not execute expensive database queries.

---

# 24. CORS PRODUCTION CONFIGURATION

Current CORS logic allows Vercel origins broadly.

For commercial production, tighten this.

Recommended production allowlist:

```text
https://tomarkaj.com
https://www.tomarkaj.com
```

Optional development:

```text
http://localhost:5173
```

Do not allow arbitrary:

```text
*.vercel.app
```

in final production CORS unless preview deployments explicitly need API access.

A safe pattern is:

```text
Development:
localhost origins

Production:
tomarkaj.com
www.tomarkaj.com
```

Keep:

```text
credentials: true
```

only if the authentication design actually requires credentials/cookies.

---

# 25. AUTHENTICATION REVIEW

The current frontend stores JWT tokens in localStorage.

Before commercial launch, review this carefully.

Current behavior includes:

```text
localStorage.token
localStorage.refreshToken
```

This can increase the impact of an XSS vulnerability.

Preferred long-term production design:

```text
Short-lived access token
+
HttpOnly Secure SameSite refresh cookie
```

If the existing architecture is retained for the initial launch, perform a strict XSS review and ensure:

- No unsafe HTML injection
- No untrusted script execution
- No secrets in frontend code
- Strong CSP strategy where compatible
- Secure authentication endpoints
- Short access-token lifetime
- Refresh-token rotation/revocation

Do not change the authentication mechanism blindly; test the entire login/logout/refresh flow after every change.

---

# 26. IMPORTANT — FIX REFRESH TOKEN API BASE URL

Review:

```text
frontend/src/services/api.js
```

The main Axios instance uses:

```text
VITE_API_URL
```

but the refresh request currently uses a direct relative request:

```text
/api/auth/refresh
```

In a split Vercel + Render deployment, this can incorrectly target the Vercel frontend origin instead of the Render API.

The refresh request must use the configured backend API base URL.

Before production, make sure:

```text
POST https://api.tomarkaj.com/api/auth/refresh
```

is actually called.

Then test:

1. Login
2. Access token expiry
3. Refresh
4. New access token
5. Original request retry
6. Refresh failure
7. Logout

This is a mandatory production test.

---

# 27. EXPRESS SECURITY

The backend already uses:

```text
Helmet
CORS
express-rate-limit
Multer
Zod
```

Keep them.

Production review:

### Helmet

Verify security headers do not break:

- Vercel frontend
- R2 images
- R2 downloads
- authentication
- API calls

### Rate limiting

Current API limits should be reviewed.

Use stricter limits for:

```text
login
register
refresh
password reset
file upload
withdrawal
deposit
support
```

Financial endpoints deserve particularly careful abuse protection.

---

# 28. REQUEST BODY LIMITS

The current backend allows:

```text
50mb
```

JSON/urlencoded body size.

Do not increase this unnecessarily.

Large files should go directly to R2.

The API should not receive large image payloads as base64 JSON.

---

# 29. FINANCIAL INTEGRITY

This application contains wallet/escrow/financial functionality.

Treat the following as critical:

```text
Wallet
Deposits
Withdrawals
Escrow
Task rewards
Platform fees
Referral commissions
Admin adjustments
```

Production rules:

- Never use JavaScript floating-point arithmetic for money.
- Continue using Decimal/DB-safe monetary calculations.
- Use database transactions.
- Preserve idempotency.
- Prevent duplicate payment/approval requests.
- Log administrative balance changes.
- Never trust client-provided wallet balances.
- Never trust client-provided user roles.
- Never trust client-provided payment status.
- Validate ownership on every financial action.
- Verify authorization server-side.

---

# 30. PHASE 9 — RENDER BACKEND

Create a Render Web Service from:

```text
https://github.com/abidp0189/taskhive
```

Settings:

```text
Service Type:
Web Service

Root Directory:
backend

Runtime:
Node
```

Build command:

```bash
npm install && npm run build
```

The current `build` script runs:

```text
prisma generate
```

Start command:

```bash
npm start
```

which runs:

```bash
node src/server.js
```

---

# 31. RENDER ENVIRONMENT VARIABLES

Set:

```env
NODE_ENV=production
PORT=5000

DATABASE_URL=<Aiven MySQL URI>

JWT_SECRET=<production-secret>
JWT_EXPIRES_IN=15m

REFRESH_TOKEN_SECRET=<production-secret>
REFRESH_TOKEN_EXPIRES_IN=7d

FRONTEND_URL=https://tomarkaj.com

MAX_FILE_SIZE_MB=10
```

Plus all R2 variables:

```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_BASE_URL=https://cdn.tomarkaj.com
```

Add any other variables discovered during the final application audit.

Do not invent environment variables that the code does not use.

---

# 32. RENDER DEPLOYMENT

Deploy.

Check build logs.

Expected important steps:

```text
npm install
prisma generate
server starts
```

Then open:

```text
https://<render-service>.onrender.com/health
```

Expected:

```json
{
  "success": true,
  "message": "API is running"
}
```

Do not continue until `/health` works.

---

# 33. RENDER CUSTOM DOMAIN

Add:

```text
api.tomarkaj.com
```

to the Render service.

Render will provide the DNS target/value required by the dashboard.

Do not guess DNS values.

Copy the exact values Render provides.

Verify:

```text
https://api.tomarkaj.com/health
```

works before changing the frontend.

---

# 34. PHASE 10 — VERCEL FRONTEND

Import:

```text
https://github.com/abidp0189/taskhive
```

Vercel project settings:

```text
Framework:
Vite

Root Directory:
frontend

Build Command:
npm run build

Output Directory:
dist
```

The repository already contains:

```text
frontend/vercel.json
```

which handles SPA routing by rewriting routes to:

```text
/index.html
```

Keep this behavior unless Vercel routing requires an adjustment.

---

# 35. VERCEL ENVIRONMENT VARIABLE

Production:

```env
VITE_API_URL=https://api.tomarkaj.com/api
```

Do not use:

```env
VITE_API_URL=http://localhost:5000/api
```

Do not use the temporary Render hostname after the custom API domain is live unless needed for troubleshooting.

---

# 36. VERCEL CUSTOM DOMAIN

Add:

```text
tomarkaj.com
www.tomarkaj.com
```

to the Vercel project.

Use the exact DNS records Vercel provides.

Do not guess DNS targets.

---

# 37. PHASE 11 — NAMECHEAP DNS

The domain is registered at Namecheap.

The domain should remain registered there.

Hosting does not need to move to Namecheap.

The DNS must point the correct records to:

```text
Vercel
Render
Cloudflare
```

Expected logical routing:

```text
tomarkaj.com
    ↓
Vercel

www.tomarkaj.com
    ↓
Vercel

api.tomarkaj.com
    ↓
Render

cdn.tomarkaj.com
    ↓
Cloudflare R2/custom domain
```

Use the exact values provided by each provider.

DNS propagation can take time.

---

# 38. DNS RECORD PLAN

Do not blindly copy this table into Namecheap.

Use it as the intended architecture:

| Host | Purpose | Provider |
|---|---|---|
| `@` | Main website | Vercel |
| `www` | Main website | Vercel |
| `api` | Backend API | Render |
| `cdn` | File/image delivery | Cloudflare R2 |

The exact record type/value must come from the provider dashboards.

---

# 39. PHASE 12 — HTTPS

Every production endpoint must use HTTPS.

Required:

```text
https://tomarkaj.com
https://www.tomarkaj.com
https://api.tomarkaj.com
https://cdn.tomarkaj.com
```

No production API calls should use HTTP.

Verify:

```text
HTTP → HTTPS
```

redirect behavior where applicable.

Vercel and Render provide managed TLS for supported custom domains.

---

# 40. PHASE 13 — CORS FINAL CONFIGURATION

Final backend CORS should allow only required production origins.

Example logical configuration:

```text
Allowed:
https://tomarkaj.com
https://www.tomarkaj.com

Development:
http://localhost:5173
```

Do not leave broad Vercel preview access enabled in the final production policy unless intentionally required.

After changing CORS, test:

```text
Browser → tomarkaj.com
        ↓
api.tomarkaj.com
```

---

# 41. PHASE 14 — FRONTEND API TEST

Open:

```text
https://tomarkaj.com
```

Open browser DevTools:

```text
Network
```

Confirm API requests go to:

```text
https://api.tomarkaj.com/api/...
```

They must not go to:

```text
localhost
```

or:

```text
amader-kaj.vercel.app/api
```

---

# 42. PHASE 15 — COMPLETE AUTH TEST

Test:

```text
Register
↓
Login
↓
Authenticated API
↓
Access token expiration
↓
Refresh
↓
Continue request
↓
Logout
```

Test invalid credentials.

Test expired tokens.

Test refresh-token failure.

Test suspended/banned users.

Test role boundaries:

```text
WORKER
EMPLOYER
ADMIN
MODERATOR
```

---

# 43. PHASE 16 — WORKER TESTING

Test the complete worker lifecycle:

```text
Register
↓
Login
↓
Profile
↓
Find jobs
↓
View job
↓
Reserve/start task
↓
Submit task
↓
Upload proof
↓
Track task
↓
Task approval/rejection
↓
Wallet update
↓
Referral
↓
Withdrawal request
```

Verify every API request uses production URLs.

---

# 44. PHASE 17 — EMPLOYER TESTING

Test:

```text
Employer login
↓
Dashboard
↓
Deposit/budget
↓
Create job
↓
Job review/moderation
↓
Job activation
↓
Worker submission
↓
Review submission
↓
Approve/reject
↓
Escrow/budget changes
```

Verify no duplicate financial transaction can occur from:

- Double click
- Refresh
- Retry
- Network timeout
- Repeated API request

---

# 45. PHASE 18 — ADMIN TESTING

Test:

```text
Admin login
↓
Dashboard
↓
Users
↓
Balance adjustments
↓
Job moderation
↓
Deposits
↓
Withdrawal queue
↓
Settings
↓
Audit logs
```

Verify authorization server-side.

A normal user must never be able to call admin APIs successfully.

---

# 46. PHASE 19 — FILE UPLOAD TEST

Test:

```text
PNG
JPEG
WEBP
PDF
TXT
```

Test:

```text
Valid file
Invalid MIME
Oversized file
Multiple files
Empty upload
Unauthenticated upload
Unauthorized task upload
```

Confirm:

```text
Browser
  ↓
Render API authorization
  ↓
R2 upload
  ↓
MySQL metadata
```

Confirm the actual file exists in R2.

Confirm Render does not need to retain the file.

---

# 47. PHASE 20 — FILE ACCESS SECURITY

For private proof files:

```text
User A must not access User B's private proof.
```

Test direct object access.

Test:

```text
Wrong user
Wrong task
Expired signed URL
Deleted object
Deleted database record
```

Every protected file request must enforce authorization.

---

# 48. PHASE 21 — DATABASE PRODUCTION TEST

Verify:

```text
Application → Render → Aiven MySQL
```

Check:

- Connection succeeds
- TLS enabled
- Prisma client generated
- Schema matches application
- Indexes exist
- Foreign keys work
- Transactions work
- Decimal fields behave correctly
- Date/time behavior is correct

Do not use development database credentials.

---

# 49. PHASE 22 — DATABASE CONNECTION SAFETY

Because Node/Express runs as a long-lived service:

- Reuse a single PrismaClient instance.
- Do not instantiate PrismaClient per request.
- Handle connection errors.
- Gracefully shut down when Render terminates the service.
- Monitor connection exhaustion.

Keep database queries efficient.

Add indexes for frequently queried fields where justified.

---

# 50. PHASE 23 — PRODUCTION ERROR HANDLING

Verify:

```text
404
400
401
403
409
429
500
```

The API must not return:

- Database passwords
- JWT secrets
- R2 credentials
- Stack traces to users
- Internal filesystem paths
- SQL queries
- Sensitive environment variables

Logs can contain diagnostic information, but secrets and sensitive user data must not be logged.

---

# 51. PHASE 24 — LOGGING

Backend logs should provide enough information to diagnose:

```text
request
status
latency
error category
request ID if available
```

Avoid logging:

```text
password
JWT
refresh token
R2 secret
database password
full payment credentials
sensitive personal information
```

---

# 52. PHASE 25 — MONITORING

Monitor at least:

```text
Frontend availability
Backend /health
API errors
API latency
Database availability
Database storage
R2 storage
R2 operations
Authentication failures
Upload failures
```

Set alerts for:

```text
5xx spike
Database unavailable
Backend unavailable
Storage threshold
Unusual authentication activity
```

---

# 53. PHASE 26 — BACKUPS

Production data must have a recovery strategy.

Database:

```text
Aiven automated backups
+
periodic independent backup
```

At minimum, periodically export a database backup to secure storage.

Never store only one backup.

Keep backups separate from the production database.

Test restoring a backup.

A backup that has never been restored is not a proven backup.

---

# 54. PHASE 27 — GIT SECURITY

Confirm `.gitignore` contains:

```text
.env
.env.*
!.env.example
node_modules/
dist/
uploads/
```

Review Git history for accidentally committed secrets.

Check:

```bash
git status
git ls-files | grep ".env"
```

If a secret was ever committed:

1. Rotate the secret immediately.
2. Remove it from the repository/history as appropriate.
3. Do not assume deleting the file makes the secret safe.

---

# 55. PHASE 28 — PRODUCTION ENVIRONMENT SEPARATION

Maintain:

```text
Development
Staging
Production
```

At minimum:

```text
Development:
localhost

Production:
tomarkaj.com
api.tomarkaj.com
```

Never connect local development accidentally to the production database.

Recommended:

```text
LOCAL DB
    ≠
STAGING DB
    ≠
PRODUCTION DB
```

---

# 56. PHASE 29 — STAGING

Before every major production deployment:

```text
GitHub
   ↓
staging
   ↓
tests
   ↓
production
```

Recommended staging URLs:

```text
staging.tomarkaj.com
staging-api.tomarkaj.com
```

Do not expose staging credentials publicly.

---

# 57. PHASE 30 — DEPLOYMENT WORKFLOW

Normal future deployment:

```text
Developer
   ↓
Local development
   ↓
Run lint/build/tests
   ↓
Git commit
   ↓
Git push
   ↓
GitHub
   ↓
Vercel deploy frontend
   +
Render deploy backend
   ↓
Smoke tests
   ↓
Production
```

Never edit production code manually if the change belongs in Git.

---

# 58. LOCAL PRE-PUSH CHECKLIST

Run:

```bash
cd frontend
npm run lint
npm run build
```

Then:

```bash
cd ../backend
npm run build
```

Then test the application locally.

If tests/build fail:

```text
DO NOT DEPLOY
```

---

# 59. PRODUCTION DEPLOYMENT CHECKLIST

## GitHub

- [ ] Working tree clean
- [ ] No `.env`
- [ ] No credentials
- [ ] No secrets
- [ ] Production branch contains intended code
- [ ] Backup/tag created

## Aiven

- [ ] Production MySQL exists
- [ ] Correct database selected
- [ ] TLS enabled
- [ ] Backup configured
- [ ] Schema verified
- [ ] No development/demo data
- [ ] Migration strategy verified

## R2

- [ ] Production bucket created
- [ ] Correct bucket permissions
- [ ] Access key created
- [ ] Secrets stored only in backend
- [ ] CORS configured
- [ ] File limits configured
- [ ] Private/public access reviewed
- [ ] CDN/custom domain configured if required

## Render

- [ ] Root directory = `backend`
- [ ] Runtime = Node
- [ ] Build command verified
- [ ] Start command verified
- [ ] Environment variables added
- [ ] Health check works
- [ ] Custom domain configured
- [ ] HTTPS works
- [ ] Logs clean

## Vercel

- [ ] Root directory = `frontend`
- [ ] Build command verified
- [ ] Output directory = `dist`
- [ ] `VITE_API_URL` configured
- [ ] Custom domain configured
- [ ] SPA routing works
- [ ] HTTPS works

## Namecheap

- [ ] Domain active
- [ ] DNS records configured
- [ ] `tomarkaj.com` → Vercel
- [ ] `www.tomarkaj.com` → Vercel
- [ ] `api.tomarkaj.com` → Render
- [ ] `cdn.tomarkaj.com` → R2/custom domain if used

## CORS

- [ ] `https://tomarkaj.com` allowed
- [ ] `https://www.tomarkaj.com` allowed if used
- [ ] Localhost allowed only for development
- [ ] Arbitrary Vercel origins removed from production
- [ ] Credentials behavior verified

---

# 60. FINAL PRODUCTION URL TEST

## Website

```text
https://tomarkaj.com
```

## WWW

```text
https://www.tomarkaj.com
```

## API

```text
https://api.tomarkaj.com/health
```

## CDN

```text
https://cdn.tomarkaj.com
```

if a public CDN/custom domain is configured.

---

# 61. SMOKE TEST

After deployment:

```text
Open website
       ↓
Register
       ↓
Login
       ↓
Dashboard
       ↓
API request
       ↓
Create/read data
       ↓
Upload file
       ↓
View file
       ↓
Logout
```

If any step fails:

```text
STOP RELEASE
```

Check:

```text
Browser Console
Browser Network
Vercel Logs
Render Logs
Aiven Metrics/Logs
R2
```

---

# 62. DOMAIN VERIFICATION

Verify:

```bash
curl -I https://tomarkaj.com
curl -I https://www.tomarkaj.com
curl https://api.tomarkaj.com/health
```

Do not consider the deployment complete until all expected endpoints respond correctly.

---

# 63. PRODUCTION PERFORMANCE

Initial target:

```text
~1,000 registered users
```

Do not over-engineer before measuring actual traffic.

Start with:

```text
Vercel
+
one appropriate Render service
+
appropriate Aiven MySQL plan
+
R2
```

Scale based on actual:

```text
CPU
RAM
DB connections
query latency
API latency
R2 usage
traffic
```

---

# 64. SCALE-UP PLAN

If traffic grows:

```text
                 +----------------+
                 |     Vercel     |
                 +--------+-------+
                          |
                 +--------v-------+
                 |     Render     |
                 | API instances  |
                 +--------+-------+
                          |
                 +--------v-------+
                 | Aiven MySQL    |
                 +----------------+
                          |
                 +--------v-------+
                 | Cloudflare R2  |
                 +----------------+
```

Possible future additions:

```text
Redis
Background workers
Queues
CDN
Caching
Read replicas
Search
Dedicated monitoring
WAF
```

Add these only when actual bottlenecks justify them.

---

# 65. COMMERCIAL SECURITY BASELINE

Before launch, verify:

### Authentication

- [ ] Passwords hashed
- [ ] JWT secrets strong
- [ ] Refresh tokens protected
- [ ] Logout works
- [ ] Session/token expiration works

### Authorization

- [ ] Worker cannot access employer functions
- [ ] Employer cannot access admin functions
- [ ] User cannot access another user's data
- [ ] Admin endpoints are protected
- [ ] File ownership is enforced

### Input

- [ ] Zod validation
- [ ] File type validation
- [ ] File size validation
- [ ] Request limits
- [ ] SQL/ORM parameters handled safely

### API

- [ ] CORS restricted
- [ ] Helmet enabled
- [ ] Rate limiting enabled
- [ ] HTTPS only
- [ ] Error responses sanitized

### Database

- [ ] TLS
- [ ] Backups
- [ ] Least privilege
- [ ] No production reset commands
- [ ] Financial operations transactional

### Storage

- [ ] R2 credentials private
- [ ] Private files protected
- [ ] Signed URLs used where appropriate
- [ ] No base64 database storage
- [ ] No persistent local Render uploads

---

# 66. CRITICAL FINANCIAL TESTS

Because the application contains wallet/escrow behavior, perform these tests before public launch.

### Duplicate approval

```text
Click Approve twice quickly
```

Expected:

```text
One financial transaction only
```

### Refresh during transaction

```text
Submit request
↓
Immediately refresh
```

Expected:

```text
No duplicate transaction
```

### Browser retry

Expected:

```text
No duplicate transaction
```

### Concurrent request

Send the same approval request concurrently.

Expected:

```text
Idempotent result
```

### Unauthorized balance update

Attempt to manipulate the API from browser DevTools.

Expected:

```text
403/401
```

### Client-side manipulation

Change:

```text
reward
balance
role
userId
taskId
```

in the browser request.

Expected:

```text
Server rejects unauthorized/manipulated values
```

---

# 67. DEMO DATA POLICY

The repository currently contains seeded demo accounts.

For production:

```text
DO NOT expose development/demo credentials to customers.
```

Before launch:

- Remove unnecessary demo users.
- Remove fake balances.
- Rotate any credentials that were ever public.
- Create the real administrator account securely.
- Verify admin credentials are not stored in source code.

---

# 68. ADMIN ACCOUNT POLICY

Create the production administrator through a secure process.

Never hardcode:

```text
admin password
admin JWT
admin API key
```

Do not share production admin credentials through GitHub, README files, chat messages, or source code.

Use a strong unique password.

Enable additional authentication controls if implemented later.

---

# 69. ROLLBACK PLAN

Every production release must have a rollback option.

Before deployment:

```text
Record current production commit
```

Example:

```bash
git rev-parse HEAD
```

If the new release is broken:

```text
1. Stop further deployments
2. Identify failing service
3. Roll frontend/backend back to last known good commit
4. Restore database only if a schema/data change requires it
5. Verify /health
6. Run smoke tests
7. Re-open traffic
```

Never restore an old database backup simply because a frontend bug occurred.

---

# 70. INCIDENT PROCEDURE

If production breaks:

```text
1. Identify scope
2. Check Vercel
3. Check Render
4. Check Aiven
5. Check R2
6. Check DNS
7. Check recent Git commit
8. Check logs
9. Roll back if required
10. Verify health
11. Document cause
```

Do not randomly change multiple production settings at once.

---

# 71. COMMON PROBLEMS

## Frontend says Network Error

Check:

```text
VITE_API_URL
CORS
api.tomarkaj.com DNS
Render service
HTTPS
```

## CORS error

Check:

```text
FRONTEND_URL=https://tomarkaj.com
```

and the exact browser origin.

Do not solve it by:

```text
Access-Control-Allow-Origin: *
```

for authenticated production traffic.

## API returns 500

Check Render logs.

Then check:

```text
DATABASE_URL
Prisma
Aiven
R2
environment variables
```

## Prisma error

Check:

```bash
npx prisma generate
```

and verify the production migration/schema strategy.

## File upload fails

Check:

```text
R2 credentials
R2 bucket
R2 CORS
file MIME
file size
presigned URL
browser PUT request
```

## File uploads disappear

This usually indicates the application is still relying on local server storage.

Verify:

```text
R2 object exists
database metadata exists
application reads from R2
```

---

# 72. ANTIGRAVITY EXECUTION RULES

When using this README as instructions for an AI coding agent:

### Rule 1

Inspect the repository before changing code.

### Rule 2

Do not assume the README is newer than the source code.

### Rule 3

Source code is the authority for current implementation.

### Rule 4

Do not delete working functionality.

### Rule 5

Do not change business logic unless required for production security/storage.

### Rule 6

Do not expose credentials.

### Rule 7

Do not modify production database destructively.

### Rule 8

Do not use `prisma migrate reset` in production.

### Rule 9

Do not use Render local filesystem as permanent storage.

### Rule 10

Do not store uploaded files as base64 in MySQL.

### Rule 11

Do not expose R2 credentials to React.

### Rule 12

Use the production API domain:

```text
https://api.tomarkaj.com/api
```

### Rule 13

Use the production frontend:

```text
https://tomarkaj.com
```

### Rule 14

After each major change:

```text
lint
↓
build
↓
local test
↓
commit
```

### Rule 15

Do not declare the deployment complete until the entire smoke-test checklist passes.

---

# 73. ANTIGRAVITY TASK EXECUTION FORMAT

For each deployment phase, report:

```text
PHASE:
STATUS:
FILES CHANGED:
COMMANDS RUN:
ENVIRONMENT CHANGES:
TESTS:
RESULT:
BLOCKERS:
NEXT STEP:
```

Example:

```text
PHASE:
R2 Integration

STATUS:
Completed

FILES CHANGED:
backend/src/config/r2.js
backend/src/routes/upload.routes.js
backend/src/middleware/upload.middleware.js

COMMANDS RUN:
npm install
npm run build

TESTS:
PNG upload
PDF upload
invalid MIME
oversized file

RESULT:
All passed

BLOCKERS:
None

NEXT STEP:
Deploy backend to Render
```

---

# 74. PRODUCTION DEFINITION OF DONE

The application is considered production-ready only when ALL of the following are true:

```text
[ ] tomarkaj.com works
[ ] www.tomarkaj.com works
[ ] api.tomarkaj.com/health works
[ ] HTTPS works everywhere
[ ] Vercel production deployment works
[ ] Render production deployment works
[ ] Aiven MySQL connection works
[ ] MySQL TLS works
[ ] Prisma works
[ ] R2 uploads work
[ ] R2 downloads work
[ ] R2 CORS works
[ ] Private file authorization works
[ ] Registration works
[ ] Login works
[ ] Logout works
[ ] Token refresh works
[ ] Worker workflow works
[ ] Employer workflow works
[ ] Admin workflow works
[ ] Wallet workflow works
[ ] Deposit workflow works
[ ] Withdrawal workflow works
[ ] Escrow workflow works
[ ] Referral workflow works
[ ] Support workflow works
[ ] Notifications work
[ ] Duplicate financial operations are prevented
[ ] Rate limiting works
[ ] CORS is restricted
[ ] Production secrets are not in Git
[ ] Demo credentials are removed/disabled
[ ] Database backup is configured
[ ] Recovery procedure is documented
[ ] Monitoring is configured
[ ] Rollback procedure is known
```

---

# 75. FINAL ARCHITECTURE

The final production system should be:

```text
                         +----------------------+
                         |      Namecheap       |
                         |    tomarkaj.com      |
                         |        DNS           |
                         +----------+-----------+
                                    |
                +-------------------+-------------------+
                |                                       |
                v                                       v
       +------------------+                    +------------------+
       |      Vercel      |                    |   Cloudflare R2  |
       |                  |                    |                  |
       | React 19         |                    | User files       |
       | Vite             |                    | Proof images     |
       | Tailwind         |                    | Documents        |
       | SPA              |                    |                  |
       +--------+---------+                    +------------------+
                |
                | HTTPS
                |
                v
       +------------------+
       |      Render      |
       |                  |
       | Node.js          |
       | Express          |
       | Prisma           |
       | JWT/RBAC         |
       | API              |
       +--------+---------+
                |
                | TLS
                |
                v
       +------------------+
       |   Aiven MySQL    |
       |                  |
       | Users            |
       | Jobs             |
       | Tasks            |
       | Wallet           |
       | Transactions     |
       | Referrals        |
       | Notifications    |
       | Support          |
       | File metadata    |
       +------------------+
```

---

# 76. SERVICE RESPONSIBILITY RULE

Never mix responsibilities unnecessarily.

```text
Vercel
= frontend

Render
= backend/API

Aiven
= structured application data

R2
= files/images

Namecheap
= domain/DNS

GitHub
= source control
```

This separation makes the system easier to maintain, debug, secure, and scale.

---

# 77. PRODUCTION ENVIRONMENT SUMMARY

## Frontend

```text
URL:
https://tomarkaj.com

Platform:
Vercel

Directory:
frontend

Build:
npm run build

Output:
dist

Environment:
VITE_API_URL=https://api.tomarkaj.com/api
```

## Backend

```text
URL:
https://api.tomarkaj.com

Platform:
Render

Directory:
backend

Build:
npm install && npm run build

Start:
npm start

Health:
GET /health
```

## Database

```text
Platform:
Aiven

Database:
MySQL

ORM:
Prisma

TLS:
Required
```

## File storage

```text
Platform:
Cloudflare R2

Purpose:
Images/files/proofs

Access:
Presigned URLs/private objects where appropriate
```

## Domain

```text
Registrar:
Namecheap

Main:
tomarkaj.com

API:
api.tomarkaj.com

CDN:
cdn.tomarkaj.com
```

---

# 78. MOST IMPORTANT PRODUCTION CHANGES FROM CURRENT STATE

The current project is already deployed as a Vercel frontend, but the production architecture needs these changes before commercial launch:

### Change 1 — Custom domain

```text
amader-kaj.vercel.app
        ↓
tomarkaj.com
```

### Change 2 — Dedicated API domain

```text
Render temporary URL
        ↓
api.tomarkaj.com
```

### Change 3 — Persistent file storage

```text
backend/uploads/
        ↓
Cloudflare R2
```

### Change 4 — Remove base64 image responses

```text
base64 JSON
        ↓
R2 object URL / signed URL
```

### Change 5 — Tighten CORS

```text
*.vercel.app
        ↓
tomarkaj.com + www.tomarkaj.com
```

### Change 6 — Fix refresh endpoint

Ensure the refresh request uses:

```text
https://api.tomarkaj.com/api/auth/refresh
```

instead of accidentally targeting the Vercel frontend origin.

### Change 7 — Production database migration discipline

```text
development db push
        ↓
versioned migrations
        ↓
prisma migrate deploy
```

after safely baselining the existing schema.

### Change 8 — Remove/disable development demo credentials

Do not launch the commercial service with publicly known demo accounts.

---

# 79. LAUNCH ORDER — FINAL

Execute exactly in this order:

```text
01. Backup Git repository
        ↓
02. Audit source code
        ↓
03. Audit environment variables
        ↓
04. Audit authentication
        ↓
05. Audit financial operations
        ↓
06. Prepare production Aiven MySQL
        ↓
07. Verify database schema
        ↓
08. Establish safe Prisma migration strategy
        ↓
09. Create Cloudflare R2 bucket
        ↓
10. Integrate R2 into backend
        ↓
11. Remove local persistent upload dependency
        ↓
12. Fix frontend refresh API URL
        ↓
13. Tighten CORS
        ↓
14. Test locally
        ↓
15. Deploy Render backend
        ↓
16. Test /health
        ↓
17. Configure api.tomarkaj.com
        ↓
18. Deploy Vercel frontend
        ↓
19. Configure VITE_API_URL
        ↓
20. Configure tomarkaj.com
        ↓
21. Configure Namecheap DNS
        ↓
22. Verify HTTPS
        ↓
23. Configure R2 CORS
        ↓
24. Test authentication
        ↓
25. Test Worker
        ↓
26. Test Employer
        ↓
27. Test Admin
        ↓
28. Test wallet/financial operations
        ↓
29. Test uploads
        ↓
30. Test private file authorization
        ↓
31. Verify backups
        ↓
32. Verify monitoring
        ↓
33. Run full smoke test
        ↓
34. Security review
        ↓
35. Production launch
```

---

# 80. OFFICIAL DOCUMENTATION REFERENCES

Use official documentation when provider UI or configuration changes.

- Vercel: https://vercel.com/docs
- Vercel custom domains: https://vercel.com/docs/domains
- Render web services: https://render.com/docs/web-services
- Render environment variables: https://render.com/docs/configure-environment-variables
- Aiven MySQL: https://aiven.io/docs/products/mysql
- Cloudflare R2: https://developers.cloudflare.com/r2/
- Cloudflare R2 presigned URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- Cloudflare R2 CORS: https://developers.cloudflare.com/r2/buckets/cors/

---

# 81. FINAL INSTRUCTION TO THE DEPLOYMENT AGENT

**Do not treat deployment as only "put the frontend on Vercel and backend on Render."**

The deployment is complete only when:

```text
Application
+
Database
+
Authentication
+
Financial integrity
+
File storage
+
DNS
+
HTTPS
+
CORS
+
Security
+
Backups
+
Monitoring
+
Rollback
```

are all working together.

The goal is not merely:

```text
"Website is online"
```

The goal is:

```text
"Website is safely and reliably operating as a commercial production system."
```

---

## END OF PRODUCTION RUNBOOK
