import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';
import IssueListClient, { IssueItem } from '@/app/(app)/IssueListClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

function mapTechnicalGroup(issue: { title: string; ruleId: string }) {
  const text = `${issue.title} ${issue.ruleId}`.toLowerCase();
  if (text.includes('index') || text.includes('noindex')) return 'Indexability';
  if (text.includes('crawl') || text.includes('crawlability')) return 'Crawlability';
  if (text.includes('redirect')) return 'Redirects';
  if (text.includes('https') || text.includes('ssl')) return 'HTTPS';
  if (text.includes('robots')) return 'Robots';
  if (text.includes('sitemap')) return 'Sitemaps';
  if (text.includes('broken') || text.includes('404')) return 'Broken Links';
  return 'Other Technical';
}

export default async function TechnicalDetail({ params }: { params: { auditId: string } }) {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const prisma = await getPrisma();
  const session = isBuild ? null : await getServerSession(await getAuthOptions(prisma ?? undefined));
  if (!session?.user && !isBuild) {
    notFound();
  }
  if (isBuild || !prisma) {
    return (
      <div className="card p-6 text-sm text-slate-500">
        Technical issues will be available after deployment finishes.
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
    where: { auditId: audit.id, category: 'TECHNICAL' },
    include: { page: { select: { url: true } } },
    orderBy: { severity: 'desc' },
    take: 500
  });

  const mapped: IssueItem[] = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    fix: issue.fix,
    severity: issue.severity,
    category: issue.category,
    group: mapTechnicalGroup({ title: issue.title, ruleId: issue.ruleId }),
    pageUrl: issue.page?.url ?? null
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Technical Issues</h1>
        <p className="text-slate-500">{audit.project.domain}</p>
      </div>
      <IssueListClient issues={mapped} />
    </div>
  );
}
