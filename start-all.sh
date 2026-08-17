#!/usr/bin/env bash

echo "================================================================="
echo "⚡ Starting JanSamvedan (Lightweight Fast Local Mode)..."
echo "================================================================="

# 1. Start PostgreSQL Docker Container (Instant, <2s)
echo ""
echo "🐘 [1/3] Starting Local PostgreSQL container..."
docker compose up -d

# 2. Push Schema & Seed Rohini Data
echo ""
echo "🌱 [2/3] Syncing DB Schema & Rohini Seed Data..."
cd backend || exit
npx prisma db push --skip-generate >/dev/null 2>&1
npx ts-node prisma/seed.ts
cd ..

# 3. Print Info Banner & Launch Servers with Concurrently
echo ""
echo "================================================================="
echo "✅ Ready! Launching Backend & Frontend Dev Servers..."
echo "================================================================="
echo "  🌐 Frontend UI:  http://localhost:3000"
echo "  ⚙️ Backend API:  http://localhost:4000"
echo "  🐘 PostgreSQL:   localhost:5433"
echo "================================================================="
echo ""

npx concurrently \
  --names "BACKEND,FRONTEND" \
  --prefix-colors "blue,green" \
  "npm --prefix backend run dev" \
  "npm run dev"
