import { PrismaClient, UserRole, RoundStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Hash password for all users (default password: "password")
  const passwordHash = await bcrypt.hash('password', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: uuidv4(),
      username: 'admin',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
  console.log('Created admin user:', admin.username);

  // Create survivor user
  const survivor = await prisma.user.upsert({
    where: { username: 'survivor1' },
    update: {},
    create: {
      id: uuidv4(),
      username: 'survivor1',
      passwordHash,
      role: UserRole.SURVIVOR,
    },
  });
  console.log('Created survivor user:', survivor.username);

  // Create Nikita user
  const nikita = await prisma.user.upsert({
    where: { username: 'nikita' },
    update: {},
    create: {
      id: uuidv4(),
      username: 'nikita',
      passwordHash,
      role: UserRole.NIKITA,
    },
  });
  console.log('Created Nikita user:', nikita.username);

  // Create a sample round with cooldown status
  // Cooldown starts now, round starts in 30 seconds, ends 60 seconds after start
  const now = new Date();
  const cooldownStartAt = now;
  const startAt = new Date(now.getTime() + 30 * 1000); // 30 seconds from now
  const endAt = new Date(startAt.getTime() + 60 * 1000); // 60 seconds after start

  const round = await prisma.round.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      status: RoundStatus.COOLDOWN,
      cooldownStartAt,
      startAt,
      endAt,
      totalPoints: 0,
      createdById: admin.id,
    },
  });
  console.log('Created sample round:', round.id);

  console.log('Seed completed successfully!');
  console.log('\nDefault password for all users: password');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


