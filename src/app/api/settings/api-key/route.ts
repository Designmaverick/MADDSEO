import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { randomBytes } from 'crypto';
import { getAuthOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function generateApiKey() {
  return `maddseo_${randomBytes(24).toString('base64url')}`;
}

export async function POST() {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Build phase.' }, { status: 503 });
  }
  const session = await getServerSession(await getAuthOptions(prisma));
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const apiKey = generateApiKey();
  const apiKeyHash = await hashPassword(apiKey);
  const apiKeyLastFour = apiKey.slice(-4);

  await prisma.settings.upsert({
    where: { userId: session.user.id },
    update: {
      apiKeyHash,
      apiKeyLastFour,
      apiKeyCreatedAt: new Date()
    },
    create: {
      userId: session.user.id,
      apiKeyHash,
      apiKeyLastFour,
      apiKeyCreatedAt: new Date()
    }
  });

  return NextResponse.json({ apiKey });
}
