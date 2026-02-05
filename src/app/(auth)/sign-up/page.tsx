import { Suspense } from 'react';
import SignUpClient from './SignUpClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading…</div>}>
      <SignUpClient />
    </Suspense>
  );
}
