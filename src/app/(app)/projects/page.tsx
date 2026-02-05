import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';
import ProjectsClient from './ProjectsClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function ProjectsPage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const prisma = await getPrisma();
  const session = isBuild ? null : await getServerSession(await getAuthOptions(prisma ?? undefined));

  if (!session?.user && !isBuild) {
    redirect('/sign-in');
  }
  const userId = session?.user.id ?? '';

  const projects =
    isBuild || !prisma
      ? []
      : await prisma.project.findMany({
          where: { ownerId: userId },
          orderBy: { createdAt: 'desc' }
        });

  const audits =
    isBuild || !prisma || projects.length === 0
      ? []
      : await prisma.audit.findMany({
          where: { projectId: { in: projects.map((project) => project.id) } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            projectId: true,
            status: true,
            scoreOverall: true,
            issuesFound: true,
            createdAt: true,
            completedAt: true
          }
        });

  const lastAuditByProject = new Map<string, typeof audits[number]>();
  audits.forEach((audit) => {
    if (!lastAuditByProject.has(audit.projectId)) {
      lastAuditByProject.set(audit.projectId, audit);
    }
  });

  const mapped = projects.map((project) => {
    const lastAudit = lastAuditByProject.get(project.id);
    return {
      id: project.id,
      name: project.name,
      domain: project.domain,
      isActive: project.isActive,
      verificationStatus: project.verificationStatus,
      verifiedAt: project.verifiedAt ? project.verifiedAt.toISOString() : null,
      verificationError: project.verificationError,
      lastAudit: lastAudit
        ? {
            ...lastAudit,
            createdAt: lastAudit.createdAt.toISOString(),
            completedAt: lastAudit.completedAt ? lastAudit.completedAt.toISOString() : null
          }
        : null
    };
  });

  return <ProjectsClient initialProjects={mapped} isPro={Boolean(session?.user.isPro)} />;
}
