import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128).optional(),
  role: z.enum(['SUPER_ADMIN', 'USER']).optional().default('USER'),
  isPro: z.boolean().optional().default(false)
});

export async function GET() {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Build phase.' }, { status: 503 });
  }
  const session = await getServerSession(await getAuthOptions(prisma));
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      isPro: true,
      createdAt: true
    }
  });

  return NextResponse.json({
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString()
    }))
  });
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Build phase.' }, { status: 503 });
  }
  const session = await getServerSession(await getAuthOptions(prisma));
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const { name, email, role, isPro } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already exists.' }, { status: 409 });
  }

  const tempPassword =
    parsed.data.password ??
    `${randomBytes(6).toString('base64url')}${randomBytes(2).toString('hex')}`;
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      isPro,
      passwordHash
    },
    select: {
      id: true,
      email: true,
      role: true,
      isPro: true
    }
  });

  return NextResponse.json({
    ...user,
    tempPassword
  });
}
