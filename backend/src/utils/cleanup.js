const prisma = require('./prisma');

/**
 * Automatically delete submission proofs older than 30 days
 * to keep database storage lightweight and manage retention.
 */
async function cleanupExpiredProofs() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await prisma.submissionProof.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });
    if (result.count > 0) {
      console.log(`[CleanUp] Auto-cleanup: Removed ${result.count} submission proof(s) older than 30 days.`);
    }
  } catch (error) {
    console.error('Auto-cleanup error (30-day proof deletion):', error.message || error);
  }
}

module.exports = { cleanupExpiredProofs };
