# JanSamvedan

## Prerequisites
- Node.js (v18+)
- Docker & Docker Compose

## Environment Setup

### Frontend `.env`
Create `.env` in the root directory:
```env
NEXT_PUBLIC_API_BASE="http://localhost:4000"
```

### Backend `.env`
Create `backend/.env`:
```env
DATABASE_URL="postgresql://jansamvedan:jansamvedan_secret@localhost:5433/jansamvedan?schema=public"
JWT_SECRET="jansamvedan-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=4000
USE_LOCAL_STORAGE="true"
```

## Getting Started

1. Install dependencies:
```bash
npm install
cd backend && npm install && cd ..
```

2. **First-time setup** — starts Docker, syncs schema, and seeds demo data:
```bash
npm run setup
```

3. **Start the app** (no seeding — just starts servers):
```bash
npm start
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Demo Credentials

All accounts use password: `password123`

| Role | Email |
|------|-------|
| 👤 Citizen | `vikram@gmail.com` |
| 👤 Citizen 2 | `neha.gupta@yahoo.com` |
| 🛡️ Admin (MCD) | `admin@jansamvedan.org` |
| 🛡️ Admin (PWD) | `sunita.admin@jansamvedan.org` |
| 🛡️ Admin (DJB) | `anil.djb@jansamvedan.org` |
| 🛡️ Admin (Traffic) | `manoj.traffic@jansamvedan.org` |
| 🛡️ Admin (BSES) | `geeta.bses@jansamvedan.org` |
| 🏢 NGO (Verified) | `amit@cleanrohini.org` |
| 🏢 NGO (Verified) | `priya@greendelhi.org` |
| 🏢 NGO (Verified) | `suresh@roadsavers.org` |
| 🏢 NGO (Verified) | `tarun@pitampurahelps.org` |
| 🏢 NGO (Verified) | `kavya@shalimarbag.org` |
| 🏢 NGO (Pending) | `deepak@youthaid.in` |

## Database Reset

To wipe the database and re-seed with fresh demo data:
```bash
npm run db:reset
```
