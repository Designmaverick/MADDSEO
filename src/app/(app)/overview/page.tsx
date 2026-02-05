import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function OverviewIndexPage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const prisma = await getPrisma();
  const session = isBuild ? null : await getServerSession(await getAuthOptions(prisma ?? undefined));

  if (!session?.user && !isBuild) {
    redirect('/sign-in');
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
    return (
      <div className="card p-6 text-sm text-slate-500">
        Overview will be available after deployment finishes.
      </div>
    );
  }

  const audit = await prisma.audit.findFirst({
    where: { runnerId: userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true }
  });

  if (!audit) {
    return (
      <div className="card p-6 text-sm text-slate-500">
        No audits yet. Start a new audit to view an overview.
      </div>
    );
  }

  redirect(`/overview/${audit.id}`);
}
