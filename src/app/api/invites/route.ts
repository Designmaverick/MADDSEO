import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSchema = z.object({
  email: z.string().email().optional(),
  isPro: z.boolean().optional().default(false),
  role: z.enum(['SUPER_ADMIN', 'USER']).optional().default('USER'),
  expiresInDays: z.number().min(1).max(30).optional().default(7)
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const invites = await prisma.inviteToken.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  return NextResponse.json(invites);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parsed.data.expiresInDays);

  const invite = await prisma.inviteToken.create({
    data: {
      token,
      email: parsed.data.email,
      isPro: parsed.data.isPro,
      role: parsed.data.role,
      expiresAt,
      createdById: session.user.id
    }
  });

  return NextResponse.json({
    token: invite.token,
    expiresAt: invite.expiresAt,
    email: invite.email,
    isPro: invite.isPro,
    role: invite.role
  });
}
