import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSchema = z
  .object({
    projectId: z.string().cuid().optional(),
    projectName: z.string().min(2).max(120).optional(),
    domain: z.string().min(3).max(190).optional(),
    depth: z.number().int().min(1).max(3).optional()
  })
  .refine((data) => data.projectId || (data.projectName && data.domain), {
    message: 'Project or domain required.'
  });

const freeLimits = { maxProjects: 1, maxAuditsPerWeek: 1, maxPages: 10, maxConcurrent: 1, maxDepth: 2 };
const proLimits = { maxProjects: Infinity, maxAuditsPerWeek: Infinity, maxPages: 100, maxConcurrent: 3, maxDepth: 3 };

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

export async function GET() {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Build phase.' }, { status: 503 });
  }
  const session = await getServerSession(await getAuthOptions(prisma));
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const audits = await prisma.audit.findMany({
    where: { runnerId: session.user.id },
    include: { project: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return NextResponse.json(audits);
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

  const limits = session.user.isPro ? proLimits : freeLimits;
  const depth = Math.min(parsed.data.depth ?? limits.maxDepth, limits.maxDepth);

  if (!session.user.isPro) {
    const projectCount = await prisma.project.count({ where: { ownerId: session.user.id } });
    if (!parsed.data.projectId && projectCount >= limits.maxProjects) {
      return NextResponse.json({ error: 'Free plan allows only 1 domain.' }, { status: 403 });
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyAudits = await prisma.audit.count({
      where: { runnerId: session.user.id, createdAt: { gte: weekAgo } }
    });
    if (weeklyAudits >= limits.maxAuditsPerWeek) {
      return NextResponse.json({ error: 'Free plan allows 1 audit per week.' }, { status: 403 });
    }
  }

  const concurrentAudits = await prisma.audit.count({
    where: { runnerId: session.user.id, status: { in: ['PENDING', 'RUNNING'] } }
  });
  if (concurrentAudits >= limits.maxConcurrent) {
    return NextResponse.json({ error: 'Too many audits running. Please wait.' }, { status: 429 });
  }

  const lastAudit = await prisma.audit.findFirst({
    where: { runnerId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true }
  });
  if (lastAudit && Date.now() - lastAudit.createdAt.getTime() < 60_000) {
    return NextResponse.json({ error: 'Please wait a minute before starting another audit.' }, { status: 429 });
  }

  let projectId = parsed.data.projectId;
  if (!projectId) {
    let normalized;
    try {
      normalized = normalizeDomain(parsed.data.domain ?? '');
    } catch {
      return NextResponse.json({ error: 'Invalid domain.' }, { status: 400 });
    }

    const existingProject = await prisma.project.findFirst({
      where: { ownerId: session.user.id, domain: normalized.domain }
    });
    if (existingProject) {
      projectId = existingProject.id;
    } else {
      const project = await prisma.project.create({
        data: {
          ownerId: session.user.id,
          name: parsed.data.projectName ?? normalized.domain,
          domain: normalized.domain
        }
      });
      projectId = project.id;
    }
  } else {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: session.user.id }
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
  }

  const audit = await prisma.audit.create({
    data: {
      projectId,
      runnerId: session.user.id,
      status: 'PENDING',
      planAtRun: session.user.isPro ? 'PRO' : 'FREE',
      planLimitPages: limits.maxPages,
      crawlDepth: depth
    }
  });

  return NextResponse.json({
    id: audit.id,
    projectId
  });
}
