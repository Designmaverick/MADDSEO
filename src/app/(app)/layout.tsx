import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/audits/new', label: 'New Audit' },
  { href: '/audits', label: 'Site Audits' },
  { href: '/on-page', label: 'On-Page' },
  { href: '/technical', label: 'Technical' },
  { href: '/off-page', label: 'Off-Page' },
  { href: '/reports', label: 'Reports' },
  { href: '/settings', label: 'Settings' }
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-white/10 bg-black/20 backdrop-blur px-4 py-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Cascade</p>
          <h2 className="text-xl font-semibold">SEO Audit</h2>
          <div className="mt-3 flex items-center gap-2">
            <span className="badge">{session.user.isPro ? 'PRO' : 'FREE'}</span>
            <span className="text-xs text-slate-500">{session.user.email}</span>
          </div>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="sidebar-link text-sm">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
