# Backend Setup

This backend uses Prisma with PostgreSQL for persistent storage.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Environment

Create `.env` and set your variables:

Required:

- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — random long secret
- `JWT_EXPIRES_IN` — e.g. `7d`
- `PORT` — optional (default 4000)

Example `.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/civic_platform?schema=public"
JWT_SECRET="change-me-to-a-strong-secret"
JWT_EXPIRES_IN="7d"
PORT=4000
```

## Install

```
cd backend
npm install
```

## Database

- Create DB and run migrations:

```
npx prisma migrate dev --name init
```

- Generate Prisma Client:

```
npx prisma generate
```

- Seed roles and admin user:

```
npm run db:seed
```

## Run server

```
npm run dev
```

Server runs at `http://localhost:4000`.

## API routes

- POST `/auth/register` — name, email, password, phone?, address?
- POST `/auth/login` — email, password
- GET `/profile` — requires `Authorization: Bearer <token>`

## Prisma Studio (optional)

```
npx prisma studio
```
