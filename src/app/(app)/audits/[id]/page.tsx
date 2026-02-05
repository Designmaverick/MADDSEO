import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';
import AuditStatusClient from './AuditStatusClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function AuditStatusPage({ params }: { params: { id: string } }) {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const prisma = await getPrisma();
  const session = isBuild ? null : await getServerSession(await getAuthOptions(prisma ?? undefined));
  if (!session?.user && !isBuild) {
    notFound();
  }
  if (isBuild || !prisma) {
    return (
      <div className="card p-6 text-sm text-slate-500">
        Audit status will be available after deployment finishes.
      </div>
    );
  }

  const userId = session?.user?.id;
  if (!userId) {
    notFound();
  }

  const audit = await prisma.audit.findFirst({
    where: { id: params.id, runnerId: userId },
    include: { project: true }
  });

  if (!audit) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Audit Status</h1>
        <p className="text-slate-500">{audit.project.domain}</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Status</p>
          <p className="text-2xl font-semibold">{audit.status}</p>
          <p className="text-xs text-slate-500">Started: {audit.startedAt ? audit.startedAt.toLocaleString() : 'Pending'}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Pages Crawled</p>
          <p className="text-2xl font-semibold">{audit.pagesCrawled}</p>
          <p className="text-xs text-slate-500">Issues found: {audit.issuesFound}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-5 space-y-2">
          <h2 className="text-lg font-semibold">Progress</h2>
          <div className="space-y-2 text-sm text-slate-500">
            <div>Crawling: {audit.progressCrawl}%</div>
            <div>Performance: {audit.progressPerformance}%</div>
            <div>Analysis: {audit.progressAnalysis}%</div>
            <div>Report: {audit.progressReport}%</div>
          </div>
        </div>
        <div className="card p-5 space-y-2">
          <h2 className="text-lg font-semibold">Actions</h2>
          <AuditStatusClient auditId={audit.id} status={audit.status} lastError={audit.lastError} />
        </div>
      </section>
    </div>
  );
}
