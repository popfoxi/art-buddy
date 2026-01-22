
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Deleting all Analysis records...');
    const { count } = await prisma.analysis.deleteMany({});
    console.log(`Deleted ${count} analysis records.`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
