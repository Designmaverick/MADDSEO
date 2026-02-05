import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

const FREE_LIMITS = {
  maxProjects: 1,
  maxAuditsPerWeek: 1,
  maxPages: 10
};
const PRO_LIMITS = {
  maxProjects: Infinity,
  maxAuditsPerWeek: Infinity,
  maxPages: 100
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function DashboardPage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const prisma = await getPrisma();
  const session = isBuild ? null : await getServerSession(await getAuthOptions(prisma ?? undefined));
  if (session?.user.role === 'SUPER_ADMIN') {
    redirect('/admin');
  }
  const userId = session?.user.id || '';

  const [
    activeProjects,
    projectsCount,
    auditsCount,
    reportsCount,
    latestAudit,
    latestReport,
    recentScores
  ] =
    isBuild || !prisma
      ? [0, 0, 0, 0, null, null, []]
      : await Promise.all([
          prisma.project.count({ where: { ownerId: userId, isActive: true } }),
          prisma.project.count({ where: { ownerId: userId } }),
          prisma.audit.count({ where: { runnerId: userId } }),
          prisma.report.count({ where: { userId } }),
          prisma.audit.findFirst({
            where: { runnerId: userId },
            orderBy: { createdAt: 'desc' },
            include: { project: true }
          }),
          prisma.report.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.audit.findMany({
            where: { runnerId: userId, status: 'COMPLETED', scoreOverall: { not: null } },
            orderBy: { createdAt: 'desc' },
            take: 6,
            select: { id: true, scoreOverall: true, createdAt: true }
          })
        ]);

  const criticalIssuesCount =
    !isBuild && prisma && latestAudit
      ? await prisma.issue.count({
          where: { auditId: latestAudit.id, severity: 'CRITICAL' }
        })
      : 0;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const auditsThisWeek =
    !isBuild && prisma
      ? await prisma.audit.count({
          where: { runnerId: userId, createdAt: { gte: weekAgo } }
        })
      : 0;

  const planLimits = session?.user.isPro ? PRO_LIMITS : FREE_LIMITS;
  const usedQuota = session?.user.isPro
    ? 'Unlimited'
    : `${projectsCount}/${planLimits.maxProjects} domains · ${auditsThisWeek}/${planLimits.maxAuditsPerWeek} audits this week`;

  const planSummary = session?.user.isPro
    ? ['Unlimited domains', 'Unlimited audits', '100+ pages per crawl']
    : [`${planLimits.maxProjects} domain`, `${planLimits.maxAuditsPerWeek} audit per week`, `${planLimits.maxPages} pages per crawl`];

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-slate-500">Track audits, issues, and reports from one place.</p>
        </div>
        <Link href="/audits/new" className="button">
          Run New Audit
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Active Projects</p>
          <p className="text-3xl font-semibold">{activeProjects}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Last Audit Score</p>
          <p className="text-3xl font-semibold">
            {latestAudit?.scoreOverall ?? '—'}
          </p>
          <p className="text-xs text-slate-500">{latestAudit?.project.domain ?? 'No audits yet'}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Critical Issues</p>
          <p className="text-3xl font-semibold">{criticalIssuesCount}</p>
          <p className="text-xs text-slate-500">Latest audit</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Used Quota</p>
          <p className="text-lg font-semibold">{usedQuota}</p>
          <p className="text-xs text-slate-500">{auditsCount} total audits</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Performance Trend</h2>
              <p className="text-slate-500">Recent completed audits.</p>
            </div>
            <span className="text-xs text-slate-500">{recentScores.length} data points</span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {recentScores.length === 0 ? (
              <div className="text-sm text-slate-500">Run your first audit to see trends.</div>
            ) : (
              [...recentScores]
                .reverse()
                .map((audit) => (
                  <div key={audit.id} className="flex-1">
                    <div
                      className="rounded-lg bg-[#9a28c5]/60"
                      style={{ height: `${Math.max(10, audit.scoreOverall ?? 0)}%` }}
                    />
                    <p className="mt-2 text-center text-xs text-slate-500">{audit.scoreOverall}</p>
                  </div>
                ))
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/audits/new" className="button">Run New Audit</Link>
            <Link href={latestReport ? '/reports' : '/projects'} className="px-4 py-2 rounded-xl border border-white/10 text-sm">
              {latestReport ? 'View Last Report' : 'Add Project'}
            </Link>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Plan</h3>
            <span className="badge">{session?.user.isPro ? 'PRO' : 'FREE'}</span>
          </div>
          <ul className="text-sm text-slate-400 space-y-2">
            {planSummary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="text-xs text-slate-500">
            {session?.user.isPro
              ? 'White-label reports and deeper crawls enabled.'
              : 'Need higher limits? Ask a Super Admin to enable Pro.'}
          </div>
          <div className="pt-2 space-y-2 text-sm text-slate-500">
            <div>Projects: {projectsCount}</div>
            <div>Audits: {auditsCount}</div>
            <div>Reports: {reportsCount}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
