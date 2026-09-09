# Tomar Kaj — Modern Microjob & Freelance Task Marketplace

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-Aiven_Cloud-4479A1?logo=mysql&logoColor=white)](https://aiven.io/)

**Tomar Kaj** ([https://www.tomarkaj.com/](https://www.tomarkaj.com/)) is a production-ready, escrow-backed microjob and freelance task marketplace. The platform connects employers seeking rapid task execution with verified online workers, featuring role-based workflows (**Worker**, **Employer**, **Admin/Moderator**), atomic ledger accounting, live bKash/Nagad localized payments, Server-Sent Events (SSE) real-time event distribution, Cloudflare R2 / base64 asset management, and an admin-controlled promotion & announcement engine.

---

## 🌟 Key Highlights & Feature Matrix

### 📢 Admin Announcement System
- **Worker Dashboard Broadcast**: Real-time announcement line positioned above the microjob filters and task listings.
- **Full Unicode & Multilingual Support**: Flawlessly renders Bangla, English, mixed scripts, Unicode characters, and emojis (e.g. `📢 নতুন Update — আজকের নতুন কাজগুলো এখন Available!`).
- **Single-Active Coordination**: Automatically coordinates active status so only the currently active broadcast is displayed to workers.
- **Clean Empty State**: When no announcement is active, no empty or broken container is displayed.

### 🖼️ Worker Advertisement Banner System
- **Responsive Banner Display**: High-definition, responsive promotional banner integrated directly below announcements.
- **"Paid" Sponsor Badge**: Clearly identified with a sleek, translucent backdrop badge.
- **Secure Destination Navigation**: Worker clicks open the destination in a new tab or internal route safely.
- **Automated Asset Cleanup**: When replacing an advertisement image, the new file is saved and the database is updated before deleting the old file to guarantee zero broken images and zero orphaned files. Deleting an advertisement completely purges its associated storage asset.

### ⚡ Real-Time SSE (Server-Sent Events) Infrastructure
- **Instant Client Propagation**: Workers receive updates for `announcement:updated`, `announcement:deleted`, `advertisement:updated`, and `advertisement:deleted` immediately without manual browser refreshes.
- **Lightweight & Battery-Friendly**: Utilizes native browser `EventSource` with automated reconnection and zero external socket overhead.

### ✈️ Persistent Viewport-Fixed Telegram Button
- **Fixed Viewport Positioning**: Floats permanently at the bottom-right corner of the screen (`position: fixed`) and does not move during page scrolling.
- **Role-Specific Visibility**: Exclusively displayed for **Worker** and **Employer** accounts. Hidden on guest and admin routes.
- **Mobile Safe-Area Aware**: Accounts for mobile navigation bars and safe-area insets (`env(safe-area-inset-bottom)`).
- **Centralized Configuration**: Configured from a single source of truth (`frontend/src/config/constants.js` → `TELEGRAM_LINK`).
- **Accessibility**: Includes accessible label (`aria-label`), tooltip title, and keyboard focus states.

### 🛡️ Security, Validation & Escrow
- **Backend Role-Based Access Control (RBAC)**: All administrative promotion and configuration routes are guarded server-side by `authenticate` and `authorize('ADMIN')`.
- **Destination URL Protocol Sanitization**: Strictly allows standard `https://` and internal paths while rejecting dangerous protocols (`javascript:`, `data:`, `vbscript:`, `file:`, `//`).
- **Image Validation**: Strict validation for MIME types (`image/jpeg`, `image/png`, `image/webp`), extensions, and file size (max 5MB).
- **Atomic Escrow Ledger**: Microjob reward funds are locked at campaign creation via `Decimal.js` and disbursed directly into the worker's wallet upon employer approval.
- **bKash & Nagad Payments**: Dynamic payment gateway numbers configurable by admin with transaction verification and live BDT conversions ($1 USD = 100 BDT).

---

## 🛠️ Technology Stack

| Domain | Technology | Description |
|---|---|---|
| **Frontend** | React 19.2, Vite 8.2, Tailwind CSS v4.3 | High-performance SPA with modern dark/light glassmorphism styling |
| **Icons & UI** | Lucide React, Framer Motion, React Hot Toast | Responsive micro-animations and intuitive feedback |
| **Forms & Validation** | React Hook Form, Zod | Fast client-side schema validation |
| **Backend** | Node.js, Express.js 5.2 | Scalable REST API with rate limiting, helmet, and cookie-parser |
| **Real-Time** | Server-Sent Events (SSE) | Native real-time event streaming per-user and per-role |
| **Database & ORM** | MySQL (Aiven Cloud), Prisma 6.19 | Type-safe relational database management with indexes |
| **Object Storage** | Cloudflare R2 / Local fallback | S3-compatible cloud object storage with public CDN delivery |
| **Authentication** | JWT (Access + Refresh Tokens), Bcrypt | Secure token rotation with role-based authorization |

---

## 📁 Repository Structure

```
├── frontend/                         # React 19 + Vite + Tailwind CSS v4 SPA
│   ├── public/                       # Favicons, manifest & tomar-kaj-logo.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # Navbar, Footer, TelegramFloatingButton, StatCard, Badge
│   │   │   └── worker/               # WorkerAnnouncementBanner, WorkerAdvertisementBanner, WorkerPromoSection
│   │   ├── config/
│   │   │   └── constants.js          # Centralized constants (TELEGRAM_LINK)
│   │   ├── context/                  # AuthContext, ThemeContext, RealtimeContext (SSE)
│   │   ├── pages/
│   │   │   ├── public/               # LandingPage, LoginPage, RegisterPage, HowItWorksPage, FAQPage
│   │   │   ├── worker/               # WorkerDashboard, FindJobsPage, JobDetailsPage, MyTasksPage, WalletPage, WithdrawPage, ReferralPage
│   │   │   ├── employer/             # EmployerDashboard, CreateJobWizard, MyJobsPage, ReviewSubmissionsPage, EmployerWalletPage
│   │   │   ├── admin/                # AdminDashboard, AdminPromotionsPage, AdminCategoriesPage, AdminUsersPage, AdminJobsPage, AdminWithdrawalsPage, AdminDepositsPage, AdminSettingsPage
│   │   │   └── support/              # 24/7 Support Desk & Threaded Ticket Messaging
│   │   ├── services/                 # Axios instance (auto token attachment & 401 refresh handling)
│   │   ├── App.jsx                   # Role-based protected routes & root Telegram button injection
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                          # Node.js + Express 5 + Prisma REST API
│   ├── prisma/
│   │   ├── schema.prisma             # Relational data model (Users, Jobs, Tasks, Announcements, Advertisements, Wallets, Deposits, Withdrawals)
│   │   └── seed.js                   # Categories, subcategories, countries, admin account, platform settings
│   ├── src/
│   │   ├── config/                   # Cloudflare R2 S3 client configuration
│   │   ├── controllers/              # Promotion, Auth, Job, Task, Wallet, Referral, Admin, Employer, Category, Support
│   │   ├── middleware/               # Auth (JWT + RBAC), Uploads (Multer), Error Handler
│   │   ├── routes/                   # Promotion, Auth, Job, Task, Wallet, Notification, Upload, Admin, Employer, Category, Support
│   │   ├── utils/                    # Prisma client, SSE Realtime manager, JWT, Cleanup routine
│   │   ├── app.js                    # Express app configuration & middleware
│   │   └── server.js                 # HTTP server entrypoint & SSE heartbeat scheduler
│   ├── uploads/                      # Upload staging directory (proofs, ads)
│   ├── .env.example                  # Environment variable template
│   └── package.json
│
├── DEPLOYMENT.md                     # Comprehensive Vercel + Render + Aiven deployment manual
└── README.md                         # Project documentation
```

---

## 🔑 Environment Configuration

### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<dbname>?ssl-mode=REQUIRED"

# JWT Secrets
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# File Upload Limits
MAX_FILE_SIZE_MB=10

# Cloudflare R2 (Optional - defaults to local disk if absent)
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=tomarkaj-uploads
R2_PUBLIC_BASE_URL=https://pub-your-bucket-id.r2.dev
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MySQL Database (local or cloud like Aiven)

### 2. Backend Setup
```bash
cd backend
npm install
npm run db:push     # Synchronizes Prisma schema with database
npm run dev         # Starts API on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev         # Starts Vite dev server on http://localhost:5173
```

---

## 📡 API Overview (Promotions & Announcements)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/promotions/active` | Public / Worker | Fetches the current active announcement and active advertisement |
| `GET` | `/api/promotions/admin/announcements` | Admin Only | Lists all announcements |
| `POST` | `/api/promotions/admin/announcements` | Admin Only | Creates a new announcement and broadcasts via SSE |
| `PATCH` | `/api/promotions/admin/announcements/:id` | Admin Only | Updates announcement text / active state |
| `DELETE` | `/api/promotions/admin/announcements/:id` | Admin Only | Deletes announcement and updates worker view |
| `GET` | `/api/promotions/admin/advertisements` | Admin Only | Lists all advertisements |
| `POST` | `/api/promotions/admin/advertisements/upload-image` | Admin Only | Uploads ad banner image with MIME & size validation |
| `POST` | `/api/promotions/admin/advertisements` | Admin Only | Creates advertisement with validated destination URL |
| `PATCH` | `/api/promotions/admin/advertisements/:id` | Admin Only | Updates advertisement details & handles safe image replacement |
| `DELETE` | `/api/promotions/admin/advertisements/:id` | Admin Only | Deletes advertisement and deletes image from storage |

---

## 🧪 Verification & Security Audits

The project includes thorough verification covering:
- **RBAC Authorization**: Non-admin users (Workers and Employers) receive `403 Forbidden` on admin promotion endpoints.
- **Protocol Sanitization**: Injection attempts via `javascript:`, `data:`, `vbscript:`, and `file:` protocols are blocked server-side.
- **SSE Delivery**: Automatic verification of real-time payload transmission to active worker connections.
- **Asset Integrity**: Safe replacement workflow ensures zero orphaned files and zero broken image links.
- **Regression Tested**: Complete validation of Worker job browsing, task submissions, wallet operations, Employer campaigns, and Admin moderation queues.

---

## 👨‍💻 Developer Information

- **Developer**: **Azizul Islam**
- **Portfolio**: [https://portfolio-azizul-islam.vercel.app/](https://portfolio-azizul-islam.vercel.app/)
- **GitHub**: [@abidp0189](https://github.com/abidp0189)

---

## 📄 License

This project is proprietary and confidential. All rights reserved © 2026 Tomar Kaj.

