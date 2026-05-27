# Form Builder SaaS ZenForm (Hackathon Submission)

Production-style Typeform-like SaaS built on a Turborepo monorepo with type-safe APIs, dynamic form schemas, public submissions, analytics, creator email notifications, and Scalar API docs.

## Elevator Pitch

Creators can build dynamic forms, configure fields/validation, publish shareable links, collect responses from anyone (no login), and review analytics/responses from a protected dashboard.

## Stack (Required Technologies)

- Monorepo: Turborepo
- Frontend: Next.js (`apps/web`)
- Backend: Express + tRPC (`apps/api`)
- Validation: Zod
- ORM/DB: Drizzle ORM + PostgreSQL (Neon-compatible)
- API Documentation: Scalar + OpenAPI (generated from tRPC metadata)
- Auth: JWT session flow with protected creator routes
- Email: Resend (creator notifications)

## Monorepo Layout

- `apps/web`: landing, pricing, dashboard, builder, explore, public form pages
- `apps/api`: tRPC server, OpenAPI JSON, Scalar docs, auth callbacks
- `packages/database`: Drizzle schema + migrations
- `packages/services`: auth/services/env/resend client
- `packages/trpc`: routers, procedures, OpenAPI metadata

## Core Product Features

- Protected creator dashboard
- Create/edit/publish/unpublish/archive forms
- Dynamic fields with validation + required/optional controls
- Field types: short text, long text, email, number, single select, multi select, checkbox, rating, date
- Public submission without login
- Visibility model:
  - `PUBLIC`: listed on Explore
  - `UNLISTED`: hidden from listings, direct-link access only
- Response management:
  - response list
  - response detail with captured answers
- Analytics:
  - views, starts, submits
  - conversion metrics
  - activity time series
  - field completion metrics
- Explore page for public forms
- Landing + pricing pages
- Email notifications for creators:
  - immediate per-response mode
  - digest mode (`1h`, `5h`, `24h`)

## Visibility Rules (Enforced)

- Only `PUBLISHED + PUBLIC` forms appear in Explore/listings.
- `UNLISTED` forms are never shown in public listings.
- Both `PUBLIC` and `UNLISTED` published forms are accessible by direct URL.
- Unpublished/archived forms reject public submissions.

## API Documentation

Scalar docs and OpenAPI spec are exposed by backend:

- Scalar UI: `https://repoapi-production-b2c5.up.railway.app/docs`
- OpenAPI JSON: `https://repoapi-production-b2c5.up.railway.app/openapi.json`

All auth/health/form endpoints are documented with OpenAPI metadata in tRPC routers.

## API Surface Summary

### Health

- `GET /api/health`

### Auth

- provider list
- email verification send/verify
- sign up/sign in (email)
- sign in (Google)
- refresh session
- sign out
- current user (`me`)

### Forms

- public listing and theme catalog
- creator form CRUD + publish/unpublish/archive/delete
- field add/update/reorder/remove
- get by slug (public)
- submit response (public)
- analytics event capture (public)
- analytics overview (creator)
- responses list + detail (creator)

## Email Notification Behavior

Configured per form in builder settings:

- notifications `enabled/disabled`
- mode:
  - `IMMEDIATE`: email on each new submission
  - `DIGEST`: grouped summary email every `1h`, `5h`, or `24h`

Emails are logged in `email_logs` with sent/failed status and metadata.

## Local Setup

## 1) Prerequisites

- Node.js `>=18`
- pnpm `9.x`
- PostgreSQL/Neon database

## 2) Install

```bash
pnpm install
```

## 3) Environment

Create root `.env` with required values:

```env
# database
DATABASE_URL=postgresql://...

# web/api URLs
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/trpc

# auth
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# resend
RESEND_API_KEY=...
RESEND_FROM_EMAIL=verified-sender@yourdomain.com

# optional google oauth
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=
```

## 4) Database Migration

```bash
pnpm db:migrate
```

(Equivalent direct command)

```bash
cmd /c pnpm --dir packages/database exec drizzle-kit migrate
```

## 5) Run Apps

```bash
pnpm dev
```

Default ports:

- Web: `http://localhost:3000`
- API: `http://localhost:8000`

## Quality/Architecture Notes

- Type-safe contracts shared across client/server with tRPC + Zod
- Drizzle schema-first database modeling and SQL migrations
- Clear separation of apps and shared packages inside monorepo
- Public endpoints are anonymous-safe; creator operations are protected
- Structured error handling and loading states across core flows

## Requirement Coverage (Evaluator-Friendly)

- Turborepo monorepo: complete
- Separate frontend/backend apps: complete
- tRPC + Zod + Drizzle + Scalar: complete
- Authenticated creator dashboard: complete
- Dynamic form builder with required field types: complete
- Public + unlisted visibility rules: complete
- Public submission without login: complete
- Response management + analytics: complete
- Landing + pricing pages: complete
- Creator email notifications/digests: complete
- API docs route: complete

## Current Gaps / Next Work

- Deployment URL + production credentials section
- Optional hardening: stronger rate limits/spam defenses, E2E tests

## Demo Credentials

Run `pnpm db:seed` after migrations to load demo users, forms, responses, and analytics.

Shared password for all seed users: `Demo123!`

| Role | Email | Notes |
| --- | --- | --- |
| Admin | `admin@zenform.com` | Full admin panel access |
| Creator | `suprabhat@zenform.com` | 3 forms (2 published, 1 draft) with sample responses |
| Creator | `piyush@zenform.com` | 2 forms (1 published, 1 draft) with sample responses |

- Deployed URL: `TBD`
- Scalar Docs URL (deployed): `TBD`

## Repository Origin

Starter base: `https://github.com/piyushgarg-dev/trpc-monorepo`
