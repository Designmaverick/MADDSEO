import { NextResponse } from 'next/server';
import { getAuthOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function handler(req: Request) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ error: 'Build phase.' }, { status: 503 });
  }

  const NextAuth = (await import('next-auth')).default;
  const authOptions = await getAuthOptions();
  const nextAuthHandler = NextAuth(authOptions);
  return nextAuthHandler(req as any);
}

export { handler as GET, handler as POST };
