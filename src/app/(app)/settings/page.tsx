import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';
import SignOutButton from './SignOutButton';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function SettingsPage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const session = isBuild ? null : await getServerSession(authOptions);
  const prisma = await getPrisma();
  const settings =
    isBuild || !prisma
      ? null
      : await prisma.settings.findUnique({
          where: { userId: session?.user.id }
        });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-slate-500">Manage your workspace profile and branding.</p>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <p className="text-sm text-slate-500">Account</p>
          <p className="text-lg font-semibold">{session?.user.email}</p>
        </div>
        <div className="grid gap-3 text-sm text-slate-500">
          <div>Role: {session?.user.role}</div>
          <div>Plan: {session?.user.isPro ? 'PRO' : 'FREE'}</div>
          <div>Status: {session?.user.status}</div>
        </div>
        <SignOutButton />
      </div>

      <div className="card p-6 space-y-3">
        <h2 className="text-lg font-semibold">Branding</h2>
        <p className="text-sm text-slate-500">
          Customize your reports by setting company name, logo, and default white-label preferences.
        </p>
        <div className="grid gap-2 text-sm text-slate-500">
          <div>Company: {settings?.companyName || 'Not set'}</div>
          <div>Website: {settings?.companyUrl || 'Not set'}</div>
          <div>White-label default: {settings?.whiteLabelDefault ? 'Enabled' : 'Disabled'}</div>
        </div>
      </div>
    </div>
  );
}
