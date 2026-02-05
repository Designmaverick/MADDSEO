# Deployment Notes

## Vercel
1. Set environment variables from `.env.example`.
2. Connect Postgres and set `DATABASE_URL`.
3. Run `prisma migrate deploy` in the build command or via a post-deploy hook.

Recommended Vercel Build Command:
- `npm run prisma:deploy && npm run build`

## Docker
1. Build image: `docker build -t cascade-seo .`
2. Run container: `docker run -p 3000:3000 --env-file .env cascade-seo`

## Migrations
- Local dev: `npm run prisma:migrate`
- Production: `npm run prisma:deploy`

## Seed Super Admin
- `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_PASSWORD` must be set.
- Run `npm run db:seed`
