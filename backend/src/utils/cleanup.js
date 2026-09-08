const fs = require('fs');
const path = require('path');
const prisma = require('./prisma');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { r2Client, R2_BUCKET, isR2Configured } = require('../config/r2');

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

/**
 * Permanently delete an individual job and all its associated data:
 * - Associated proofs and physical files (local uploads and Cloudflare R2 objects)
 * - Associated task assignments
 * - Associated job targets
 * - Job record itself
 * 
 * Unrelated employer, worker, and wallet financial accounts are strictly preserved.
 */
async function deleteJobPermanently(jobId) {
  if (!jobId) return false;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      assignments: {
        include: {
          proofs: true,
        },
      },
    },
  });

  if (!job) return false;

  // 1. Delete associated proof files from filesystem and R2
  const uploadDir = path.join(__dirname, '../../uploads');
  for (const assignment of job.assignments) {
    for (const proof of assignment.proofs) {
      // Local file removal
      if (proof.fileUrl && proof.fileUrl.startsWith('/uploads/')) {
        try {
          const localPath = path.join(uploadDir, '..', proof.fileUrl);
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
          }
        } catch (fileErr) {
          console.warn(`[CleanUp] Could not remove local file for proof ${proof.id}:`, fileErr.message);
        }
      }

      // Cloudflare R2 object removal
      const r2Key = (proof.fileUrl && !proof.fileUrl.startsWith('http') && !proof.fileUrl.startsWith('data:') && !proof.fileUrl.startsWith('/'))
        ? proof.fileUrl
        : (proof.content && proof.content.startsWith('proofs/') ? proof.content : null);

      if (r2Key && isR2Configured() && r2Client) {
        try {
          await r2Client.send(new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: r2Key,
          }));
        } catch (r2Err) {
          console.warn(`[CleanUp] Could not delete R2 object ${r2Key}:`, r2Err.message);
        }
      }
    }
  }

  // 2. Cascade delete database records in safe order
  await prisma.$transaction(async (tx) => {
    // Delete submission proofs
    await tx.submissionProof.deleteMany({
      where: {
        assignment: {
          jobId: job.id,
        },
      },
    });

    // Delete task assignments
    await tx.taskAssignment.deleteMany({
      where: {
        jobId: job.id,
      },
    });

    // Delete job targets
    await tx.jobTarget.deleteMany({
      where: {
        jobId: job.id,
      },
    });

    // Delete job
    await tx.job.delete({
      where: {
        id: job.id,
      },
    });
  }, { timeout: 30000, maxWait: 15000 });

  console.log(`[CleanUp] Permanently deleted job ${job.id} ("${job.title}") and all associated files/proofs.`);
  return true;
}

/**
 * Find and permanently delete jobs whose retention period has passed.
 * Retention Rules:
 * A) Job completed/expired: kept for 7 days after completion/deadline.
 * B) Employer soft-deleted: kept for 7 days after deletion action.
 * C) Admin-paused: kept for 7 days after being paused.
 */
async function cleanupExpiredJobs() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find jobs matching deletion triggers:
    // 1. Explicit scheduledDeletionAt has passed
    // 2. Or completed/expired with estimatedCompletionAt / endAt older than 7 days
    const eligibleJobs = await prisma.job.findMany({
      where: {
        OR: [
          {
            scheduledDeletionAt: {
              lte: now,
            },
          },
          {
            deletedAt: {
              lte: sevenDaysAgo,
            },
          },
          {
            status: { in: ['COMPLETED', 'EXPIRED'] },
            estimatedCompletionAt: {
              lte: sevenDaysAgo,
            },
          },
          {
            status: { in: ['COMPLETED', 'EXPIRED'] },
            endAt: {
              lte: sevenDaysAgo,
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        scheduledDeletionAt: true,
        deletedAt: true,
        estimatedCompletionAt: true,
      },
    });

    if (eligibleJobs.length > 0) {
      console.log(`[CleanUp] Found ${eligibleJobs.length} job(s) past 7-day retention period. Cleaning up...`);
      for (const job of eligibleJobs) {
        try {
          await deleteJobPermanently(job.id);
        } catch (err) {
          console.error(`[CleanUp] Error permanently deleting job ${job.id}:`, err.message || err);
        }
      }
    }
  } catch (error) {
    console.error('Auto-cleanup error (expired job deletion):', error.message || error);
  }
}

module.exports = {
  cleanupExpiredProofs,
  cleanupExpiredJobs,
  deleteJobPermanently,
};
