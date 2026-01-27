const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tickets = await prisma.ticket.findMany({
      where: { userId: 'cmkpa0z1h0000bwr1f0vo4ofz' }
  });
  console.log('Tickets:', tickets);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
