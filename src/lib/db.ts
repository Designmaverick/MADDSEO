export async function getPrisma() {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}
