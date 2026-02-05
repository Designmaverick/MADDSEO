import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center">
      <div className="container py-16 space-y-10">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Cascade SEO</p>
          <h1 className="text-5xl font-semibold">SEO audits built for agencies.</h1>
          <p className="text-lg text-slate-500">
            Focused crawling, PageSpeed insights, and client-ready reports without the noise. Built for freelancers and
            agency teams.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-in" className="button">Sign in</Link>
            <Link href="/sign-up" className="px-4 py-2 rounded-xl border border-white/10">Create account</Link>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <p className="text-sm text-slate-500">Plan controls</p>
            <p className="text-lg font-semibold">Manual Pro toggles</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">Audit engine</p>
            <p className="text-lg font-semibold">Crawl + PageSpeed</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">Reporting</p>
            <p className="text-lg font-semibold">PDF + DOCX output</p>
          </div>
        </div>
      </div>
    </div>
  );
}
