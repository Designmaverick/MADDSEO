import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  domain: z.string().min(3).max(190).optional(),
  action: z.enum(['verify']).optional()
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

async function verifyDomain(domain: string) {
  const urls = [`https://${domain}`, `http://${domain}`];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    for (const url of urls) {
      try {
        const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
        if (res.ok || (res.status >= 300 && res.status < 400)) {
          return { ok: true, status: res.status };
        }
      } catch {
        // try GET fallback
        try {
          const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
          if (res.ok || (res.status >= 300 && res.status < 400)) {
            return { ok: true, status: res.status };
          }
        } catch {
          continue;
        }
      }
    }
    return { ok: false, status: null as number | null };
  } finally {
    clearTimeout(timeout);
  }
}

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Build phase.' }, { status: 503 });
  }
  const session = await getServerSession(await getAuthOptions(prisma));
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: context.params.id, ownerId: session.user.id }
  });
  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (parsed.data.name) {
    updates.name = parsed.data.name;
  }

  if (parsed.data.domain) {
    let normalized;
    try {
      normalized = normalizeDomain(parsed.data.domain);
    } catch {
      return NextResponse.json({ error: 'Invalid domain.' }, { status: 400 });
    }
    const existing = await prisma.project.findFirst({
      where: { ownerId: session.user.id, domain: normalized.domain, id: { not: project.id } }
    });
    if (existing) {
      return NextResponse.json({ error: 'Domain already exists in your projects.' }, { status: 409 });
    }
    updates.domain = normalized.domain;
    updates.verificationStatus = 'PENDING';
    updates.verifiedAt = null;
    updates.verificationError = null;
  }

  if (parsed.data.action === 'verify') {
    const result = await verifyDomain(project.domain);
    if (result.ok) {
      updates.verificationStatus = 'VERIFIED';
      updates.verifiedAt = new Date();
      updates.verificationError = null;
    } else {
      updates.verificationStatus = 'FAILED';
      updates.verifiedAt = null;
      updates.verificationError = 'Unable to reach the domain over HTTPS or HTTP.';
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No changes provided.' }, { status: 400 });
  }

  await prisma.project.update({
    where: { id: project.id },
    data: updates
  });

  return NextResponse.json({ ok: true, message: 'Project updated.' });
}

export async function DELETE(_req: Request, context: { params: { id: string } }) {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Build phase.' }, { status: 503 });
  }
  const session = await getServerSession(await getAuthOptions(prisma));
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const project = await prisma.project.findFirst({
    where: { id: context.params.id, ownerId: session.user.id }
  });
  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    const audits = await tx.audit.findMany({
      where: { projectId: project.id },
      select: { id: true }
    });
    const auditIds = audits.map((audit) => audit.id);
    if (auditIds.length > 0) {
      await tx.issue.deleteMany({ where: { auditId: { in: auditIds } } });
      await tx.page.deleteMany({ where: { auditId: { in: auditIds } } });
      await tx.report.deleteMany({ where: { auditId: { in: auditIds } } });
      await tx.audit.deleteMany({ where: { id: { in: auditIds } } });
    }
    await tx.project.delete({ where: { id: project.id } });
  });

  return NextResponse.json({ ok: true });
}
