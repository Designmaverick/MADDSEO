import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthOptions } from '@/lib/auth';
import SignOutButton from '@/app/(app)/SignOutButton';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const baseNavItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/audits/new', label: 'New Audit' },
  { href: '/projects', label: 'Projects' },
  { href: '/audits', label: 'Site Audits' },
  { href: '/overview', label: 'Overview' },
  { href: '/onpage', label: 'On-Page' },
  { href: '/technical', label: 'Technical' },
  { href: '/offpage', label: 'Off-Page' },
  { href: '/reports', label: 'Reports' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' }
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const session = isBuild ? null : await getServerSession(await getAuthOptions());
  if (!session?.user && !isBuild) {
    redirect('/sign-in');
  }
  if (session?.user?.status === 'DISABLED') {
    redirect('/sign-in');
  }
  const user = session?.user;
  const navItems = [
    ...(user?.role === 'SUPER_ADMIN' ? [{ href: '/admin', label: 'Admin' }] : []),
    ...baseNavItems,
    ...(!user?.isPro ? [{ href: '/upgrade', label: 'Upgrade' }] : [])
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-white/10 bg-black/20 backdrop-blur px-4 py-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Cascade</p>
          <h2 className="text-xl font-semibold">SEO Audit</h2>
          <div className="mt-3 flex items-center gap-2">
            <span className="badge">{user?.isPro ? 'PRO' : 'FREE'}</span>
            <span className="text-xs text-slate-500">{user?.email ?? 'Signed out'}</span>
          </div>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="sidebar-link text-sm">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6">
          <SignOutButton className="w-full px-3 py-2 rounded-xl border border-white/10 text-sm" label="Logout" />
        </div>
      </aside>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
