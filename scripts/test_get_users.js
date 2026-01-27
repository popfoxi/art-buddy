const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getUsers(query, role, plan) {
  // Simulate logic from actions.ts
  const where = {};
  if (query) {
    where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
    ];
  }
  if (role !== 'all') where.role = role;
  if (plan !== 'all') where.plan = plan;

  return await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

async function main() {
  const users = await getUsers("", "all", "all");
  console.log('Users found:', users.length);
  users.forEach(u => console.log(`${u.name} (${u.role}) - ${u.plan}`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
