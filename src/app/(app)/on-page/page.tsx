import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default function OnPagePage() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  if (isBuild) {
    return (
      <div className="card p-6 text-sm text-slate-500">
        On-page issues will be available after deployment finishes.
      </div>
    );
  }
  redirect('/onpage');
}
