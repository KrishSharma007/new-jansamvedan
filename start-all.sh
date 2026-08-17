#!/usr/bin/env bash

echo "================================================================="
echo "⚡ Starting JanSamvedan..."
echo "================================================================="

# 1. Start PostgreSQL Docker Container
echo ""
echo "🐘 [1/2] Starting Local PostgreSQL container..."
docker compose up -d

# 2. Sync Prisma Schema (no seeding)
echo ""
echo "📐 [2/2] Syncing DB schema..."
cd backend || exit
npx prisma db push --skip-generate >/dev/null 2>&1
cd ..

# 3. Print Info Banner & Launch Servers
echo ""
echo "================================================================="
echo "✅ Ready! Launching Backend & Frontend Dev Servers..."
echo "================================================================="
echo "  🌐 Frontend UI:  http://localhost:3000"
echo "  ⚙️ Backend API:  http://localhost:4000"
echo "  🐘 PostgreSQL:   localhost:5433"
echo ""
echo "  💡 First time? Run:  npm run setup"
echo "  🔄 Reset data?  Run:  npm run db:reset"
echo "================================================================="
echo ""

npx concurrently \
  --names "BACKEND,FRONTEND" \
  --prefix-colors "blue,green" \
  "npm --prefix backend run dev" \
  "npm run dev"
