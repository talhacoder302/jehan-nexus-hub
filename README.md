# Jehan Nexus Hub

Jehan Nexus agency website and client portal: content calendar, post approvals, Meta Ads insights and automated monthly reports. Built with Next.js, TypeScript, MongoDB and Tailwind.

One Next.js app, three areas:

| Area           | Path                                                                  | Who                                                      |
| -------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| Marketing site | `/`, `/services`, `/work`, `/about`, `/contact`, `/privacy`, `/terms` | Public                                                   |
| Client portal  | `/portal/*`                                                           | Client users (their own client only), plus staff preview |
| Admin          | `/admin/*`                                                            | Admins (everything) and managers (assigned clients)      |

## Screenshots

> Placeholders. Add real screenshots to `docs/screenshots/` and update these links.

| Marketing home              | Portal dashboard                        | Ads performance                   | Admin overview                        |
| --------------------------- | --------------------------------------- | --------------------------------- | ------------------------------------- |
| `docs/screenshots/home.png` | `docs/screenshots/portal-dashboard.png` | `docs/screenshots/portal-ads.png` | `docs/screenshots/admin-overview.png` |

## Features

**Marketing site**

- Dark-first design with a light mode toggle. The brand gradient is configured in one place (`--brand-from` / `--brand-to` in `src/app/globals.css`).
- Home: hero, trusted-by strip, services, results counters, process, case studies, client portal highlight, testimonials, FAQ and CTA. Service and case study detail pages.
- Contact form: server action, Zod validation, honeypot, per-IP rate limit (3 per 10 min), lead saved to MongoDB and emailed to the agency.
- SEO: per-page metadata, Open Graph image, `sitemap.xml`, `robots.txt`, and Organization / FAQ / Service JSON-LD. Every page is statically generated.
- Testimonials, trusted-by names, stats and case studies are clearly marked **placeholders or samples**. Edit them in `src/content/`.

**Client portal**

- Dashboard: KPI tiles (spend, reach, clicks, CTR, ROAS) vs the previous 30 days, a spend chart, posts awaiting approval, and recent activity.
- Content calendar (FullCalendar month and week views, colored by status) with a post detail dialog.
- Approvals: approve, or request changes with a required comment. Comment thread on every post.
- Ads performance: date range presets or a custom range, spend / clicks / CTR / ROAS charts, and a sortable campaign table.
- Monthly PDF reports, profile and password settings, and a notification bell (Pusher real-time, with 30s polling as fallback).

**Admin**

- Overview across visible clients: 30-day spend, pending approvals, overdue posts, new leads, and an activity feed.
- Clients CRUD: Meta ad account IDs, Facebook Page ID, Instagram account ID, brand colors, plan, status, assigned managers.
- Users: invite by email (7-day single-use link), change role, disable or re-enable.
- Posts: create and edit with S3 pre-signed uploads (or media URLs), schedule, send for approval, mark published. Every step notifies the right people.
- Leads inbox with status tracking, an activity log, and on-demand report generation.

**Automation**

- `GET /api/cron/meta-sync` (daily, 02:00 UTC): campaign-level daily insights from the Meta Marketing API, upserted idempotently.
- `GET /api/cron/monthly-reports` (1st of the month, 03:00 UTC): generates last month's PDF per client and emails client users a download link.

## Stack

Next.js 16 (App Router, `src/`, Turbopack) · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · lucide-react · Framer Motion · MongoDB + Mongoose · Auth.js v5 (Credentials + Google, JWT sessions) · Zod · React Hook Form · Recharts · FullCalendar v7 · AWS S3 · Pusher Channels · Resend · @react-pdf/renderer · Vercel Cron · Vitest · ESLint + Prettier · pnpm.

## Local setup

Requirements: Node.js 20.9+ (24 recommended), pnpm 10+, and MongoDB (a local `mongod` or an Atlas cluster).

```bash
pnpm install
cp .env.example .env.local     # fill in the core variables below
pnpm seed                      # demo admin, manager, 2 clients, posts, 60 days of insights
pnpm dev                       # http://localhost:3000
```

Sign in at `/login`:

| User                         | Email                        | Password              |
| ---------------------------- | ---------------------------- | --------------------- |
| Admin                        | `SEED_ADMIN_EMAIL`           | `SEED_ADMIN_PASSWORD` |
| Manager                      | `manager@example.com`        | `SEED_DEMO_PASSWORD`  |
| Client (Demo Bakery Co.)     | `client.bakery@example.com`  | `SEED_DEMO_PASSWORD`  |
| Client (Demo Fitness Studio) | `client.fitness@example.com` | `SEED_DEMO_PASSWORD`  |

The seed is idempotent: it upserts users and clients and only replaces data belonging to the two demo clients. Seed a different database with `pnpm seed --target=production` (uses `MONGODB_URI_PRODUCTION`).

## Environment variables

Only the core variables are required. Every integration is optional and degrades gracefully when its keys are missing.

| Variable                                                                       | Required | Purpose                                                          | When missing                                                       |
| ------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| `MONGODB_URI`                                                                  | Yes      | MongoDB connection string (database is always `jehan_nexus_hub`) | App can't start dynamic pages                                      |
| `AUTH_SECRET`                                                                  | Yes      | Signs session JWTs; also salts IP hashes. 32+ random bytes       | App can't start                                                    |
| `AUTH_URL`                                                                     | Prod     | Public base URL (used in email links)                            | Falls back to `NEXT_PUBLIC_SITE_URL`                               |
| `NEXT_PUBLIC_SITE_URL`                                                         | Yes      | Canonical URL for metadata, sitemap and JSON-LD                  | `http://localhost:3000`                                            |
| `CRON_SECRET`                                                                  | Yes      | Bearer token Vercel Cron sends to `/api/cron/*`                  | Cron routes return 503                                             |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`                                        | No       | Google sign-in (invited users only)                              | Button hidden                                                      |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`                                     | Seed     | Admin created by `pnpm seed`                                     | Seed fails                                                         |
| `SEED_DEMO_PASSWORD`                                                           | Seed     | Password for the demo manager and client users                   | Seed fails                                                         |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET` | No       | Creative uploads and stored report PDFs                          | Media URLs are pasted instead; PDFs are rendered on demand         |
| `RESEND_API_KEY` / `EMAIL_FROM`                                                | No       | Invites, password resets, approval and report emails             | Emails are written to the server log; invite dialog shows the link |
| `ADMIN_NOTIFY_EMAIL`                                                           | No       | Receives contact form leads                                      | Leads are only saved                                               |
| `PUSHER_APP_ID` / `PUSHER_KEY` / `PUSHER_SECRET` / `PUSHER_CLUSTER`            | No       | Real-time notifications (server)                                 | 30-second polling                                                  |
| `NEXT_PUBLIC_PUSHER_KEY` / `NEXT_PUBLIC_PUSHER_CLUSTER`                        | No       | Real-time notifications (browser)                                | 30-second polling                                                  |
| `META_SYSTEM_USER_TOKEN`                                                       | No       | Meta Marketing API system user token (`ads_read`)                | Sync skipped; "Meta not connected" banner in admin                 |
| `META_API_VERSION`                                                             | No       | Graph API version, e.g. `v24.0`                                  | `v24.0`                                                            |
| `META_APP_ID` / `META_APP_SECRET`                                              | No       | `appsecret_proof` for Graph calls                                | Calls are made without the proof                                   |

Generate secrets with `openssl rand -base64 48` (or `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`).

### S3 bucket setup

1. Create a bucket (e.g. `jehan-nexus-hub-media`) and an IAM user limited to `s3:PutObject` and `s3:GetObject` on it.
2. Allow public reads for post creatives only (reports stay private):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::YOUR_BUCKET/clients/*/posts/*"
       }
     ]
   }
   ```
3. Add CORS so browsers can upload directly:
   ```json
   [
     {
       "AllowedOrigins": [
         "https://jehannexus.com",
         "https://*.vercel.app",
         "http://localhost:3000"
       ],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["Content-Type", "Cache-Control"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

### Meta Marketing API

1. In Meta Business Settings, create a **system user** with access to each client's ad account (partner access).
2. Generate a token with `ads_read` (and `read_insights`) and set `META_SYSTEM_USER_TOKEN`.
3. Add each client's ad account IDs on the client's admin page. The `act_` prefix is optional.
4. Backfill once: `curl -H "Authorization: Bearer $CRON_SECRET" "https://YOUR_DOMAIN/api/cron/meta-sync?days=90"`.

## Scripts

| Command                     | What it does                                                        |
| --------------------------- | ------------------------------------------------------------------- |
| `pnpm dev`                  | Dev server                                                          |
| `pnpm build` / `pnpm start` | Production build / serve                                            |
| `pnpm lint`                 | ESLint                                                              |
| `pnpm typecheck`            | Route type generation + `tsc --noEmit`                              |
| `pnpm test`                 | Vitest (validators, permissions, Meta mapper, metrics)              |
| `pnpm format`               | Prettier                                                            |
| `pnpm seed`                 | Seed demo data (`--target=production` for `MONGODB_URI_PRODUCTION`) |
| `pnpm db:verify`            | List collections, counts and indexes                                |

## Project structure

```
src/
  app/(marketing)/   public site (static)
  app/(auth)/        login, forgot/reset password, invite acceptance
  app/portal/        client portal
  app/admin/         admin area
  app/api/           auth, notifications, calendar feed, uploads, report PDFs, cron
  components/        ui (shadcn), marketing, portal, admin, app-shell, forms
  content/           editable marketing copy (services, case studies, testimonials, FAQ)
  lib/               env, db, validators (Zod), pure helpers (permissions, metrics, Meta mapper)
  models/            Mongoose models
  server/            server-only services (all DB access and authorization lives here)
  proxy.ts           route guard (Next 16's replacement for middleware.ts)
scripts/             seed and verify
tests/               Vitest
```

## Security

- `/portal` requires a session and `/admin` requires admin or manager, enforced in `src/proxy.ts` **and** again in every page, server action and API route (`src/server/permissions.ts`).
- The session user is re-read from MongoDB on each request, so disabling a user takes effect immediately.
- Client users are pinned to their own `clientId`. Managers only see assigned clients. Cross-client requests return 404.
- Every input is validated with Zod. Invite and reset tokens are hashed, single-use and expire. Passwords are bcrypt-hashed (cost 12).
- Security headers (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) are set in `next.config.ts`.
- Secrets are server-only: `src/lib/env.ts` imports `server-only`, and browser code only reads `src/lib/public-env.ts`.

## Deployment (Vercel)

1. Create a MongoDB Atlas cluster, a database user with `readWrite` on `jehan_nexus_hub`, and allow network access from Vercel (`0.0.0.0/0`, or Vercel's static IPs on paid plans).
2. Import the GitHub repo in Vercel (framework: Next.js, install: `pnpm install`).
3. Add the environment variables above for **Production** and **Preview**. Set `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the production URL.
4. Deploy. `vercel.json` registers the two cron jobs automatically. Vercel sends `Authorization: Bearer $CRON_SECRET`.
5. Seed production once from your machine: add `MONGODB_URI_PRODUCTION` to `.env.local` and run `pnpm seed --target=production` (then change the demo passwords, or disable the demo users).
6. Custom domain: Vercel → Project → Settings → Domains → add `jehannexus.com` and `www.jehannexus.com`, create the DNS records Vercel shows at your registrar, then update `AUTH_URL`, `NEXT_PUBLIC_SITE_URL` and the Google OAuth redirect URI (`https://jehannexus.com/api/auth/callback/google`).

See [DECISIONS.md](DECISIONS.md) for the reasoning behind non-obvious choices.
