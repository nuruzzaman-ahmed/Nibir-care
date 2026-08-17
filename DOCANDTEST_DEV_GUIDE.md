# DOC&TEST — Developer Guide

> Read this first. Everything you need to pick up the project, fix bugs, or add features.

---

## 1. What the App Does

DOC&TEST is a Bangladeshi healthcare platform:
- **Patients** book appointments with doctors and diagnostic tests; track queue live; receive prescriptions.
- **Doctors** manage chambers and schedules, advance the queue, write prescriptions, and add walk-in patients. Subject to a subscription plan (FREE trial / PRO / BUSINESS).
- **Diagnostic Centers** manage services and bookings; add walk-in test bookings; link affiliated doctors. Same subscription gating as doctors.
- **Admin** verifies doctors and centers; manages users; sees subscription status on every provider.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (`@theme` tokens in globals.css) |
| Database | SQLite (dev) / PostgreSQL (prod) via Prisma 5.22 |
| Auth | NextAuth v5 beta — Credentials provider, JWT |
| Real-time | SSE (queue updates) + 8s polling (TV display) |
| Bengali fonts | Hind Siliguri, Noto Sans Bengali |

---

## 3. Repository Layout

```
E:\Nibr-care\docandtest\
├── prisma/
│   ├── schema.prisma          # Full DB schema
│   ├── seed.ts                # Main seed (demo users, chambers, etc.)
│   └── seed-medicines.mjs     # 115 medicines — run separately with node
├── src/
│   ├── app/
│   │   ├── (public)/          # All patient-facing pages (layout with header+nav)
│   │   │   ├── page.tsx       # Homepage
│   │   │   ├── doctors/       # Doctor directory
│   │   │   ├── doctor/[slug]/ # Doctor profile + booking
│   │   │   ├── diagnostic-centers/  # Center directory
│   │   │   ├── diagnostic/[slug]/   # Center profile + test booking
│   │   │   ├── book/[slug]/   # Appointment booking flow
│   │   │   ├── notifications/ # Patient notifications
│   │   │   ├── my/prescriptions/    # Patient prescriptions list + detail
│   │   │   └── queue-display/[chamberId]/  # TV queue display (public, no auth)
│   │   ├── doctor/dashboard/  # Doctor dashboard + queue management
│   │   ├── diagnostic/dashboard/    # Diagnostic center dashboard
│   │   ├── admin/             # Admin panel
│   │   ├── api/               # All API routes
│   │   │   ├── auth/          # NextAuth handlers
│   │   │   ├── appointments/  # Book, list, update appointments
│   │   │   ├── appointments/walkin/  # Doctor walk-in booking
│   │   │   ├── test-booking/  # Diagnostic test bookings
│   │   │   ├── test-booking/walkin/  # Diagnostic walk-in booking
│   │   │   ├── chamber/[chamberId]/today/  # Public queue stats (TV + polling)
│   │   │   ├── queue/         # Queue actions: next, skip, no-show, pause, resume
│   │   │   ├── prescriptions/ # Create/fetch prescriptions
│   │   │   ├── prescriptions/[appointmentId]/  # Get prescription by appointment
│   │   │   ├── medicines/search/  # Medicine autocomplete search
│   │   │   ├── doctors/       # Doctor profile CRUD
│   │   │   ├── diagnostic/    # Center CRUD, service CRUD, doctor linking
│   │   │   ├── notifications/ # Notification list + mark-read
│   │   │   └── admin/         # Verification endpoints
│   │   └── globals.css        # Tailwind v4 theme tokens + animations
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx     # Sticky 56px header, profile dropdown
│   │   │   ├── footer.tsx     # Minimal dark footer
│   │   │   └── bottom-nav.tsx # Mobile 5-tab bottom nav (58px)
│   │   ├── shared/
│   │   │   ├── doctor-card.tsx        # Doctor listing card (full + compact)
│   │   │   └── diagnostic-card.tsx    # Center listing card
│   │   └── ui/                # shadcn/ui primitives (button, avatar, badge, etc.)
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config, JWT callbacks
│   │   ├── db.ts              # Singleton Prisma client
│   │   ├── utils.ts           # cn(), formatCurrency(), etc.
│   │   └── queue-engine.ts    # Queue state machine + ETA + notifications
│   └── proxy.ts               # RBAC routing (Next.js 16 middleware replacement)
```

---

## 4. Database Schema (Key Models)

```
User           — base user: email, password (hashed), role, name
PatientProfile — extended patient info, linked 1-1 to User
DoctorProfile  — verified doctor: specialties, bio, BMDC, fee
DiagnosticCenter — verified center: address, services
DoctorChamber  — where a doctor sees patients (address, days, slots, daily limit)
DoctorSpecialty — junction: doctor ↔ specialty
Schedule       — which slots are open on which days per chamber
Appointment    — queue slot: serial, status, patient/walkin, startedAt, completedAt
Queue          — one per chamber per date: currentSerial, status, rolling avg
TestBooking    — diagnostic test booking: service, patient/walkin, date, status
DiagnosticService — what tests a center offers (name, price)
CenterDoctor   — junction: center ↔ affiliated doctor
Prescription   — written by doctor for an appointment; unique per appointment
PrescriptionItem — one medicine row in a prescription
Medicine       — 115 common Bangladeshi medicines with type, strength, genericName
Notification   — in-app alerts to users
Subscription   — billing plan for a doctor or center: plan, status, endsAt
Specialty      — lookup table of medical specialties
```

### Walk-in support
`Appointment` has:
- `patientId String?` (null for walk-ins)
- `isWalkin Boolean @default(false)`
- `walkinName String?`
- `walkinPhone String?`

`TestBooking` has `isWalkin Boolean @default(false)`.

### Subscription system
`Subscription` (`prisma/schema.prisma`) has a nullable `doctorId` or `centerId` (exactly one set), `plan` (`FREE|PRO|BUSINESS`), `status` (`TRIALING|ACTIVE|EXPIRED|CANCELLED`), and `endsAt`.

- **Plan config**: `src/lib/subscription.ts` — `PLAN_CONFIG` (price, duration in days), `isSubscriptionActive(sub)` (true if `endsAt > now` and not cancelled — computed reactively, no cron needed), `subscriptionDaysLeft(sub)`, `activePlanFilter()` (Prisma where-clause helper for public listings).
- **On registration**: `POST /api/auth/register` auto-creates a `FREE` / `TRIALING` subscription (30 days) for new `DOCTOR`/`DIAGNOSTIC` accounts.
- **Activating/changing a plan**: `POST /api/subscription/activate` (body: `{ plan }`) — upserts the subscription with a fresh `endsAt`. **No real payment gateway is wired up** — it activates immediately (clearly labeled "demo mode" in the UI). Hook bKash/Nagad/SSLCommerz into this route before charging real money.
- **Billing pages**: `/doctor/dashboard/billing` and `/diagnostic/dashboard/billing`, both rendering the shared `src/components/billing/billing-client.tsx` (3 plan cards + current status banner).
- **Restriction when expired**: `src/components/billing/subscription-gate.tsx` — a client component wrapped around `{children}` in both dashboard layouts. If the subscription isn't active, it blocks the entire dashboard behind a full-screen "প্ল্যানের মেয়াদ শেষ" upgrade prompt — except the billing page itself, which stays reachable (`usePathname()` check) so the user can always upgrade.
- **Public listing enforcement**: doctors/centers whose subscription is expired disappear from `/doctors`, `/tests`, `/diagnostic-centers`, and the homepage (`activePlanFilter()` added to the Prisma `where`). Their own profile page (`/doctor/[slug]`, `/diagnostic/[slug]`) still resolves but shows a "সাময়িকভাবে বুকিং বন্ধ" notice instead of the booking form.
- **Migrating old data**: `prisma/backfill-subscriptions.mjs` grants any doctor/center without a subscription row an active 1-year PRO plan — run once after deploying this feature on a database that pre-dates it. `prisma/seed.ts` also creates one for every seeded demo doctor/center.

---

## 5. Auth & Roles

Roles: `PATIENT | DOCTOR | DIAGNOSTIC | ADMIN`

JWT payload (from `src/lib/auth.ts`):
```ts
token.role = user.role
token.id   = user.id
```

Session user always has `.role` and `.id`.

**RBAC** is enforced in `src/proxy.ts` (Next.js 16's replacement for `middleware.ts`). It checks session role against the requested path prefix and redirects accordingly.

Demo accounts (seeded):
| Email | Password | Role |
|---|---|---|
| patient@demo.com | demo1234 | PATIENT |
| doctor@demo.com | demo1234 | DOCTOR |
| center@demo.com | demo1234 | DIAGNOSTIC |
| admin@demo.com | demo1234 | ADMIN |

---

## 6. Queue Engine (`src/lib/queue-engine.ts`)

The central service for all queue operations.

### Key exports

| Function | What it does |
|---|---|
| `generateSerial(chamberId, date)` | Atomic serial allocation via `$transaction`. Throws `DAILY_LIMIT_REACHED`. |
| `nextPatient(queueId, doctorUserId)` | Marks current as COMPLETED, advances to next WAITING. Updates rolling avg. Sends notifications. |
| `skipPatient(queueId, apptId)` | Marks appointment SKIPPED. |
| `markNoShow(queueId, apptId)` | Marks NO_SHOW. |
| `pauseQueue / resumeQueue` | Toggles queue status. |
| `setDoctorDelay(queueId, minutes)` | Broadcasts delay notification to all waiting patients (skips walk-ins). |
| `updateRollingAverage(current, newDuration)` | EWA: `current * 0.9 + new * 0.1` |
| `registerSSEClient / broadcastQueueUpdate` | SSE fanout for live dashboard updates. |

### Walk-in notification guard
Walk-in patients have no user account. The internal `createQueueNotification` skips silently if `appt.patient` is null.

---

## 7. Real-time Architecture

### Doctor dashboard (SSE)
- Doctor dashboard subscribes to `GET /api/queue/[queueId]/stream`
- Server pushes JSON events on every queue mutation
- Client reconnects automatically on disconnect

### TV queue display (polling)
- `GET /api/chamber/[chamberId]/today` — public endpoint, no auth
- Returns: queue stats, currentAppt (serial + name), nextAppt (serial + name)
- TV component polls every 8 seconds
- Detects serial change → flashes screen + Bengali voice announcement

---

## 8. Bengali TTS (TV Display)

File: `src/app/(public)/queue-display/[chamberId]/components/tv-display.tsx`

```ts
function announce(text: string) {
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "bn-BD";
  // Falls back to any bn-* voice, then hi-IN, then default
  window.speechSynthesis.speak(utt);
}
```

Announcement format:
> "এখন চলছে সিরিয়াল নম্বর ১২০। পরবর্তী সিরিয়াল ১২১, ফজলুল ইসলাম। প্রস্তুত থাকুন।"

Digits are converted to Bengali using `toBn(n)`.

---

## 9. Prescription System

### Writing (Doctor)
1. Doctor clicks "প্রেসক্রিপশন লিখুন" on current patient in dashboard
2. `PrescriptionModal` opens (`src/app/doctor/dashboard/components/prescription-modal.tsx`)
3. Doctor fills vitals, complaint, diagnosis, medicines (autocomplete), advice, follow-up
4. Saves to `POST /api/prescriptions`
5. API does `prescription.upsert` by appointmentId — editable any time
6. Patient gets GENERAL notification (if they have an account)

### Medicine autocomplete
- `GET /api/medicines/search?q=<text>` — searches nameEn, genericName, nameBn
- Returns up to 15 results
- Debounced 250ms in the modal UI

### Viewing (Patient)
- `/my/prescriptions` — list of all prescriptions (newest first)
- `/my/prescriptions/[id]` — full detail with print button
- Print: `window.print()` with `print:` Tailwind variant classes

---

## 10. Walk-in Bookings

### Doctor walk-in
**API:** `POST /api/appointments/walkin`
```json
{ "chamberId": "...", "walkinName": "রোগীর নাম", "walkinPhone": "01...", "patientNote": "..." }
```
- Generates serial atomically
- Creates appointment with `isWalkin: true`, `status: WAITING`
- No SMS/notification at this stage (SMS integration planned)

### Diagnostic walk-in
**API:** `POST /api/test-booking/walkin`
```json
{ "centerId": "...", "serviceId": "...", "patientName": "...", "patientPhone": "...", "date": "2026-01-15", "timeSlot": "09:00" }
```

---

## 11. API Route Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/[...nextauth]` | — | NextAuth |
| GET/POST | `/api/appointments` | PATIENT | Book / list appointments |
| POST | `/api/appointments/walkin` | DOCTOR | Walk-in booking |
| GET | `/api/chamber/[id]/today` | Public | Queue stats for TV display |
| GET | `/api/medicines/search` | DOCTOR | Medicine autocomplete |
| GET/POST | `/api/prescriptions` | DOCTOR | Write prescription |
| GET | `/api/prescriptions/[apptId]` | DR/PT/ADMIN | Fetch prescription |
| POST | `/api/test-booking/walkin` | DIAGNOSTIC | Walk-in test booking |
| GET/POST | `/api/queue/[queueId]` | DOCTOR | Queue control |
| GET | `/api/queue/[queueId]/stream` | DOCTOR | SSE stream |
| POST | `/api/queue/[queueId]/next` | DOCTOR | Next patient |
| POST | `/api/queue/[queueId]/skip` | DOCTOR | Skip patient |
| POST | `/api/queue/[queueId]/no-show` | DOCTOR | No-show |
| POST | `/api/queue/[queueId]/pause` | DOCTOR | Pause queue |
| POST | `/api/queue/[queueId]/resume` | DOCTOR | Resume queue |
| GET | `/api/notifications` | AUTH | List notifications |
| POST | `/api/notifications/read-all` | AUTH | Mark all read |

---

## 12. Running the Project

### Prerequisites
- Node.js 20+
- No external DB needed (SQLite)

### Setup
```bash
cd E:\Nibr-care\docandtest
npm install
npx prisma db push
npx prisma db seed           # Demo users, chambers, services, etc.
node prisma/seed-medicines.mjs  # 115 medicines for prescription autocomplete
npm run dev
```

Open: http://localhost:3000

### Dev server note
The project uses Next.js 16. If `prisma generate` fails with EPERM:
- Stop the dev server first
- Run `npx prisma generate`
- Restart the dev server

---

## 13. Key Config Files

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | DB schema — source of truth |
| `src/lib/auth.ts` | NextAuth config, JWT shape |
| `src/proxy.ts` | RBAC middleware |
| `src/app/globals.css` | Tailwind v4 theme + animations |
| `next.config.js` / `next.config.ts` | Next.js config |

---

## 14. Planned Features (Not Yet Built)

- **SMS notifications** on serial booking and queue advancement (Twilio / BD SMS gateway)
- **Test result upload** — diagnostic center uploads PDF result; patient downloads
- **Doctor availability toggle** — quick on/off from dashboard
- **Appointment ratings** — patient rates doctor after consultation
- **Patient health summary** — BMI tracker, past diagnoses aggregated
- **OTP login** — phone-based auth for patients without email
- **WhatsApp notifications** — via Twilio or 360dialog
- **Multi-language UI** — English toggle

---

## 15. Common Pitfalls

| Issue | Fix |
|---|---|
| `prisma generate` EPERM | Stop dev server, then generate |
| Walk-in notification crash | Guard `if (!appt.patient) return` — already done in queue-engine.ts |
| Bengali fonts not loading | Check globals.css `@import url(...)` for Hind Siliguri & Noto Sans Bengali |
| HMR WebSocket errors in preview | Harmless in sandboxed browser; check real browser if concerned |
| SSE not firing | SSE is in-process; won't work across multiple Node processes (use Redis pub/sub for prod) |
| Daily limit exceeded | `generateSerial` throws `DAILY_LIMIT_REACHED` — catch in booking API |

---

## 16. Deployment Checklist

- [ ] Switch `DATABASE_URL` from SQLite to PostgreSQL
- [ ] Run `npx prisma migrate deploy`
- [ ] Set `NEXTAUTH_SECRET` env var (32+ random chars)
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Run medicine seed: `node prisma/seed-medicines.mjs`
- [ ] For multi-instance: replace in-process SSE store with Redis pub/sub
- [ ] Configure CDN for images (doctor/center avatars)
- [ ] Set up SMS provider credentials

---

*Last updated: 2026-08-16*
