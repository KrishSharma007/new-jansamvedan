# ─── Backend Dockerfile ─────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ─── Production stage ──────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads

EXPOSE 4000

# On start: push schema to DB, seed if needed, then start server
CMD sh -c "npx prisma db push --skip-generate && node dist/server.js"
