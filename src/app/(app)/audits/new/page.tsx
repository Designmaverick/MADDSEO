import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';
import NewAuditClient from './NewAuditClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function NewAuditPage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const prisma = await getPrisma();
  const session = isBuild ? null : await getServerSession(await getAuthOptions(prisma ?? undefined));
  if (!session?.user && !isBuild) {
    redirect('/sign-in');
  }

  const projects =
    isBuild || !prisma
      ? []
      : await prisma.project.findMany({
          where: { ownerId: session?.user.id },
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, domain: true }
        });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const auditsThisWeek =
    isBuild || !prisma
      ? 0
      : await prisma.audit.count({
          where: { runnerId: session?.user.id, createdAt: { gte: weekAgo } }
        });

  return (
    <NewAuditClient
      projects={projects}
      isPro={Boolean(session?.user.isPro)}
      auditsThisWeek={auditsThisWeek}
      projectCount={projects.length}
    />
  );
}
