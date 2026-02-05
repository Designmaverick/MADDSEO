# MADDSEO
SEO audit platform for agencies and freelancers.

Phase 1 focuses on schema and auth with a minimal app shell.

## Getting Started
1. Copy `.env.example` to `.env` and fill values.
2. Install deps: `npm install`
3. Run migrations: `npm run prisma:migrate`
4. Seed Super Admin: `npm run db:seed`
5. Start dev server: `npm run dev`

## Phase 1 Scope
- Prisma schema for core entities.
- NextAuth with Google + credentials.
- Invite token system.
- Base layout and navigation.
- Basic audit creation (no crawler yet).

## Docs
- `docs/PHASE1.md`
- `docs/DEPLOYMENT.md`
