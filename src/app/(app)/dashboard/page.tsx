import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function DashboardPage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const session = isBuild ? null : await getServerSession(authOptions);
  const userId = session?.user.id || '';

  const [projectsCount, auditsCount, reportsCount] = isBuild
    ? [0, 0, 0]
    : await Promise.all([
        prisma.project.count({ where: { ownerId: userId } }),
        prisma.audit.count({ where: { runnerId: userId } }),
        prisma.report.count({ where: { userId } })
      ]);

  const planSummary = session?.user.isPro
    ? ['Unlimited domains', 'Unlimited audits', '100+ pages per crawl']
    : ['1 domain', '1 audit per week', '10 pages per crawl'];

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

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Projects</p>
          <p className="text-3xl font-semibold">{projectsCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Audits run</p>
          <p className="text-3xl font-semibold">{auditsCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Reports</p>
          <p className="text-3xl font-semibold">{reportsCount}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Next steps</h2>
            <p className="text-slate-500">Get your first audit running in minutes.</p>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-400">
            <li>Add your first domain in New Audit.</li>
            <li>Run a crawl and PageSpeed analysis.</li>
            <li>Export PDF or DOCX for your client.</li>
          </ol>
        </div>
        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Plan limits</h3>
            <span className="badge">{session?.user.isPro ? 'PRO' : 'FREE'}</span>
          </div>
          <ul className="text-sm text-slate-400 space-y-2">
            {planSummary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {!session?.user.isPro && (
            <p className="text-xs text-slate-500">
              Need unlimited audits? Ask a Super Admin to enable Pro.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
