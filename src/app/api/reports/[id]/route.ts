import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(_req: Request, context: { params: { id: string } }) {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Build phase.' }, { status: 503 });
  }
  const session = await getServerSession(await getAuthOptions(prisma));
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const report = await prisma.report.findFirst({
    where: { id: context.params.id, userId: session.user.id }
  });
  if (!report) {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  }

  await prisma.report.delete({ where: { id: report.id } });
  return NextResponse.json({ ok: true });
}
