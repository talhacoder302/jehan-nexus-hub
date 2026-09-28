# Jehan Nexus Hub

Jehan Nexus agency website and client portal: content calendar, post approvals, Meta Ads insights and automated monthly reports. Built with Next.js, TypeScript, MongoDB and Tailwind.

> Work in progress. The full feature list, env var table and deployment guide land in the Quality phase.

## Stack

Next.js 16 (App Router, `src/`), TypeScript (strict), Tailwind CSS v4, shadcn/ui, MongoDB + Mongoose, Auth.js v5, Zod, React Hook Form, Recharts, FullCalendar, AWS S3, Pusher, Resend, @react-pdf/renderer, Vercel Cron. Package manager: pnpm.

## Local setup

Requirements: Node.js 20.9+ (24 recommended), pnpm 10+, and MongoDB (local `mongod` or an Atlas cluster).

```bash
pnpm install
cp .env.example .env.local   # then fill in values (see below)
pnpm dev                     # http://localhost:3000
```

Minimum `.env.local` for local development:

| Variable               | Example                                     |
| ---------------------- | ------------------------------------------- |
| `MONGODB_URI`          | `mongodb://127.0.0.1:27017/jehan_nexus_hub` |
| `AUTH_SECRET`          | output of `openssl rand -base64 48`         |
| `AUTH_URL`             | `http://localhost:3000`                     |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000`                     |
| `CRON_SECRET`          | any random 32+ byte string                  |

All third-party integrations (Google sign-in, S3, Resend, Pusher, Meta) are optional and degrade gracefully when their keys are missing.

## Scripts

| Command          | What it does                                |
| ---------------- | ------------------------------------------- |
| `pnpm dev`       | Start the dev server                        |
| `pnpm build`     | Production build                            |
| `pnpm lint`      | ESLint                                      |
| `pnpm typecheck` | Generate route types and run `tsc --noEmit` |
| `pnpm format`    | Prettier                                    |
| `pnpm test`      | Vitest                                      |
| `pnpm seed`      | Seed demo data                              |
