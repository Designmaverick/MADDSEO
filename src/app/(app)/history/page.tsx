import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';
import HistoryClient from './HistoryClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function HistoryPage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const prisma = await getPrisma();
  const session = isBuild ? null : await getServerSession(await getAuthOptions(prisma ?? undefined));
  if (!session?.user && !isBuild) {
    redirect('/sign-in');
  }
  if (isBuild || !prisma) {
    return (
      <div className="card p-6 text-sm text-slate-500">
        History will be available after deployment finishes.
      </div>
    );
  }

  const userId = session?.user?.id;
  if (!userId) {
    return (
      <div className="card p-6 text-sm text-slate-500">
        History will be available after deployment finishes.
      </div>
    );
  }

  const audits = await prisma.audit.findMany({
    where: { runnerId: userId },
    include: { project: true },
    orderBy: { createdAt: 'desc' },
    take: 200
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">History</h1>
        <p className="text-slate-500">Audit timeline with quick comparisons.</p>
      </div>
      <HistoryClient
        audits={audits.map((audit) => ({
          id: audit.id,
          domain: audit.project.domain,
          status: audit.status,
          scoreOverall: audit.scoreOverall,
          createdAt: audit.createdAt.toISOString()
        }))}
      />
    </div>
  );
}
