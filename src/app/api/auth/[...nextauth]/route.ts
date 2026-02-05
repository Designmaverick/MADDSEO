import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: { nextauth: string[] } };

async function handler(req: NextRequest, ctx: RouteContext) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ error: 'Build phase.' }, { status: 503 });
  }

  const NextAuth = (await import('next-auth')).default;
  const authOptions = await getAuthOptions();
  const nextAuthHandler = NextAuth(authOptions);
  return nextAuthHandler(req, ctx as any);
}

export { handler as GET, handler as POST };
