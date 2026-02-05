import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSchema = z.object({
  name: z.string().min(2).max(120),
  domain: z.string().min(3).max(190)
});

function normalizeDomain(input: string) {
  const trimmed = input.trim();
  const withScheme = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(withScheme);
  return {
    url: url.origin,
    domain: url.hostname
  };
}

async function loadProjects(prisma: NonNullable<Awaited<ReturnType<typeof getPrisma>>>, userId: string) {
  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' }
  });
  const audits = await prisma.audit.findMany({
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

  return projects.map((project) => {
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
}

export async function GET() {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Build phase.' }, { status: 503 });
  }
  const session = await getServerSession(await getAuthOptions(prisma));
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const projects = await loadProjects(prisma, session.user.id);
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Build phase.' }, { status: 503 });
  }
  const session = await getServerSession(await getAuthOptions(prisma));
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  let normalized;
  try {
    normalized = normalizeDomain(parsed.data.domain);
  } catch {
    return NextResponse.json({ error: 'Invalid domain.' }, { status: 400 });
  }

  if (!session.user.isPro) {
    const projectCount = await prisma.project.count({ where: { ownerId: session.user.id } });
    const existingProject = await prisma.project.findFirst({
      where: { ownerId: session.user.id, domain: normalized.domain }
    });
    if (!existingProject && projectCount >= 1) {
      return NextResponse.json({ error: 'Free plan allows only 1 domain.' }, { status: 403 });
    }
  }

  const project = await prisma.project.create({
    data: {
      ownerId: session.user.id,
      name: parsed.data.name,
      domain: normalized.domain
    }
  });

  const projects = await loadProjects(prisma, session.user.id);
  return NextResponse.json({ projectId: project.id, projects });
}
