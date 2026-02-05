import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

export async function GET() {
  const session = await getServerSession(authOptions);
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
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const { name, domain } = parsed.data;
  let normalized;
  try {
    normalized = normalizeDomain(domain);
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

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyAudits = await prisma.audit.count({
      where: { runnerId: session.user.id, createdAt: { gte: weekAgo } }
    });
    if (weeklyAudits >= 1) {
      return NextResponse.json({ error: 'Free plan allows 1 audit per week.' }, { status: 403 });
    }
  }

  const project = await prisma.project.upsert({
    where: {
      ownerId_domain: {
        ownerId: session.user.id,
        domain: normalized.domain
      }
    },
    update: {
      name
    },
    create: {
      ownerId: session.user.id,
      name,
      domain: normalized.domain
    }
  });

  const audit = await prisma.audit.create({
    data: {
      projectId: project.id,
      runnerId: session.user.id,
      status: 'PENDING',
      planAtRun: session.user.isPro ? 'PRO' : 'FREE',
      planLimitPages: session.user.isPro ? 100 : 10
    }
  });

  return NextResponse.json({
    id: audit.id,
    projectId: project.id
  });
}
