import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default function OffPagePage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  if (isBuild) {
    return (
      <div className="card p-6 text-sm text-slate-500">
        Off-page insights will be available after deployment finishes.
      </div>
    );
  }
  redirect('/offpage');
}
