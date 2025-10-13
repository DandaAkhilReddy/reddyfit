# ReddyTalk.ai - Healthcare Call Center Dashboard

Desktop-first web application for managing AI-powered healthcare call centers with HIPAA-compliant call handling, appointment booking, and real-time analytics.

## 🎯 Project Overview

**Target Clinics**: Family Medicine, Gastroenterology, Dentistry, Cardiology
**Monthly Call Volume**: ~3,000 calls per clinic
**MVP Timeline**: 30 days

## ✨ Key Features

### Phase 1 (Days 1-8) - Foundation ✅
- ✅ Next.js 15 + TypeScript setup
- ✅ TailwindCSS + shadcn/ui components
- ✅ Zustand state management
- ✅ React Query for API calls
- ✅ Prisma database schema
- ✅ RBAC authentication middleware
- ✅ Dashboard layout with sidebar navigation
- ✅ Overview page with KPI cards and charts

### Phase 2 (Days 9-17) - Core Features
- [ ] Live Calls monitoring page
- [ ] Call History with search & filters
- [ ] Appointments calendar (Day/Week/Month views)
- [ ] Analytics dashboard with charts
- [ ] Settings page
- [ ] Backend API (Azure Functions)

### Phase 3 (Days 18-24) - Real-Time & AI
- [ ] WebSocket integration for live transcription
- [ ] Ready Agent (LIFO waitlist backfill)
- [ ] Daily 5pm outbound calls
- [ ] PHI redaction pipeline

### Phase 4 (Days 25-30) - Polish & Compliance
- [ ] HIPAA compliance audit
- [ ] Security hardening
- [ ] Performance optimization
- [ ] Deployment to Azure

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Components**: shadcn/ui
- **State**: Zustand (global) + React Query (server)
- **Charts**: Recharts
- **Real-time**: Socket.io / Azure Web PubSub

### Backend
- **Runtime**: Azure Functions (Node.js)
- **Database**: Azure SQL (Prisma ORM)
- **Storage**: Azure Blob Storage
- **Auth**: JWT (Azure AD B2C ready)
- **Real-time**: Azure Web PubSub

### Integrations
- **Voice**: WAPI/Vapi (HIPAA-compliant)
- **Scheduling**: Calendly (now) → EHR adapters (later)
- **Automation**: Make.com (interim)
- **SMS/Email**: Twilio, SendGrid (optional)

## 📁 Project Structure

```
reddytalkf1/
├── app/                    # Next.js app router
│   ├── dashboard/          # Dashboard pages
│   │   ├── page.tsx        # Overview
│   │   ├── live-calls/     # Live call monitoring
│   │   ├── calls/          # Call history
│   │   ├── appointments/   # Appointment manager
│   │   ├── analytics/      # Analytics & reports
│   │   └── settings/       # Settings
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── layout/             # Layout components
│   ├── dashboard/          # Dashboard-specific
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilities
│   ├── api/                # API client & React Query
│   ├── auth/               # Authentication & RBAC
│   ├── store/              # Zustand stores
│   ├── types/              # TypeScript types
│   └── utils.ts            # Helper functions
├── hooks/                  # Custom React hooks
├── prisma/                 # Database schema
│   └── schema.prisma
├── azure-functions/        # Backend API
│   ├── GetKPIs/            # KPI endpoint
│   ├── GetCalls/           # Call history
│   ├── WapiWebhook/        # WAPI webhook receiver
│   ├── TriggerBackfill/    # Ready Agent trigger
│   └── host.json
└── .env.example            # Environment variables template
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Azure account
- WAPI API key
- Calendly account

### Installation

1. Clone and install dependencies:
```bash
cd C:/Users/akhil/reddytalkf1
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Initialize Prisma:
```bash
npx prisma generate
npx prisma db push
```

4. Run development server:
```bash
npm run dev
```

5. Run Azure Functions locally (separate terminal):
```bash
cd azure-functions
npm install
func start
```

## 🔐 User Roles & Permissions

| Role | Permissions |
|------|------------|
| **Super Admin** (ReddyTalk HQ) | Full access + internal cost dashboard |
| **Clinic Admin** | Analytics, staff management, all calls |
| **Front Desk** | Live monitoring, call takeover, appointments |
| **Doctor** | Own appointments & call summaries only |
| **Franchise Admin** | Aggregate read-only across multiple clinics |

## 📊 Database Schema

### Core Tables
- `clinics` - Multi-tenant clinic info
- `users` - Staff with RBAC roles
- `calls` - Call records with transcripts
- `appointments` - Booked appointments
- `waitlist` - LIFO queue for Ready Agent
- `cancellations` - Triggers backfill
- `billing_metrics` - Internal cost tracking (hidden from clinics)
- `alerts` - Smart notifications
- `settings` - Per-clinic configuration

## 🔄 Key Workflows

### Inbound Call
1. WAPI → Webhook → Azure Function
2. Create `calls` row (status=active)
3. Stream transcript via WebSocket
4. AI handles intent → Book appointment
5. If no slot: add to `waitlist` (LIFO)
6. Call ends → Redact PHI → Store URLs

### Cancellation → Backfill
1. Cancellation event → Create `cancellations` row
2. Query `waitlist` (LIFO order)
3. Ready Agent auto-dials patient
4. Confirm → Book → Update both tables
5. Failure → Retry → Escalate to front desk

### Daily 5pm Outbound
1. Timer trigger at 5pm local time
2. Query eligible patients
3. WAPI places calls: "Your report is ready"
4. Log outcomes

## 🔒 HIPAA Compliance

- ✅ WAPI HIPAA mode enabled ($1,000/mo)
- ✅ Azure SQL encryption (AES-256 at rest)
- ✅ TLS 1.3 for all traffic
- ✅ PHI redaction in transcripts
- ✅ Role-based data masking
- ✅ Audit logs for all actions
- ✅ US-only Azure regions

## 💰 Cost Tracking (Internal Only)

Costs are tracked in `billing_metrics` table but **hidden from clinic roles**. Only `super_admin` can view:
- WAPI per-minute charges
- Azure compute/storage
- Make.com operations
- Gross margin per clinic

## 🛠️ Development Commands

```bash
# Frontend
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma studio    # Open Prisma Studio GUI
npx prisma generate  # Regenerate Prisma Client
npx prisma db push   # Push schema to database
npx prisma migrate dev  # Create migration

# Azure Functions
cd azure-functions
func start           # Run functions locally
func azure functionapp publish <name>  # Deploy to Azure
```

## 🚢 Deployment

### Frontend (Azure Static Web Apps or App Service)
```bash
npm run build
# Deploy via GitHub Actions or Azure CLI
```

### Backend (Azure Functions)
```bash
cd azure-functions
func azure functionapp publish reddytalk-api
```

### Database (Azure SQL)
- Create Azure SQL Database
- Update `DATABASE_URL` in env
- Run `npx prisma db push`

## 📈 Future Roadmap

- EHR integrations (Athenahealth, Epic, Cerner)
- Pocket Scheduler microservice
- React Native mobile app
- A/B testing for AI prompts/voices
- Predictive staffing recommendations
- Power BI integration

## 📝 License

Proprietary - ReddyTalk.ai © 2025

## 🤝 Support

For issues or questions, contact the development team.
