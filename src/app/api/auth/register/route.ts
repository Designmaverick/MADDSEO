import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const payloadSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  inviteToken: z.string().min(8).optional()
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const { name, email, password, inviteToken } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already in use.' }, { status: 409 });
  }

  const systemSettings = await prisma.systemSettings.findFirst();
  if (!systemSettings) {
    await prisma.systemSettings.create({ data: {} });
  }

  const allowSignup = systemSettings?.allowSignup ?? true;

  let invite = null as null | {
    id: string;
    email: string | null;
    isPro: boolean;
    role: 'SUPER_ADMIN' | 'USER';
    expiresAt: Date;
    usedAt: Date | null;
  };

  if (inviteToken) {
    invite = await prisma.inviteToken.findUnique({
      where: { token: inviteToken }
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite token.' }, { status: 400 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: 'Invite already used.' }, { status: 400 });
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invite has expired.' }, { status: 400 });
    }

    if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Invite email mismatch.' }, { status: 400 });
    }
  } else if (!allowSignup) {
    return NextResponse.json({ error: 'Signups are currently disabled.' }, { status: 403 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        isPro: invite?.isPro ?? false,
        role: invite?.role ?? 'USER'
      }
    });

    if (invite) {
      await tx.inviteToken.update({
        where: { id: invite.id },
        data: {
          usedAt: new Date(),
          usedById: created.id
        }
      });
    }

    return created;
  });

  return NextResponse.json({
    id: user.id,
    email: user.email
  });
}
