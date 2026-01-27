const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 'cmkpa0z1h0000bwr1f0vo4ofz';
  const analyses = await prisma.analysis.count({ where: { userId } });
  const tickets = await prisma.ticket.count({ where: { userId } });
  console.log(`Analyses: ${analyses}, Tickets: ${tickets}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
