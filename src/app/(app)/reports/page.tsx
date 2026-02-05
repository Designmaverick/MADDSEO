import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';
import ReportsClient from './ReportsClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function ReportsPage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const prisma = await getPrisma();
  const session = isBuild ? null : await getServerSession(await getAuthOptions(prisma ?? undefined));
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

      <ReportsClient
        initialReports={reports.map((report) => ({
          id: report.id,
          type: report.type,
          status: report.status,
          fileUrl: report.fileUrl,
          whiteLabel: report.whiteLabel,
          createdAt: report.createdAt.toISOString(),
          auditDomain: report.audit.project.domain
        }))}
      />
    </div>
  );
}
