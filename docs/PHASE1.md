# Phase 1: Schema + Auth

This phase delivers the database schema, Prisma setup, and authentication flows (Google OAuth + credentials) with invite tokens.

## Delivered
- Prisma models for User, Project, Audit, Page, Issue, Report, Settings, SystemSettings, InviteToken, and NextAuth tables.
- NextAuth (credentials + Google) wired to Prisma adapter.
- Invite token API for Super Admins.
- Registration endpoint honoring invite tokens and system-level signup control.
- Minimal app layout with sidebar and authenticated routes.
- Basic audit creation respecting Free plan limits.

## Plan Rules Enforced
- Free plan: 1 domain, 1 audit per week, 10 pages per crawl.
- Pro plan: unlimited domains, unlimited audits, 100 pages per crawl (default cap in Phase 1).

## Next Steps (Phase 2)
- Build Super Admin UI to manage users, reset passwords, and toggle Pro.
- Implement user creation + invite link management UI.
