import { PrismaClient } from '.prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123456', 12);

  await prisma.user.upsert({
    where: { email: 'admin@matchcoach.dev' },
    update: {},
    create: {
      email: 'admin@matchcoach.dev',
      passwordHash,
      firstName: 'Admin',
      lastName: 'MatchCoach',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'coach@matchcoach.dev' },
    update: {},
    create: {
      email: 'coach@matchcoach.dev',
      passwordHash: await bcrypt.hash('coach123456', 12),
      firstName: 'Coach',
      lastName: 'Demo',
      role: 'FREE',
    },
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
