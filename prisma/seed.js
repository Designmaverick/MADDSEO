import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required to seed.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Super admin already exists.');
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      isPro: true
    }
  });

  console.log('Super admin created:', email);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
