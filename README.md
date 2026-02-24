# KrisBan 🚀

A role-based project workspace for teams, combining Kanban-style collaboration, sprint planning, and automated progress reporting.

![Status](https://img.shields.io/badge/Status-Active-green)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![Backend](https://img.shields.io/badge/Backend-Express-000000)
![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E)

---

## ✨ What KrisBan Does

- **Role-based dashboard** for `ADMIN` and `USER`
- **Progress report workflow** (create, view, edit, delete)
- **Sprint + team plan tracking**
- **Weekly progress analytics** and summary stats
- **First-login password change enforcement**
- **Modern UI** with Tailwind and React Query caching

---

## 🧱 Tech Stack

### Frontend
- React + Vite
- Tailwind CSS
- TanStack React Query
- Axios
- Hugeicons

### Backend
- Node.js + Express
- Supabase (`@supabase/supabase-js`)
- JWT auth
- bcryptjs
- Helmet + CORS

### AI / Automation
- Google Generative AI SDK (`@google/generative-ai`) for report generation flow

---

## 📁 Project Structure

- [frontend/](frontend)
- [backend/](backend)
- [build-frontend.js](build-frontend.js)
- [Procfile](Procfile)
- [vercel.json](vercel.json)

---

## 🔐 Authentication & Access

- Login is handled through [`authService.login`](frontend/src/services/api.js).
- Auth/session state is managed in [`AuthContext`](frontend/src/context/AuthContext.jsx).
- Protected backend routes use [`protect`](backend/src/middleware/auth.js).
- First-time users are required to change password before full access.

---

## 📊 Progress Report API (Current)

Defined in [backend/src/routes/progressReportRoutes.js](backend/src/routes/progressReportRoutes.js):

- `GET /api/progress-reports/stats/summary` → [`progressReportController.getProgressReportSummary`](backend/src/controllers/progressReportController.js)
- `GET /api/progress-reports/stats/last-week` → [`progressReportController.getLastWeekProgressStats`](backend/src/controllers/progressReportController.js)
- `GET /api/progress-reports/:id` → [`progressReportController.getProgressReportById`](backend/src/controllers/progressReportController.js)
- `GET /api/progress-reports` → [`progressReportController.getProgressReports`](backend/src/controllers/progressReportController.js)
- `POST /api/progress-reports` → [`progressReportController.createProgressReport`](backend/src/controllers/progressReportController.js)
- `PUT /api/progress-reports/:id` → [`progressReportController.updateProgressReport`](backend/src/controllers/progressReportController.js)
- `DELETE /api/progress-reports/:id` → [`progressReportController.deleteProgressReport`](backend/src/controllers/progressReportController.js)

All routes are protected by auth middleware.

---

## ⚙️ Local Development

### 1) Install dependencies
From project root:
- install root deps
- install frontend deps
- install backend deps

### 2) Environment setup

Use:
- [backend/.env.example](backend/.env.example)
- [frontend/.env.example](frontend/.env.example)

Create:
- `backend/.env`
- `frontend/.env` (if needed)

### 3) Run apps

**Backend** (default port `5000`):
- script: `npm run dev` in [backend/package.json](backend/package.json)

**Frontend** (default port `3000`):
- script: `npm run dev` in [frontend/package.json](frontend/package.json)
- dev proxy is configured in [frontend/vite.config.js](frontend/vite.config.js)

---

## 🏗 Build & Deploy

- Frontend build helper: [build-frontend.js](build-frontend.js)
- Backend start command: [Procfile](Procfile)
- Vercel configs: [vercel.json](vercel.json), [frontend/vercel.json](frontend/vercel.json)

---

## 🌱 Seeding

Available backend scripts in [backend/package.json](backend/package.json):

- `npm run seed` → seeds sample users and boards via [backend/src/seed.js](backend/src/seed.js)
- `npm run seed:progress` → seeds progress report data
- Sprint seeding utility: [backend/src/seed-sprints.js](backend/src/seed-sprints.js)

---

## 🧭 Main Frontend Views

- Dashboard: [frontend/src/components/DashboardView.jsx](frontend/src/components/DashboardView.jsx)
- Progress reports: [frontend/src/components/ProgressReportsView.jsx](frontend/src/components/ProgressReportsView.jsx)
- Sprints: [frontend/src/components/SprintsView.jsx](frontend/src/components/SprintsView.jsx)
- Login: [frontend/src/pages/LoginPage.jsx](frontend/src/pages/LoginPage.jsx)

---

## 📌 Notes

- Large payload support is enabled in backend JSON parsing for image/report payloads.
- Image upload in progress reports currently supports base64 flow in the frontend form.
- React Query keys are used across dashboard/progress/sprint modules for cache invalidation consistency.

---

## 📄 License

MIT
