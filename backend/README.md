# Backend Setup & Architecture

JanSamvedan backend is built with Express, TypeScript, and Prisma ORM.

---

## Database Configuration

The application is configured by default for **zero-config local development and testing** using SQLite (`backend/prisma/dev.db`), and supports production deployment using **PostgreSQL**.

### 1. Local Development (SQLite — Default)
- **Database File**: `backend/prisma/dev.db`
- **Setup Command**:
  ```bash
  cd backend
  npx prisma db push
  npx ts-node prisma/seed.ts
  ```

### 2. Production Deployment (PostgreSQL)
To switch to PostgreSQL for production deployment:
1. Update `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set your environment variable in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/jansamvedan?schema=public"
   ```
3. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

---

## Prerequisites

- Node.js 18+
- npm

## Environment Variables

Create `backend/.env` (optional for local SQLite, required for PostgreSQL or custom JWT secret):

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="jansamvedan-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=4000
```

---

## Installation & Running

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Seed sample data**:
   ```bash
   npx ts-node prisma/seed.ts
   ```

3. **Start backend server**:
   ```bash
   npm run dev
   ```
   Server listens at `http://localhost:4000`.

---

## Key API Endpoints Overview

### Authentication & NGO Verification
- `POST /auth/register` — Citizen & NGO user registration (NGOs start as `PENDING`)
- `POST /auth/login` — User authentication (returns JWT token)
- `GET /auth/ngos` — List NGOs with status filter (*Admin only*)
- `PATCH /auth/ngos/:id/status` — Approve or reject NGO verification (*Admin only*)

### Reports & Crowd Verification
- `GET /reports` — Fetch civic reports (*Admin*)
- `GET /reports/for-ngo` — Fetch relevant reports scoped to service area (*NGO*)
- `POST /reports` — File a new report ticket
- `POST /reports/find-duplicates` — Proximity and address duplicate issue detection
- `POST /reports/:id/confirm` — Crowd confirmation & dynamic priority score boost
- `PATCH /reports/:id/status` — Status transition & atomic audit trail logging

### Helper Pledges
- `POST /helpers/:complaintId/help` — Pledge NGO assistance (*Verified NGOs only*)

### Notifications
- `GET /notifications/me` — Fetch user notifications & unread count
- `PATCH /notifications/:id/read` — Mark notification read
