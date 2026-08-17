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

2. Start the application:
```bash
npm start
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
