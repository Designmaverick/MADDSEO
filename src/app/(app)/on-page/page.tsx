import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function OnPagePage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const session = isBuild ? null : await getServerSession(authOptions);
  const count = isBuild
    ? 0
    : await prisma.issue.count({
        where: { audit: { runnerId: session?.user.id }, category: 'ON_PAGE' }
      });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">On-Page Issues</h1>
        <p className="text-slate-500">Track metadata, headings, and content structure issues.</p>
      </div>
      <div className="card p-6">
        <p className="text-sm text-slate-500">Total on-page issues</p>
        <p className="text-3xl font-semibold">{count}</p>
      </div>
    </div>
  );
}
