import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function UpgradePage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const prisma = await getPrisma();
  const session = isBuild ? null : await getServerSession(await getAuthOptions(prisma ?? undefined));
  if (!session?.user && !isBuild) {
    redirect('/sign-in');
  }
  if (isBuild || !prisma) {
    return (
      <div className="card p-6 text-sm text-slate-500">
        Upgrade information will be available after deployment finishes.
      </div>
    );
  }

  const adminEmail = process.env.SUPER_ADMIN_EMAIL ?? 'your-admin@domain.com';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Upgrade</h1>
        <p className="text-slate-500">Pro unlocks unlimited audits and white-label reports.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-6 space-y-3">
          <h2 className="text-lg font-semibold">Free Plan</h2>
          <ul className="text-sm text-slate-400 space-y-2">
            <li>1 domain</li>
            <li>1 audit per week</li>
            <li>10 pages max</li>
          </ul>
        </div>
        <div className="card p-6 space-y-3">
          <h2 className="text-lg font-semibold">Pro Plan</h2>
          <ul className="text-sm text-slate-400 space-y-2">
            <li>Unlimited domains</li>
            <li>Unlimited audits</li>
            <li>100+ pages per crawl</li>
            <li>White-label reports</li>
          </ul>
        </div>
      </section>

      <div className="card p-6 space-y-2">
        <h3 className="text-lg font-semibold">Contact Admin</h3>
        <p className="text-sm text-slate-500">Request Pro access from the Super Admin.</p>
        <p className="text-sm text-slate-400">Email: {adminEmail}</p>
      </div>
    </div>
  );
}
