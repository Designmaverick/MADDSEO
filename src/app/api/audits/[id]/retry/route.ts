import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(_req: Request, context: { params: { id: string } }) {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Build phase.' }, { status: 503 });
  }
  const session = await getServerSession(await getAuthOptions(prisma));
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const audit = await prisma.audit.findFirst({
    where: { id: context.params.id, runnerId: session.user.id }
  });
  if (!audit) {
    return NextResponse.json({ error: 'Audit not found.' }, { status: 404 });
  }
  if (audit.status !== 'FAILED') {
    return NextResponse.json({ error: 'Only failed audits can be retried.' }, { status: 400 });
  }

  await prisma.audit.update({
    where: { id: audit.id },
    data: {
      status: 'PENDING',
      progressCrawl: 0,
      progressPerformance: 0,
      progressAnalysis: 0,
      progressReport: 0,
      lastError: null,
      startedAt: null,
      completedAt: null
    }
  });

  return NextResponse.json({ ok: true });
}
