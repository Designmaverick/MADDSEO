import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const severityRank: Record<string, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  INFO: 1
};

export default async function OverviewPage({ params }: { params: { auditId: string } }) {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const prisma = await getPrisma();
  const session = isBuild ? null : await getServerSession(await getAuthOptions(prisma ?? undefined));
  if (!session?.user && !isBuild) {
    notFound();
  }
  if (isBuild || !prisma) {
    return (
      <div className="card p-6 text-sm text-slate-500">
        Overview will be available after deployment finishes.
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

  const issues = await prisma.issue.findMany({
    where: { auditId: audit.id },
    select: { id: true, title: true, fix: true, severity: true, ruleId: true },
    orderBy: { createdAt: 'desc' },
    take: 500
  });

  const report = await prisma.report.findFirst({
    where: { auditId: audit.id, userId },
    orderBy: { createdAt: 'desc' }
  });

  const issueGroups = new Map<string, { title: string; count: number; severity: string }>();
  const fixGroups = new Map<string, { fix: string; count: number; severity: string }>();

  issues.forEach((issue) => {
    const issueKey = issue.ruleId || issue.title;
    const existing = issueGroups.get(issueKey);
    if (existing) {
      existing.count += 1;
      if (severityRank[issue.severity] > severityRank[existing.severity]) {
        existing.severity = issue.severity;
      }
    } else {
      issueGroups.set(issueKey, { title: issue.title, count: 1, severity: issue.severity });
    }

    const fixKey = issue.fix || issue.title;
    const fixExisting = fixGroups.get(fixKey);
    if (fixExisting) {
      fixExisting.count += 1;
      if (severityRank[issue.severity] > severityRank[fixExisting.severity]) {
        fixExisting.severity = issue.severity;
      }
    } else {
      fixGroups.set(fixKey, { fix: issue.fix, count: 1, severity: issue.severity });
    }
  });

  const topIssues = [...issueGroups.values()]
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.count - a.count)
    .slice(0, 10);
  const topFixes = [...fixGroups.values()]
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.count - a.count)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Audit Overview</h1>
          <p className="text-slate-500">{audit.project.domain}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/audits/${audit.id}`} className="px-4 py-2 rounded-xl border border-white/10 text-sm">
            View Status
          </Link>
          <Link href="/reports" className="button">
            {report?.fileUrl ? 'Download Report' : 'Reports'}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <div className="card p-5 md:col-span-2">
          <p className="text-sm text-slate-500">Overall Score</p>
          <p className="text-3xl font-semibold">{audit.scoreOverall ?? '—'}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Performance</p>
          <p className="text-2xl font-semibold">{audit.scorePerformance ?? '—'}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">On-Page</p>
          <p className="text-2xl font-semibold">{audit.scoreOnPage ?? '—'}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Technical</p>
          <p className="text-2xl font-semibold">{audit.scoreTechnical ?? '—'}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Off-Page</p>
          <p className="text-2xl font-semibold">{audit.scoreOffPage ?? '—'}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Top 10 Issues</h2>
          {topIssues.length === 0 ? (
            <p className="text-sm text-slate-500">No issues recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-400">
              {topIssues.map((issue) => (
                <li key={`${issue.title}-${issue.count}`}>
                  <span className="font-medium text-slate-200">{issue.title}</span> · {issue.count} · {issue.severity}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Top 10 Fixes</h2>
          {topFixes.length === 0 ? (
            <p className="text-sm text-slate-500">Fix recommendations will appear once issues are detected.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-400">
              {topFixes.map((fix) => (
                <li key={`${fix.fix}-${fix.count}`}>
                  <span className="font-medium text-slate-200">{fix.fix}</span> · {fix.count} · {fix.severity}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
