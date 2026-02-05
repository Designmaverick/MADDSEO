import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';
import IssueListClient, { IssueItem } from '@/app/(app)/IssueListClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

function mapOnPageGroup(issue: { title: string; ruleId: string }) {
  const text = `${issue.title} ${issue.ruleId}`.toLowerCase();
  if (text.includes('meta') || text.includes('title') || text.includes('description')) return 'Meta';
  if (text.includes('heading') || text.includes('h1') || text.includes('h2')) return 'Headings';
  if (text.includes('image') || text.includes('alt')) return 'Images';
  if (text.includes('schema') || text.includes('structured')) return 'Schema';
  return 'Content';
}

export default async function OnPageDetail({ params }: { params: { auditId: string } }) {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const prisma = await getPrisma();
  const session = isBuild ? null : await getServerSession(await getAuthOptions(prisma ?? undefined));
  if (!session?.user && !isBuild) {
    notFound();
  }
  if (isBuild || !prisma) {
    return (
      <div className="card p-6 text-sm text-slate-500">
        On-page issues will be available after deployment finishes.
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
    where: { auditId: audit.id, category: 'ON_PAGE' },
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
    group: mapOnPageGroup({ title: issue.title, ruleId: issue.ruleId }),
    pageUrl: issue.page?.url ?? null
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">On-Page Issues</h1>
        <p className="text-slate-500">{audit.project.domain}</p>
      </div>
      <IssueListClient issues={mapped} />
    </div>
  );
}
