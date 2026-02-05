import { Suspense } from 'react';
import SignInClient from './SignInClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading…</div>}>
      <SignInClient />
    </Suspense>
  );
}
