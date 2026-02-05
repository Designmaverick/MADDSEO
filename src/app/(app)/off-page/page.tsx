import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function OffPagePage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const session = isBuild ? null : await getServerSession(authOptions);
  const prisma = await getPrisma();
  const count =
    isBuild || !prisma
      ? 0
      : await prisma.issue.count({
          where: { audit: { runnerId: session?.user.id }, category: 'OFF_PAGE' }
        });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Off-Page Signals</h1>
        <p className="text-slate-500">Lite module for backlink signals and authority metrics.</p>
      </div>
      <div className="card p-6 space-y-3">
        <div>
          <p className="text-sm text-slate-500">Total off-page issues</p>
          <p className="text-3xl font-semibold">{count}</p>
        </div>
        <p className="text-sm text-slate-500">
          Off-page insights depend on external backlink data sources. Connect a provider to populate this section.
        </p>
      </div>
    </div>
  );
}
