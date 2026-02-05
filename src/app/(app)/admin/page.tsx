import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function AdminPage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const prisma = await getPrisma();
  const session = isBuild ? null : await getServerSession(await getAuthOptions(prisma ?? undefined));

  if (!session?.user && !isBuild) {
    redirect('/sign-in');
  }
  if (session?.user && session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  if (isBuild || !prisma) {
    return (
      <div className="card p-6 text-sm text-slate-500">
        Admin data will be available after deployment finishes.
      </div>
    );
  }

  const [users, invites] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isPro: true,
        createdAt: true
      }
    }),
    prisma.inviteToken.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  ]);

  return (
    <AdminClient
      initialUsers={users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString()
      }))}
      initialInvites={invites.map((invite) => ({
        ...invite,
        expiresAt: invite.expiresAt.toISOString(),
        usedAt: invite.usedAt ? invite.usedAt.toISOString() : null
      }))}
    />
  );
}
