# Production Deployment Guide (Vercel + Render + Aiven)

This guide walks you through deploying your microjob platform using **Aiven** (Database), **Render** (Backend API), and **Vercel** (Frontend Web App).

---

## 1. Aiven (Cloud Database)

1. Sign up / Log in to [Aiven Console](https://console.aiven.io/).
2. Create a new service:
   - **Service Type**: MySQL (or PostgreSQL)
   - **Cloud Provider & Region**: Choose closest to your users (e.g., AWS / Google Cloud)
   - **Plan**: Free Tier / Startup Plan
3. Once running, copy the **Service URI** (Connection String):
   - Example (MySQL): `mysql://avnadmin:PASSWORD@host.aivencloud.com:PORT/defaultdb?ssl-mode=REQUIRED`
   - Example (PostgreSQL): `postgresql://avnadmin:PASSWORD@host.aivencloud.com:PORT/defaultdb?sslmode=require`

> [!NOTE]
> If using MySQL on Aiven, ensure `backend/prisma/schema.prisma` datasource provider is set to `"mysql"`. If using PostgreSQL, set to `"postgresql"`.

---

## 2. Render (Backend Node.js Service)

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `https://github.com/abidp0189/<your-repo-name>`.
4. Configure service settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: Your Aiven Connection URI
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `JWT_SECRET`: Random secure string (e.g. `openssl rand -hex 32`)
   - `REFRESH_TOKEN_SECRET`: Random secure string
   - `FRONTEND_URL`: Your Vercel domain (e.g. `https://your-app.vercel.app`)
6. Deploy the web service.
7. In the Render Shell tab, run:
   ```bash
   npm run db:push
   npm run db:seed
   ```
8. Note your Render service URL (e.g. `https://taskhive-api.onrender.com`).

---

## 3. Vercel (Frontend React + Vite App)

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository: `https://github.com/abidp0189/<your-repo-name>`.
4. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-render-backend-url.onrender.com/api`
6. Click **Deploy**.

---

## 4. Test Production Endpoints
- Open your Vercel URL to verify the UI.
- Log in with default seeded admin credentials (`admin@taskhive.com` / `password123`) or register a new user.
- Verify job posting, task submission, deposits, and payouts.
