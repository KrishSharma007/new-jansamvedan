# Backend Setup & Architecture

JanSamvedan backend is built with Express, TypeScript, and Prisma ORM using **PostgreSQL** exclusively for production and development storage.

---

## Database Configuration (PostgreSQL Only)

The application uses **PostgreSQL** via Prisma.

### Prisma Datasource (`backend/prisma/schema.prisma`):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/jansamvedan?schema=public"
JWT_SECRET="jansamvedan-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=4000
```

---

## Installation & Setup

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Sync Database Schema**:
   ```bash
   npx prisma db push
   ```

3. **Seed Database**:
   ```bash
   npx ts-node prisma/seed.ts
   ```

4. **Start Backend Server**:
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
