
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAnalyses() {
  try {
    console.log('Clearing all analysis history...');
    
    // Delete all records from the Analysis table
    // We use deleteMany without where clause to delete all rows
    const result = await prisma.analysis.deleteMany({});
    
    console.log(`Successfully deleted ${result.count} analysis records.`);
    
    // Also reset analysis counts if needed? 
    // The user said "All analyzed image records... delete first, let user re-analyze".
    // This implies we should also reset user's usage counts if they were based on history,
    // but the system tracks 'usageStats' via credits.
    // However, if the user wants to test "new scoring standards", simply deleting history is enough.
    // The credits might be an issue if they run out.
    // I will NOT reset credits unless asked, as that involves money/quota.
    // But I will reset "analysisCount" in localStorage? I can't touch localStorage from here.
    // The user's request is mainly about "re-analyzing to see new standards".
    
  } catch (error) {
    console.error('Error clearing analyses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAnalyses();
