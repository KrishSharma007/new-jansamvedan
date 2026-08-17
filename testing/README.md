# 🧪 JanSamvedan Testing Suite

Comprehensive automated test suite for end-to-end verification of authentication, civic reporting, duplicate detection, NGO GPS radius filtering, administrative triage, analytics, data exports, and frontend route availability.

---

## 🚀 Quick Start

Run the entire test suite with a single command:

```bash
npm test
```

Or run the shell script directly:
```bash
./testing/run-all.sh
```

---

## 📁 Directory Structure

```
testing/
├── README.md                     # Documentation & usage guide
├── run-all.sh                    # 1-click test runner executable
├── test-runner.ts                # Master TypeScript test orchestrator
├── utils.ts                      # API request helpers, assertions & color reporting
└── suites/
    ├── auth.test.ts              # Authentication, roles, validation, tokens
    ├── reports.test.ts           # Issue creation, duplicates, confirmations, priority
    ├── ngo-gps.test.ts           # GPS Haversine radius, distance calculations, volunteer pledges
    ├── admin-analytics.test.ts   # Admin triage, status updates, duplicate merging, analytics
    └── frontend-routes.test.ts   # Frontend route availability & HTTP 200 checks
```

---

## 📦 What is Covered

### 1. `auth.test.ts` (Authentication & Security)
- Citizen, Admin, and NGO login with credential validation
- Citizen and NGO registration flows (pending verification defaults)
- Profile retrieval (`GET /auth/me`)
- Rejection of invalid credentials and malformed tokens (401 status checks)

### 2. `reports.test.ts` (Civic Reports & Crowd Upvoting)
- Public report feed retrieval (`GET /reports/all`)
- Geo-tagged complaint creation with coordinates and address (`POST /reports`)
- Single report details & audit history inspection (`GET /reports/:id`)
- Citizen crowd-verification / upvoting (`POST /reports/:id/confirm`)
- Duplicate detection & Haversine proximity clustering (< 150m radius)
- Citizen's own submitted reports (`GET /reports/me`)

### 3. `ngo-gps.test.ts` (NGO Portal & GPS Haversine Radius)
- NGO service area report retrieval with anchor coordinates (`GET /reports/for-ngo`)
- Real-time Haversine distance calculations (`distanceMeters`, `distanceKm`)
- Strict GPS circular radius filtering (`?radius=2` enforcement)
- Radius expansion validation (10km returns $\ge$ 2km)
- Volunteer help pledge addition & verification (`POST /helpers/:id/help`, `GET /helpers/ngo/my-helping`)

### 4. `admin-analytics.test.ts` (Admin Triage & Analytics)
- Overview analytics (`GET /analytics/overview`)
- Detailed department SLA analytics (`GET /analytics/detailed`)
- NGO directory inspection (`GET /auth/ngos`)
- Zonal complaint triage & department assignment (`PATCH /reports/:id/status`)
- CSV report data export (`GET /export/reports/csv`)
- GIS GeoJSON points export (`GET /export/map/geojson`)

### 5. `frontend-routes.test.ts` (Frontend Route Availability)
- Verifies HTTP 200 status and HTML compilation across all Next.js UI pages:
  - `/` (Landing Page)
  - `/login` (Login)
  - `/signup` (Signup)
  - `/citizen/dashboard` (Citizen Portal)
  - `/report` (Report Issue)
  - `/map` (Interactive GIS Map)
  - `/my-reports` (My Reports)
  - `/ngo/dashboard` (NGO Action Portal)
  - `/admin/dashboard` (Admin Portal)
  - `/admin/ngos` (Admin NGO Directory)

---

## ⚙️ Configuration & Environment Variables

You can customize test endpoints with environment variables:

```bash
API_BASE="http://localhost:4000" FRONTEND_BASE="http://localhost:3000" npm test
```
