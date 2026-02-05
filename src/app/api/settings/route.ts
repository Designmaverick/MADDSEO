import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updateSchema = z.object({
  profile: z
    .object({
      name: z.string().min(2).max(120).optional()
    })
    .optional(),
  branding: z
    .object({
      companyName: z.string().max(200).optional(),
      companyUrl: z.string().max(200).optional(),
      logoUrl: z.string().max(400).optional(),
      whiteLabelDefault: z.boolean().optional(),
      brandPrimaryColor: z.string().max(20).optional(),
      brandSecondaryColor: z.string().max(20).optional()
    })
    .optional(),
  notifications: z
    .object({
      notificationAuditComplete: z.boolean().optional(),
      notificationWeeklyDigest: z.boolean().optional(),
      notificationMarketing: z.boolean().optional()
    })
    .optional()
});

export async function GET() {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Build phase.' }, { status: 503 });
  }
  const session = await getServerSession(await getAuthOptions(prisma));
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const settings = await prisma.settings.findUnique({
    where: { userId: session.user.id }
  });

  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Build phase.' }, { status: 503 });
  }
  const session = await getServerSession(await getAuthOptions(prisma));
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const { profile, branding, notifications } = parsed.data;

  if (
    !session.user.isPro &&
    branding &&
    (branding.whiteLabelDefault !== undefined ||
      branding.brandPrimaryColor !== undefined ||
      branding.brandSecondaryColor !== undefined)
  ) {
    return NextResponse.json({ error: 'Branding colors and white-label are Pro-only.' }, { status: 403 });
  }

  if (profile?.name) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: profile.name }
    });
  }

  const data: Record<string, unknown> = {};
  if (branding) {
    if (branding.companyName !== undefined) data.companyName = branding.companyName;
    if (branding.companyUrl !== undefined) data.companyUrl = branding.companyUrl;
    if (branding.logoUrl !== undefined) data.logoUrl = branding.logoUrl;
    if (branding.whiteLabelDefault !== undefined) data.whiteLabelDefault = branding.whiteLabelDefault;
    if (branding.brandPrimaryColor !== undefined) data.brandPrimaryColor = branding.brandPrimaryColor;
    if (branding.brandSecondaryColor !== undefined) data.brandSecondaryColor = branding.brandSecondaryColor;
  }
  if (notifications) {
    if (notifications.notificationAuditComplete !== undefined)
      data.notificationAuditComplete = notifications.notificationAuditComplete;
    if (notifications.notificationWeeklyDigest !== undefined)
      data.notificationWeeklyDigest = notifications.notificationWeeklyDigest;
    if (notifications.notificationMarketing !== undefined)
      data.notificationMarketing = notifications.notificationMarketing;
  }

  if (Object.keys(data).length > 0) {
    await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        userId: session.user.id,
        ...data
      }
    });
  }

  return NextResponse.json({ ok: true });
}
