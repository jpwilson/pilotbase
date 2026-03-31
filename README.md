# PilotBase

AI-powered scheduling automation for flight schools. PilotBase watches your Flight Schedule Pro (FSP) calendar, generates smart scheduling suggestions, and lets your team approve or decline them before anything executes.

**Live app:** [pilotbase-3ce7knm2v-jpwilsons-projects.vercel.app](https://pilotbase-3ce7knm2v-jpwilsons-projects.vercel.app)

---

## What It Does

Flight school schedulers spend hours manually filling gaps, rescheduling cancellations, and booking discovery flights. PilotBase automates the busywork while keeping humans in the loop.

**Four automation engines:**

| Engine | Trigger | Action |
|---|---|---|
| Waitlist | Schedule opening detected | Ranks waitlisted students and proposes the best fit |
| Reschedule | Lesson cancelled | Finds alternative slots for the affected student |
| Discovery Flight | New prospect request | Finds daylight-only slots for trial flights |
| Next Lesson | Lesson completed | Suggests the student's next logical training event |

All suggestions land in the **Approval Queue** — nothing touches FSP until a scheduler approves it.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Database:** Supabase (PostgreSQL with RLS for multi-tenant isolation)
- **Scheduling:** Flight Schedule Pro API (custom client in `src/lib/fsp/`)
- **Hosting:** Vercel (cron jobs via API routes)
- **Notifications:** Twilio SMS (stubbed, ready to enable)
- **Testing:** Vitest

---

## Local Development

### Prerequisites

- Node.js 20+
- A Supabase project
- FSP API credentials

### Setup

```bash
npm install
cp .env.example .env.local
# Fill in .env.local (see Environment Variables below)
npm run dev
```

App runs at `http://localhost:3000`. Auth is currently stubbed — you'll be logged in automatically as a demo scheduler.

### Environment Variables

```env
# Flight Schedule Pro
FSP_API_BASE_URL=https://api.flightschedulepro.com
FSP_API_EMAIL=your-service-account@flightschool.com
FSP_API_PASSWORD=your-password

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Notifications (optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Cron security
CRON_SECRET=your-random-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database

Migrations are in `supabase/migrations/`. Apply them via the Supabase CLI or dashboard.

Key tables: `suggestions`, `audit_log`, `operator_config`, `discovery_requests`, `notification_log`.

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── queue/          # Approval queue — main workflow view
│   │   ├── activity/       # Mission log / audit feed
│   │   ├── discovery/      # Discovery flight request management
│   │   ├── students/       # Student roster and progress
│   │   └── settings/       # Priority weights and feature flags
│   └── api/
│       ├── suggestions/    # Approve/decline suggestions
│       ├── discovery/      # Discovery requests
│       ├── activity/       # Audit log queries
│       ├── settings/       # Operator config
│       └── cron/           # Background jobs (monitor-schedule, check-completions)
├── lib/
│   ├── engine/             # Core scheduling logic (ranker, constraints, per-use-case engines)
│   ├── fsp/                # Flight Schedule Pro API client
│   ├── supabase/           # Database clients
│   ├── jobs/               # Cron job handlers
│   └── notifications/      # SMS/email templates
└── components/
    ├── queue/              # Suggestion cards, filters, bulk actions
    └── tour/               # Guided onboarding tour
```

---

## Background Jobs

Two cron endpoints run automatically on Vercel:

- `POST /api/cron/monitor-schedule` — every 5 min, detects FSP schedule changes and generates waitlist/reschedule suggestions
- `POST /api/cron/check-completions` — every 15 min, checks for completed lessons and generates next-lesson suggestions

Both require a `Authorization: Bearer <CRON_SECRET>` header.

---

## Scripts

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run lint          # ESLint
npm run format        # Prettier (fix)
npm run format:check  # Prettier (check only)
npm run type-check    # TypeScript (no emit)
npm run test          # Run tests
npm run test:coverage # Tests with coverage report
```

---

## Architecture Notes

- **Suggest-and-approve model** — the engine never writes to FSP directly; it creates a `suggestion` record that a human must approve first
- **FSP is source of truth** — reservations, schedules, and student data all come from FSP; PilotBase only stores suggestions, audit logs, config, and notification history
- **Multi-tenant** — each flight school is an `operator_id`; Supabase RLS enforces isolation at the DB level
- **Auth** — currently stubbed with a mock session; designed for FSP auth library drop-in
