import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function SettingsPage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const prisma = await getPrisma();
  const session = isBuild ? null : await getServerSession(await getAuthOptions(prisma ?? undefined));
  if (!session?.user && !isBuild) {
    redirect('/sign-in');
  }
  const settings =
    isBuild || !prisma
      ? null
      : await prisma.settings.findUnique({
          where: { userId: session?.user.id }
        });

  const hasGoogle =
    isBuild || !prisma
      ? false
      : Boolean(
          await prisma.account.findFirst({
            where: { userId: session?.user.id, provider: 'google' }
          })
        );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-slate-500">Manage your workspace profile and branding.</p>
      </div>
      <SettingsClient
        userName={session?.user.name ?? null}
        userEmail={session?.user.email ?? ''}
        isPro={Boolean(session?.user.isPro)}
        role={session?.user.role ?? 'USER'}
        status={session?.user.status ?? 'ACTIVE'}
        hasGoogle={hasGoogle}
        settings={{
          companyName: settings?.companyName ?? null,
          companyUrl: settings?.companyUrl ?? null,
          logoUrl: settings?.logoUrl ?? null,
          whiteLabelDefault: settings?.whiteLabelDefault ?? false,
          brandPrimaryColor: settings?.brandPrimaryColor ?? '#9a28c5',
          brandSecondaryColor: settings?.brandSecondaryColor ?? '#6c2bd9',
          notificationAuditComplete: settings?.notificationAuditComplete ?? true,
          notificationWeeklyDigest: settings?.notificationWeeklyDigest ?? false,
          notificationMarketing: settings?.notificationMarketing ?? false,
          apiKeyLastFour: settings?.apiKeyLastFour ?? null,
          apiKeyCreatedAt: settings?.apiKeyCreatedAt ? settings.apiKeyCreatedAt.toISOString() : null
        }}
      />
    </div>
  );
}
