# TaskHive — Microjob Marketplace Platform

A production-grade, escrow-backed microjob marketplace with three primary roles (**Worker**, **Employer**, **Admin**), ledger-based cryptographic financial accounting, dynamic proof verification, and affiliate referral commissions.

---

## 🛠️ Technology Stack

| Domain | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, Axios, React Hook Form, Lucide Icons, React Hot Toast |
| **Backend** | Node.js, Express.js, Prisma ORM, Multer, Decimal.js, JWT Authentication |
| **Database** | Cloud MySQL (Aiven for MySQL) |
| **Deployment** | Vercel (Frontend), Render (Backend), Aiven (Database) |

---

## 📁 Repository Structure

```
├── frontend/                     # React 19 + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/common/    # Navbar, Footer, Badge, StatCard, Modal, NotificationDropdown
│   │   ├── context/              # AuthContext (JWT + live wallet sync)
│   │   ├── pages/
│   │   │   ├── public/           # Landing, Login, Register, HowItWorks, FAQ
│   │   │   ├── worker/           # Worker Dashboard, Find Jobs, Job Details, My Tasks, Wallet, Withdraw, Referral, Profile
│   │   │   ├── employer/         # Employer Dashboard, 4-Step Job Wizard, My Jobs, Review Submissions, Deposit & Budget
│   │   │   ├── admin/            # Admin Dashboard, Users & Balance Adjustments, Job Moderation, Withdrawal Queue, Deposits, Settings
│   │   │   └── support/          # 24/7 Support Desk & Ticket Messaging
│   │   ├── services/             # Axios instance with auto JWT attachment & refresh interceptor
│   │   ├── App.jsx               # Role-based protected routes
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Node.js + Express + Prisma REST API
│   ├── prisma/
│   │   ├── schema.prisma         # Complete relational data model
│   │   └── seed.js               # Initial categories, countries, settings, demo users
│   ├── src/
│   │   ├── controllers/          # Auth, Job, Task, Wallet, Referral, Admin
│   │   ├── middleware/           # Auth (JWT + RBAC), Upload (Multer), Error handler
│   │   ├── routes/               # Modular Express API endpoints
│   │   ├── utils/                # Prisma client, Decimal safe math, Response helpers
│   │   ├── app.js
│   │   └── server.js
│   ├── uploads/                  # Uploaded proof screenshots
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started Locally

### 1. Configure Backend Environment

Copy `.env.example` to `backend/.env` and insert your **Aiven MySQL** connection string:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
DATABASE_URL="mysql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?ssl-mode=REQUIRED"
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### 2. Push Prisma Schema & Seed Database

```bash
cd backend
npx prisma db push
node prisma/seed.js
```

> **Pre-configured Demo Accounts (Password: `password123`):**
> - **Admin:** `admin@taskhive.com`
> - **Worker:** `worker@test.com` (Pre-funded with $5.00 available balance)
> - **Employer:** `employer@test.com` (Pre-funded with $100.00 deposit balance)

### 3. Run Backend Server

```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:5000`.

### 4. Run Frontend App

```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 🌐 Production Deployment

### 1. Database (Aiven for MySQL)
1. Create a MySQL service in [Aiven Console](https://console.aiven.io/).
2. Copy the Service URI (`mysql://...`).
3. Set SSL Mode to `REQUIRED`.

### 2. Backend (Render)
1. Create a new **Web Service** pointing to the `backend/` directory.
2. Build command: `npm install && npx prisma generate`
3. Start command: `node src/server.js`
4. Set Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `FRONTEND_URL`.

### 3. Frontend (Vercel)
1. Import the repository in [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Set Environment Variable: `VITE_API_URL=https://your-render-backend.onrender.com/api`.
4. Deploy!

---

## 🔒 Security & Financial Integrity Highlights
- **Atomic Escrow Locking:** Employers lock funds when jobs are created; funds only leave locked escrow when work is verified and approved.
- **Double-Payment Prevention:** Idempotent database transactions prevent duplicate approval charges.
- **Single-Job Protection:** Workers cannot start or submit multiple instances of the same campaign unless explicitly configured.
- **Audited Financial Changes:** All administrative balance adjustments generate immutable audit logs.
- **Affiliate Attribution:** Automatic 5% referral commission credited on approved tasks.
