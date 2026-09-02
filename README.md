# Tomar Kaj — Modern Microjob & Freelance Task Marketplace

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-Aiven_Cloud-4479A1?logo=mysql&logoColor=white)](https://aiven.io/)

**Tomar Kaj** (formerly TaskHive) is a production-ready, escrow-backed microjob and freelance task marketplace. The platform connects employers seeking rapid task completion with online workers, featuring role-based workflows (**Worker**, **Employer**, **Admin/Moderator**), atomic ledger-based accounting, bKash/Nagad payment handling with live BDT conversion, client-side base64 proof uploads with full-screen lightbox review, and automated proof lifecycle cleanup.

---

## 🌟 Key Highlights & Recent Updates

- **Rebranded to Tomar Kaj**: Streamlined UI, responsive navigation, dark-mode-first aesthetic (`tomarkaj_theme`), and localized payment experience.
- **bKash & Nagad Integration**: Native deposit & withdrawal support with transaction ID tracking, admin verification, and live BDT conversions ($1 USD = 100 BDT).
- **Ephemeral Storage Resilience**: Proof screenshots are encoded client-side into self-contained base64 data URIs and stored in MySQL (`MEDIUMTEXT`), eliminating file-loss issues on ephemeral hosting platforms (Render, Vercel).
- **Interactive Proof Lightbox**: Employers and workers can inspect submitted task proof images using an interactive full-screen modal with zoom, pan, and download controls.
- **Automated 30-Day Proof Cleanup**: Built-in background engine runs on startup and every 6 hours to prune proofs older than 30 days, keeping database storage lean and high-performing.
- **Atomic Escrow Ledger**: Exact, high-precision financial operations powered by `Decimal.js` ensuring funds are locked at campaign creation and only disbursed upon proof approval.
- **Configurable Platform Controls**: Admins can dynamically adjust minimum deposit (`min_deposit_amount`), minimum withdrawal, boost tiers, platform fees, and referral commissions directly from the dashboard.

---

## 🛠️ Technology Stack

| Domain | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, Axios (with auth/refresh interceptors), React Hook Form, Zod, Lucide Icons, React Hot Toast |
| **Backend** | Node.js, Express.js (v5), Prisma ORM (v6), Decimal.js, Bcrypt, JWT + Refresh Tokens, Helmet, Morgan, Multer |
| **Database** | Cloud MySQL (Aiven for MySQL) with SSL or local MySQL |
| **Deployment** | Vercel (Frontend SPA), Render (Backend API Web Service), Aiven (Managed Cloud Database) |

---

## 📁 Repository Structure

```
├── frontend/                         # React 19 + Vite + Tailwind CSS v4 SPA
│   ├── public/                       # Static branding assets & favicon (tomar-kaj-logo.png)
│   ├── src/
│   │   ├── components/common/        # Navbar, Footer, ImageLightboxModal, PaymentLogos, StatCard, Badge
│   │   ├── context/                  # AuthContext (JWT & wallet live sync), ThemeContext (Dark mode default)
│   │   ├── pages/
│   │   │   ├── public/               # LandingPage, LoginPage, RegisterPage, HowItWorksPage, FAQPage
│   │   │   ├── worker/               # WorkerDashboard, FindJobs, JobDetails, MyTasks, WorkerWallet, WithdrawPage, ReferralPage
│   │   │   ├── employer/             # EmployerDashboard, 4-Step Job Wizard, MyJobs, ReviewSubmissionsPage, EmployerWallet
│   │   │   ├── admin/                # AdminDashboard, User Management, Job Moderation, Withdrawals, Deposits, Settings
│   │   │   └── support/              # 24/7 Support Desk & Threaded Ticket Messaging
│   │   ├── services/                 # Axios instance (auto token attachment & 401 refresh handling)
│   │   ├── App.jsx                   # Role-based protected routes
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                          # Node.js + Express 5 + Prisma REST API
│   ├── prisma/
│   │   ├── schema.prisma             # Relational data model (Users, Jobs, Tasks, Proofs, Wallets, Deposits, Withdrawals)
│   │   └── seed.js                   # Categories, subcategories, countries, admin account, platform settings
│   ├── src/
│   │   ├── controllers/              # Auth, Job, Task, Wallet, Referral, Admin, Employer, Category, Support
│   │   ├── middleware/               # Authentication (JWT + RBAC), Uploads, Rate Limiter, Error Handler
│   │   ├── routes/                   # Modular Express API routing
│   │   ├── utils/                    # Prisma client, Decimal safe math, cleanup routine (30-day proof purge)
│   │   ├── app.js                    # Express app configuration & middleware
│   │   └── server.js                 # HTTP server entrypoint & cleanup background scheduler
│   ├── uploads/                      # Proof upload staging directory
│   ├── .env.example                  # Environment variable template
│   └── package.json
│
├── DEPLOYMENT.md                     # Comprehensive Vercel + Render + Aiven deployment manual
└── README.md                         # Project documentation
```

---

## 👥 Role Capabilities

### 💼 Workers
- **Explore & Filter**: Filter jobs by category, subcategory, reward rate, and estimated completion time.
- **Proof Submission**: Submit required text, URLs, and image screenshots (client-side base64 encoded).
- **Task Tracking**: Real-time status tracking (`PENDING`, `APPROVED`, `REJECTED`, `RESUBMIT_REQUIRED`).
- **Interactive Lightbox**: Click any submitted thumbnail in task history to view full-resolution screenshots with zoom controls.
- **Wallet & Payouts**: Request payouts via bKash or Nagad with minimum threshold enforcement and live BDT conversion.
- **Affiliate Program**: Share custom referral link to earn 5% task commission on referred users' approved work.

### 🏢 Employers
- **Campaign Creation**: Multi-step wizard to define worker targets, instructions, custom proof requirements, and deadlines.
- **Budget Escrow**: Automatic calculation of base worker budget, platform fee (10%), screenshot fee (3%), and optional visibility boost.
- **Submission Review**: Inspect submitted proof text, URLs, and screenshots in the built-in image lightbox.
- **Decision Workflow**: One-click Approve (disburses payment instantly), Reject (with mandatory reason), or Request Resubmission.
- **Deposit Funds**: Deposit wallet balance through bKash / Nagad by submitting payment transaction IDs.

### 🛡️ Admins & Moderators
- **Financial Controls**: Verify and approve manual deposits, review and process worker withdrawal requests.
- **Job Moderation**: Review pending campaigns, pause, edit, or reject violating job postings.
- **User Management**: Adjust user balances with automated immutable audit logging; suspend or ban bad actors.
- **Dynamic Platform Settings**: Update minimum withdrawal, minimum deposit (`min_deposit_amount`), boost fees, and referral commission rates without redeploying.
- **Support Desk**: Manage customer support tickets with priority assignment and threaded messaging.

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- A **MySQL database** (local instance or free cloud database on [Aiven for MySQL](https://aiven.io/))

---

### 1. Configure Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `backend/.env` file:
   ```env
   PORT=5000
   DATABASE_URL="mysql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?ssl-mode=REQUIRED"
   JWT_SECRET=your-super-secure-jwt-secret-key
   JWT_EXPIRES_IN=15m
   REFRESH_TOKEN_SECRET=your-super-secure-refresh-token-secret
   REFRESH_TOKEN_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Push Prisma schema and seed initial data:
   ```bash
   npm run db:push
   npm run db:seed
   ```

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will start on **`http://localhost:5000`**.

---

### 2. Configure Frontend

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `frontend/.env` (optional for local, defaults to port 5000):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at **`http://localhost:5173`**.

---

## 🔑 Default Seed Accounts

After running `npm run db:seed`, the following administrative account is ready for use:

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@tomarkaj.com` | `password123` | Full administrative access to moderation, settings, and ledger |
| **Admin (Legacy)** | `admin@taskhive.com` | `password123` | Backwards-compatible admin credentials |

> Workers and Employers can be registered organically via the **/register** page. New accounts automatically receive a linked wallet, referral code, and welcome configuration.

---

## 📜 Available NPM Scripts

### Backend (`backend/package.json`)
| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `node --watch src/server.js` | Runs backend in watch mode (auto-reload on code change) |
| `npm start` | `node src/server.js` | Starts backend production server |
| `npm run build` | `prisma generate` | Generates the Prisma client library |
| `npm run db:push` | `prisma db push` | Pushes schema changes directly to the database |
| `npm run db:seed` | `node prisma/seed.js` | Populates categories, countries, admin user, and settings |

### Frontend (`frontend/package.json`)
| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Starts Vite development server |
| `npm run build` | `vite build` | Compiles production assets into `dist/` |
| `npm run preview` | `vite preview` | Previews the production build locally |
| `npm run lint` | `oxlint` | High-performance code linting |

---

## 🌐 Production Deployment

For complete, step-by-step production instructions, see [DEPLOYMENT.md](file:///c:/Users/User/Desktop/Website/DEPLOYMENT.md).

### Quick Deployment Overview:
1. **Database**: Provision a MySQL instance on [Aiven](https://aiven.io/). Copy the URI with `?ssl-mode=REQUIRED`.
2. **Backend**: Deploy `backend/` as a Web Service on [Render](https://render.com/).
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - Run `npm run db:push` and `npm run db:seed` from the Render Shell.
3. **Frontend**: Deploy `frontend/` on [Vercel](https://vercel.com/).
   - **Framework Preset**: `Vite`
   - **Output Directory**: `dist`
   - **Environment Variable**: `VITE_API_URL=https://<your-render-app>.onrender.com/api`

---

## 🔒 Security & Data Integrity

- **Double-Payment & Concurrency Protection**: Atomic Prisma transactions prevent race conditions during budget deductions, escrow locks, and task approvals.
- **Client-Side Image Optimization**: Proof images are compressed and encoded to base64 before upload, saving bandwidth and avoiding file system dependencies.
- **Automated Proof Lifecycle**: Submitted proofs are automatically cleaned up after 30 days via background cron, conserving database space.
- **Granular RBAC Middleware**: Strict role-based route guards isolate Worker, Employer, and Admin APIs.
- **Security Headers & Rate Limiting**: Powered by Helmet, CORS origin validation, and express-rate-limit.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
