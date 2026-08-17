#!/usr/bin/env bash

echo "================================================================="
echo "🚀 JanSamvedan — First-Time Setup & Seed"
echo "================================================================="

# 1. Start PostgreSQL Docker Container
echo ""
echo "🐘 [1/3] Starting Local PostgreSQL container..."
docker compose up -d

# 2. Sync Prisma Schema
echo ""
echo "📐 [2/3] Syncing DB schema..."
cd backend || exit
npx prisma db push --skip-generate >/dev/null 2>&1

# 3. Seed Demo Data (smart — skips if already seeded)
echo ""
echo "🌱 [3/3] Seeding Rohini demo data..."
npx ts-node prisma/seed.ts
cd ..

echo ""
echo "================================================================="
echo "✅ Setup complete!"
echo "   Now run: npm start"
echo "================================================================="
