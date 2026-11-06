# Helens Haven

Website, booking system and admin panel for **Helens Haven**, an event centre, garden and flower nursery in Lusaka West, Zambia.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS 3, Framer Motion, Lucide, React Hook Form + Zod, and Supabase (Postgres, Auth, Storage). Deploys to Vercel.

The site ships in two complete versions that share the same pages, booking system, database and admin panel:

| | Original Garden (default) | Space Garden |
|---|---|---|
| Look | Forest green, champagne gold, warm white; serif display type; leaf-shaped cards; sunlit illustrated garden | Midnight purple, neon green, electric blue, gold; wide display type; glass panels; floating garden islands among stars |
| Switch | Navigation bar (desktop and mobile), mobile menu, footer | same |

---

## ⚠️ Read this first: what has and has not been verified

This project was written in a sandbox **with no network access**. Dependencies could not be installed, so:

| Verified here | **Not** verified here |
|---|---|
| All source files type-check (`tsc`) against stand-ins for Next, React, Supabase, Zod, etc. This catches broken imports, undefined names and logic typos in our own code. | **`npm run build` has not been run.** Library-specific typings (React 19, Next 15, Supabase, Zod) were not checked. |
| The date, time-zone and availability logic passes unit checks (overnight bookings, venue-wide blocks, pending vs confirmed). | **The app has not been opened in a browser**, so layout, animation and responsiveness are unseen. |
| `scripts/create-admin.mjs` passes a syntax check. | **The SQL migrations have not been executed** against Postgres. They were written and re-read carefully, but treat the first run as the real test. |
| | No Supabase project was connected, so booking, lookup, admin and uploads are untested end to end. |

**Your first run should be:** `npm install` → `npm run typecheck` → `npm run build` → work through the [testing checklist](#testing-checklist). If anything fails, the error message is usually enough to fix it quickly. As a temporary escape hatch, setting `SKIP_TYPECHECK=1` lets a deployment succeed despite TypeScript errors.

---

## Quick start (local)

Requires Node 20.6 or newer.

```bash
npm install
cp .env.example .env.local     # fill in the values (see below)
npm run dev                    # http://localhost:3000
```

**Without Supabase** the public pages still run on built-in default content, and the booking page, contact form, lookup page and admin panel show a clear "not connected" message. Nothing pretends to work.

---

## Supabase setup

1. **Create a project** at supabase.com (the free plan is enough). Pick the region closest to Zambia that is offered.
2. **Run the migrations in order** in the SQL Editor (or `supabase db push` if you use the CLI):
   1. `supabase/migrations/20260101000001_core_schema.sql`
   2. `supabase/migrations/20260101000002_booking_rules.sql`
   3. `supabase/migrations/20260101000003_rls_policies.sql`
   4. `supabase/migrations/20260101000004_storage_and_seed.sql`  (creates the public `gallery` bucket, the five facilities and sample testimonials)
3. **Copy your keys** from *Project Settings → API* into `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the anon or "publishable" key) and `SUPABASE_SERVICE_ROLE_KEY` (the service-role or "secret" key, **server only**).
4. **Turn off public sign-ups:** *Authentication → Sign In / Providers → "Allow new users to sign up" → off.* Only people you create can sign in.
5. **Create the first administrator** (never hard-coded, never in the repo):
   ```bash
   npm run create-admin
   ```
   It asks for an email and a password (min. 12 characters, hidden as you type), creates the Auth user and grants the admin role. It refuses to run if an admin already exists unless you pass `-- --allow-additional`.

   *Alternative without Node:* create the user in *Authentication → Users → Add user* (tick auto-confirm), then run
   `update public.profiles set role = 'admin' where email = 'you@example.com';`
6. **(Optional) test data:** run `supabase/seed/test_bookings.sql` once. See [Test data](#test-data).

Sign in at **`/admin/login`**.

---

## Deploy to Vercel

1. Push the project to GitHub/GitLab/Bitbucket.
2. In Vercel: **Add New → Project**, import the repo (framework preset: Next.js, detected automatically).
3. Add the environment variables below (Production and Preview).
4. Deploy. Then set `NEXT_PUBLIC_SITE_URL` to the final URL and redeploy.

`NEXT_PUBLIC_*` variables are baked in at build time, so redeploy after changing them. Fonts are fetched from Google Fonts at build time, which Vercel allows.

### Environment variables

| Variable | Required | Where used | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | for database features | browser + server | Safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | for database features | browser + server | Safe to expose; Row Level Security protects the data |
| `SUPABASE_SERVICE_ROLE_KEY` | for bookings, availability, lookup, contact form, uploads | **server only** | Bypasses RLS. Never prefix with `NEXT_PUBLIC_`, never commit |
| `NEXT_PUBLIC_SITE_URL` | recommended | metadata, email links | e.g. `https://your-project.vercel.app` |
| `EMAIL_PROVIDER` | optional | server | `resend`, or empty to disable email |
| `RESEND_API_KEY`, `EMAIL_FROM` | if email enabled | server | `EMAIL_FROM` must be on a domain verified with Resend |
| `ADMIN_NOTIFY_EMAIL` | optional | server | Gets a copy of each new booking request / contact message |
| `SKIP_TYPECHECK` | optional | build | `1` = ignore TypeScript errors during build (temporary escape hatch) |

---

## How it works

### Two versions, one site
The version lives in `ThemeProvider`. Colours, type, radii and shadows are CSS variables (`globals.css`), so every component re-skins when `data-theme` changes; the hero, navigation, artwork and atmosphere also have genuinely different compositions per version.

* **Switching is client-side only**: no reload, same URL, same scroll position. A circular reveal plays (skipped for visitors who prefer reduced motion).
* **Remembered locally** in `localStorage` and a cookie. The cookie lets the server render the right version on first paint, so there is no flash. First-time visitors always get the Original Garden.
* **Booking progress survives**: the form's state is mirrored into `sessionStorage` by `BookingDraftProvider`, which sits above the themed UI. Switching version, navigating away or reloading keeps dates, times and details (this tab only; it is cleared on submit).

### Booking flow
1. Wizard: event and spaces → date and time (live calendar) → details → review.
2. `POST /api/bookings` re-validates everything on the server (Zod), checks settings (pause, notice, hours), then calls the `create_booking_request` database function with the service role.
3. The visitor gets a **reference** such as `HH-7K3PQ9`, a confirmation page that says the request is **pending until approved**, a WhatsApp button, and a link home.
4. **Status lookup** (`/bookings/manage`) needs the reference **and** the booking's email or phone. Wrong combinations return the same generic message, and only non-sensitive fields come back.

Statuses: `pending`, `confirmed`, `rejected`, `cancelled`, `completed`.

### Conflict protection (enforced by the database)
* Only **confirmed** bookings hold a slot. Pending requests never block anyone and never count as reserved.
* A PostgreSQL **exclusion constraint** (`booking_facilities_no_overlap`) makes it impossible for two confirmed bookings to overlap on the same facility, whichever code path writes the data.
* Triggers also refuse to confirm into a blocked or maintenance period, and refuse to create a block over a confirmed booking. Approving or rescheduling a confirmed booking is re-checked, and a clash returns a clear message and changes nothing.
* Times are stored with the Africa/Lusaka zone (UTC+2). If the end time is earlier than the start, the event ends the next day.
* The public calendar is a coarse guide: a day shows *unavailable* when every selected space already has a confirmed booking or block that day, and *partly booked* when some do. Exact overlap is decided by the database, to the minute.

### Admin panel (`/admin`)
Protected twice: middleware redirects signed-out visitors, and every page and every server action re-checks the administrator role on the server. Admin actions run as the signed-in user, so Row Level Security applies on top.

| Area | What you can do |
|---|---|
| Dashboard | Totals, pending, confirmed, upcoming events, recent bookings and recent admin actions |
| Bookings | Search; filter by status and event date; view details; approve, reject, cancel, complete, reopen; set status manually; reschedule; add internal notes; WhatsApp the customer with a status-matched message |
| Calendar | Month view of confirmed, pending and blocked time; block dates or time ranges (whole venue or one facility); record maintenance; remove blocks |
| Website content | Upload/edit/delete gallery photos (direct-to-Storage), edit homepage, About, event and amenity text, manage testimonials, edit contact details |
| Messages | Contact-form messages: mark handled, delete |
| Settings | Contact details, accept/pause bookings, require approval or auto-confirm, minimum notice, how far ahead, operating hours (optional enforcement), per-facility availability |

Every important action is written to the append-only `activity_logs` table (who, what, when).

### Email
Nothing is sent unless `EMAIL_PROVIDER=resend` is configured. Each send returns `sent`, `failed` or `not_configured`, and the confirmation page says exactly which. With no provider the page states plainly that no email was sent and asks the visitor to keep their reference. Status emails to customers (confirmed/rejected/cancelled) follow the same rule, and the admin screen tells you when you need to notify the customer yourself.

---

## Test data

`supabase/seed/test_bookings.sql` creates clearly labelled rows (all `@example.test`):

| Row | Purpose |
|---|---|
| Confirmed wedding (arena + pub), +21 days | A confirmed reservation |
| Pending birthday (pool + fire pit), +10 days | Approve it from the admin panel |
| **Pending request overlapping the wedding** | Approving it **must fail** (conflict protection) |
| Confirmed overnight concert, +35 days | Ends after midnight |
| Rejected, cancelled, completed | Status variety |
| Pool maintenance block, +14 to +16 days | Block behaviour |

Find references for lookup tests with
`select reference, email, status from public.bookings where email like '%@example.test';`
Remove everything with the two `delete` statements in the file header.

---

## Testing checklist

**Setup**
- [ ] `npm install`, `npm run typecheck` and `npm run build` all succeed.
- [ ] With no `.env.local`: public pages load; the booking page shows the "Development mode" notice and cannot submit.

**Both versions**
- [ ] First visit (clear cookies and storage) shows the Original Garden.
- [ ] Switch with the nav selector (desktop), the header icons and menu (mobile), and the footer: theme changes with no reload, URL and scroll position stay.
- [ ] Reload: your choice is remembered, with no flash of the other version.
- [ ] Home, About, Venue & Events, Amenities, Gallery, Bookings, Contact look right in both.

**Booking**
- [ ] Start a booking, pick a date and times, switch version, then go to another page and back: your choices are still there.
- [ ] A date with a confirmed booking on the chosen space is unselectable; pending-only dates are selectable and marked.
- [ ] Choosing a time that overlaps a reserved window shows a warning and blocks "Continue".
- [ ] Submitting shows a reference and the "pending until approved" message. With no email provider it says no email was sent.
- [ ] `/bookings/manage`: the reference with the correct email works; the reference with a wrong email or phone shows the generic "couldn't find" message.
- [ ] The honeypot, validation messages and keyboard-only completion all work.

**Admin**
- [ ] `/admin` redirects to `/admin/login` when signed out; a non-admin account is refused.
- [ ] Approve the seeded pending birthday: status becomes confirmed and the dashboard counts update.
- [ ] Approve the seeded **conflicting** request: it fails with a conflict message and stays pending.
- [ ] Block a date range that includes a confirmed booking: refused. Block a free range: succeeds and the public calendar marks it.
- [ ] Reschedule a confirmed booking onto another confirmed booking's time: refused.
- [ ] Add an internal note; it appears in the booking history and never on the public lookup.
- [ ] Upload a photo, edit its title, publish it: it appears in the gallery and the lightbox (arrow keys, Esc, full screen).
- [ ] Edit homepage text and a testimonial: the public site updates within about a minute.
- [ ] Settings: pause bookings (the form shows a notice), turn on hours enforcement, close a facility.

**Quality**
- [ ] Phone-width layouts (about 375px) for every page, the mobile menu and the booking wizard.
- [ ] Tab through the site: focus is always visible; the skip link works.
- [ ] Enable "reduce motion" in your OS: animations calm down and the version switch is instant.
- [ ] Lighthouse accessibility pass on Home and Bookings in both versions.

---

## What is placeholder, sample or mock

* **Artwork:** there are no photographs of the venue in this project. Every image is an illustrated SVG scene, always labelled "Placeholder artwork, not a real photo". Once you upload real photos in **Admin → Website content → Gallery**, the public gallery switches to them automatically.
* **Testimonials:** three sample testimonials, each shown with a visible "Sample" badge. Delete or replace them with real feedback.
* **About / venue copy:** draft text that uses only facts you supplied (facilities, sizes, location). It invents no history, prices, capacity limits or policies. Replace it in the admin panel.
* **Opening hours:** none are published until you set them. **Prices and capacities:** none are shown.
* **Not mock:** booking, availability, lookup, contact form, admin, uploads and activity logging are all real and database-backed.
* **Directions:** the button uses the coordinates from the `sll` parameter of the Google Maps link you supplied; the map embed uses that same link.

## Known limitations and sensible next steps

* **Rate limiting is best-effort** (in-memory, per serverless instance) plus a honeypot field. For stronger protection add Vercel Firewall rules or a shared store such as Upstash.
* **Email** needs a provider and a verified sending domain before it can go out. Resend is wired in; other providers need a small change in `src/lib/email.ts`.
* **Next.js 15 and Tailwind 3** are used deliberately because their APIs are stable and widely documented. Upgrading to Next 16 / Tailwind 4 is a separate task.
* **Photos** are served through Next image optimisation; on Vercel Hobby there is a monthly cap on optimised images.
* There are no automated end-to-end tests yet. Playwright would be the natural next addition, starting with the booking and approval flows.
* The admin dialogs use the browser's `confirm()` for destructive actions, which is functional but plain.

---

## Project structure

```
supabase/
  migrations/            4 SQL files: schema, booking rules, RLS, storage + seed
  seed/test_bookings.sql labelled test data
scripts/create-admin.mjs secure first-admin setup
src/
  middleware.ts          /admin session refresh + redirect
  app/
    layout.tsx           fonts, metadata
    (site)/              public pages (home, about, venue, amenities, gallery, bookings, contact)
    admin/               login + protected (panel) pages
    api/                 availability, bookings, bookings/lookup, contact
  components/
    theme/               ThemeProvider, VersionSelector, Atmosphere, Scene (placeholder art)
    layout/ home/ gallery/ booking/ contact/ admin/ ui/
  lib/
    supabase/            browser, server (cookie), public (cacheable), admin (service role)
    actions/             server actions for admin (guard, auth, bookings, content)
    validation.ts        Zod schemas shared by forms and API
    availability.ts      calendar and busy-window logic
    content*.ts          editable content: defaults + cached fetchers
    email.ts             email workflow (provider-agnostic result)
```

## Security notes
* The service-role key lives only in server code and environment variables. No credentials are in the repository.
* Row Level Security is on for every table. The public (anon) role can read only published content and can never read bookings, blocks, messages or logs, nor write anything.
* Admin access requires a profile with `role = 'admin'`, checked in middleware, in the admin layout and in every server action. Users cannot promote themselves.
* Gallery uploads go straight to Storage with a one-time signed token issued only to administrators; the bucket accepts images up to 10 MB.
* Security headers are set in `next.config.mjs`. A strict Content-Security-Policy is not included and would need tuning for Next's inline scripts and the Google Maps embed.
