import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function AuditsPage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const session = isBuild ? null : await getServerSession(authOptions);
  const prisma = await getPrisma();
  const audits =
    isBuild || !prisma
      ? []
      : await prisma.audit.findMany({
          where: { runnerId: session?.user.id },
          include: { project: true },
          orderBy: { createdAt: 'desc' }
        });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Site Audits</h1>
          <p className="text-slate-500">Track crawl status and issue totals.</p>
        </div>
        <Link href="/audits/new" className="button">New audit</Link>
      </div>

      {audits.length === 0 ? (
        <div className="card p-6 text-sm text-slate-500">
          No audits yet. Start with your first domain.
        </div>
      ) : (
        <div className="grid gap-4">
          {audits.map((audit) => (
            <div key={audit.id} className="card p-5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-slate-500">{audit.project.name}</p>
                <h2 className="text-lg font-semibold">{audit.project.domain}</h2>
                <p className="text-xs text-slate-500">Status: {audit.status}</p>
              </div>
              <div className="text-sm text-slate-500">
                Issues: {audit.issuesFound} | Pages: {audit.pagesCrawled}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
