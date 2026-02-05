import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function OffPageDetail({ params }: { params: { auditId: string } }) {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const prisma = await getPrisma();
  const session = isBuild ? null : await getServerSession(await getAuthOptions(prisma ?? undefined));
  if (!session?.user && !isBuild) {
    notFound();
  }
  if (isBuild || !prisma) {
    return (
      <div className="card p-6 text-sm text-slate-500">
        Off-page insights will be available after deployment finishes.
      </div>
    );
  }

  const userId = session?.user?.id;
  if (!userId) {
    notFound();
  }

  const audit = await prisma.audit.findFirst({
    where: { id: params.auditId, runnerId: userId },
    include: { project: true }
  });

  if (!audit) {
    notFound();
  }

  const [indexedPages, offPageIssues] = await Promise.all([
    prisma.page.count({ where: { auditId: audit.id, indexable: true } }),
    prisma.issue.count({ where: { auditId: audit.id, category: 'OFF_PAGE' } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Off-Page (Lite)</h1>
        <p className="text-slate-500">{audit.project.domain}</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Indexed pages</p>
          <p className="text-3xl font-semibold">{indexedPages}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Off-page issues</p>
          <p className="text-3xl font-semibold">{offPageIssues}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Domain age</p>
          <p className="text-lg font-semibold">Not available</p>
          <p className="text-xs text-slate-500">WHOIS integration coming soon.</p>
        </div>
      </section>

      <section className="card p-6 space-y-3">
        <h2 className="text-lg font-semibold">Backlinks (future)</h2>
        <p className="text-sm text-slate-500">
          Phase 1 provides a lite off-page snapshot. Backlink audits and competitive analysis will be added in a future
          release.
        </p>
      </section>
    </div>
  );
}
