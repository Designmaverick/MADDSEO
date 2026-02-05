import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function ReportsPage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const session = isBuild ? null : await getServerSession(authOptions);
  const prisma = await getPrisma();
  const reports =
    isBuild || !prisma
      ? []
      : await prisma.report.findMany({
          where: { userId: session?.user.id },
          include: { audit: { include: { project: true } } },
          orderBy: { createdAt: 'desc' }
        });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Reports</h1>
        <p className="text-slate-500">Download PDF and DOCX deliverables.</p>
      </div>

      {reports.length === 0 ? (
        <div className="card p-6 text-sm text-slate-500">No reports generated yet.</div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <div key={report.id} className="card p-5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-slate-500">{report.audit.project.domain}</p>
                <h2 className="text-lg font-semibold">{report.type} Report</h2>
                <p className="text-xs text-slate-500">Status: {report.status}</p>
              </div>
              <div className="text-sm text-slate-500">White label: {report.whiteLabel ? 'Yes' : 'No'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
