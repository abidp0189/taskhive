const prisma = require('../utils/prisma');
const { success, paginated, notFound, badRequest, error, forbidden } = require('../utils/response');
const { asyncHandler } = require('../middleware/error.middleware');
const path = require('path');
const fs = require('fs');

/**
 * GET /api/tasks - Worker's task list
 */
const getMyTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    workerId: req.user.id,
    ...(status && { status }),
  };

  const [tasks, total] = await Promise.all([
    prisma.taskAssignment.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            id: true, title: true, rewardPerWorker: true,
            category: { select: { name: true, icon: true } },
          },
        },
        proofs: true,
      },
    }),
    prisma.taskAssignment.count({ where }),
  ]);

  return paginated(res, tasks, {
    page: parseInt(page), limit: parseInt(limit), total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/tasks/:id - Task detail
 */
const getTask = asyncHandler(async (req, res) => {
  const task = await prisma.taskAssignment.findUnique({
    where: { id: req.params.id },
    include: {
      job: {
        include: {
          category: { select: { name: true, icon: true } },
          targets: true,
        },
      },
      proofs: true,
    },
  });

  if (!task) return notFound(res, 'Task not found');
  if (task.workerId !== req.user.id && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
    return forbidden(res);
  }

  return success(res, task);
});

/**
 * POST /api/tasks/:id/submit - Worker submits proof
 */
const submitTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { proofs } = req.body; // array of { type, content }
  const files = req.files || [];

  const assignment = await prisma.taskAssignment.findUnique({
    where: { id },
    include: { job: true },
  });

  if (!assignment) return notFound(res, 'Task not found');
  if (assignment.workerId !== req.user.id) return forbidden(res);
  if (!['IN_PROGRESS', 'RESUBMIT_REQUIRED'].includes(assignment.status)) {
    return badRequest(res, `Cannot submit task in status: ${assignment.status}`);
  }

  // Check expiry
  if (assignment.expiresAt && new Date() > assignment.expiresAt) {
    await prisma.taskAssignment.update({ where: { id }, data: { status: 'EXPIRED' } });
    return badRequest(res, 'Task has expired');
  }

  // Check resubmit count
  if (assignment.status === 'RESUBMIT_REQUIRED') {
    const job = assignment.job;
    if (assignment.resubmitCount >= job.maxResubmissions) {
      return badRequest(res, `Maximum resubmissions (${job.maxResubmissions}) reached`);
    }
  }

  const proofData = [];

  // Text/URL proofs from body
  if (proofs && Array.isArray(proofs)) {
    for (const proof of proofs) {
      if (!proof.type || !proof.content) continue;
      proofData.push({
        assignmentId: id,
        type: proof.type,
        content: proof.content,
      });
    }
  }

  // File proofs from multer
  for (const file of files) {
    const isImage = file.mimetype.startsWith('image/');
    let fileUrl = `/uploads/proofs/${file.filename}`;
    try {
      if (isImage && fs.existsSync(file.path)) {
        const fileBuffer = fs.readFileSync(file.path);
        fileUrl = `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
      }
    } catch (e) {
      console.error('Failed to encode image to base64, using fallback path', e);
    }

    proofData.push({
      assignmentId: id,
      type: isImage ? 'IMAGE' : 'FILE',
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
  }

  if (proofData.length === 0) {
    return badRequest(res, 'At least one proof is required');
  }

  // Delete old proofs if resubmitting
  if (assignment.status === 'RESUBMIT_REQUIRED') {
    await prisma.submissionProof.deleteMany({ where: { assignmentId: id } });
  }

  await prisma.$transaction(async (tx) => {
    await tx.submissionProof.createMany({ data: proofData });
    await tx.taskAssignment.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        resubmitCount: assignment.status === 'RESUBMIT_REQUIRED'
          ? { increment: 1 }
          : assignment.resubmitCount,
      },
    });
  });

  // Notify employer
  await prisma.notification.create({
    data: {
      userId: assignment.job.employerId,
      type: 'SYSTEM',
      title: 'New Submission',
      message: `A worker submitted proof for your job "${assignment.job.title}"`,
      link: `/employer/jobs/${assignment.job.id}/submissions`,
    },
  });

  return success(res, {}, 'Proof submitted successfully. Awaiting review.');
});

/**
 * GET /api/employer/jobs/:id/submissions - Employer view submissions
 */
const getSubmissions = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return notFound(res, 'Job not found');
  if (job.employerId !== req.user.id && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
    return forbidden(res);
  }

  const where = {
    jobId,
    ...(status && { status }),
    ...(!status && { status: { in: ['SUBMITTED', 'APPROVED', 'REJECTED', 'RESUBMIT_REQUIRED'] } }),
  };

  const [submissions, total] = await Promise.all([
    prisma.taskAssignment.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { submittedAt: 'desc' },
      include: {
        worker: { select: { id: true, name: true, avatarUrl: true, country: { select: { name: true, code: true } } } },
        proofs: true,
      },
    }),
    prisma.taskAssignment.count({ where }),
  ]);

  return paginated(res, submissions, {
    page: parseInt(page), limit: parseInt(limit), total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * POST /api/submissions/:id/approve - Employer approves submission (ATOMIC)
 */
const approveSubmission = asyncHandler(async (req, res) => {
  const { id: assignmentId } = req.params;

  const result = await prisma.$transaction(async (tx) => {
    const assignment = await tx.taskAssignment.findUnique({
      where: { id: assignmentId },
      include: { job: true, worker: { include: { wallet: true } } },
    });

    if (!assignment) throw Object.assign(new Error('Submission not found'), { statusCode: 404 });

    const job = assignment.job;
    if (job.employerId !== req.user.id && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
      throw Object.assign(new Error('Access denied'), { statusCode: 403 });
    }

    if (assignment.status !== 'SUBMITTED') {
      throw Object.assign(new Error(`Cannot approve submission in status: ${assignment.status}`), { statusCode: 400 });
    }

    // Idempotency: already approved
    if (assignment.status === 'APPROVED') {
      throw Object.assign(new Error('Submission already approved'), { statusCode: 409 });
    }

    const rewardAmount = parseFloat(assignment.rewardAmount);

    // Update assignment
    await tx.taskAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewerId: req.user.id,
      },
    });

    // Update job counters
    await tx.job.update({
      where: { id: job.id },
      data: { approvedWorkers: { increment: 1 } },
    });

    // Debit employer locked balance
    const employerWallet = await tx.wallet.findUnique({ where: { userId: job.employerId } });
    await tx.wallet.update({
      where: { userId: job.employerId },
      data: { lockedBalance: { decrement: rewardAmount } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: employerWallet.id,
        type: 'JOB_BUDGET_SPEND',
        amount: rewardAmount,
        direction: 'DEBIT',
        referenceType: 'TaskAssignment',
        referenceId: assignmentId,
        description: `Reward paid for approved task on job: ${job.title}`,
        balanceAfter: parseFloat(employerWallet.lockedBalance) - rewardAmount,
      },
    });

    // Credit worker available balance
    const workerWallet = assignment.worker.wallet;
    await tx.wallet.update({
      where: { userId: assignment.workerId },
      data: { availableBalance: { increment: rewardAmount } },
    });
    const updatedWorkerWallet = await tx.wallet.findUnique({ where: { userId: assignment.workerId } });
    await tx.walletTransaction.create({
      data: {
        walletId: workerWallet.id,
        type: 'TASK_REWARD',
        amount: rewardAmount,
        direction: 'CREDIT',
        referenceType: 'TaskAssignment',
        referenceId: assignmentId,
        description: `Reward for approved task: ${job.title}`,
        balanceAfter: updatedWorkerWallet.availableBalance,
      },
    });

    // Referral commission
    const referral = await tx.referral.findFirst({ where: { referredUserId: assignment.workerId } });
    if (referral) {
      const commissionSetting = await tx.platformSetting.findUnique({ where: { key: 'referral_task_commission_percent' } });
      const commissionRate = parseFloat(commissionSetting?.value || '5') / 100;
      const commissionAmount = rewardAmount * commissionRate;

      if (commissionAmount > 0) {
        const referrerWallet = await tx.wallet.findUnique({ where: { userId: referral.referrerId } });
        if (referrerWallet) {
          await tx.wallet.update({
            where: { userId: referral.referrerId },
            data: { availableBalance: { increment: commissionAmount } },
          });
          const updatedRefWallet = await tx.wallet.findUnique({ where: { userId: referral.referrerId } });
          const walletTx = await tx.walletTransaction.create({
            data: {
              walletId: referrerWallet.id,
              type: 'REFERRAL_COMMISSION',
              amount: commissionAmount,
              direction: 'CREDIT',
              referenceType: 'ReferralCommission',
              referenceId: referral.id,
              description: `Referral commission from task approval`,
              balanceAfter: updatedRefWallet.availableBalance,
            },
          });
          await tx.referralCommission.create({
            data: {
              referralId: referral.id,
              sourceType: 'TASK',
              sourceAmount: rewardAmount,
              commissionRate,
              commissionAmount,
              walletTransactionId: walletTx.id,
            },
          });
          // Notify referrer
          await tx.notification.create({
            data: {
              userId: referral.referrerId,
              type: 'REFERRAL_COMMISSION',
              title: 'Referral Commission Earned',
              message: `You earned $${commissionAmount.toFixed(2)} referral commission`,
              link: '/referral',
            },
          });
        }
      }
    }

    // Notify worker
    await tx.notification.create({
      data: {
        userId: assignment.workerId,
        type: 'TASK_APPROVED',
        title: 'Task Approved!',
        message: `Your submission for "${job.title}" was approved. $${rewardAmount.toFixed(2)} added to your balance.`,
        link: `/my-tasks/${assignmentId}`,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'SUBMISSION_APPROVED',
        entityType: 'TaskAssignment',
        entityId: assignmentId,
        newValue: JSON.stringify({ status: 'APPROVED', reward: rewardAmount }),
      },
    });

    return { assignmentId, rewardAmount };
  });

  return success(res, result, 'Submission approved and reward credited to worker');
});

/**
 * POST /api/submissions/:id/reject - Reject submission
 */
const rejectSubmission = asyncHandler(async (req, res) => {
  const { id: assignmentId } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return badRequest(res, 'Rejection reason is required');
  }

  const assignment = await prisma.taskAssignment.findUnique({
    where: { id: assignmentId },
    include: { job: true },
  });

  if (!assignment) return notFound(res, 'Submission not found');
  if (assignment.job.employerId !== req.user.id && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
    return forbidden(res);
  }
  if (assignment.status !== 'SUBMITTED') {
    return badRequest(res, `Cannot reject in status: ${assignment.status}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.taskAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewerId: req.user.id,
        rejectionReason: reason.trim(),
      },
    });

    await tx.job.update({
      where: { id: assignment.job.id },
      data: {
        rejectedWorkers: { increment: 1 },
        completedWorkers: { decrement: 1 }, // free up the slot
      },
    });

    await tx.notification.create({
      data: {
        userId: assignment.workerId,
        type: 'TASK_REJECTED',
        title: 'Task Rejected',
        message: `Your submission for "${assignment.job.title}" was rejected. Reason: ${reason}`,
        link: `/my-tasks/${assignmentId}`,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'SUBMISSION_REJECTED',
        entityType: 'TaskAssignment',
        entityId: assignmentId,
        newValue: JSON.stringify({ status: 'REJECTED', reason }),
      },
    });
  });

  return success(res, {}, 'Submission rejected');
});

/**
 * POST /api/submissions/:id/resubmit-request
 */
const requestResubmit = asyncHandler(async (req, res) => {
  const { id: assignmentId } = req.params;
  const { reason } = req.body;

  const assignment = await prisma.taskAssignment.findUnique({
    where: { id: assignmentId },
    include: { job: true },
  });

  if (!assignment) return notFound(res, 'Submission not found');
  if (assignment.job.employerId !== req.user.id && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
    return forbidden(res);
  }
  if (assignment.status !== 'SUBMITTED') {
    return badRequest(res, `Cannot request resubmission in status: ${assignment.status}`);
  }

  if (assignment.resubmitCount >= assignment.job.maxResubmissions) {
    return badRequest(res, 'Maximum resubmissions already reached');
  }

  await prisma.taskAssignment.update({
    where: { id: assignmentId },
    data: {
      status: 'RESUBMIT_REQUIRED',
      reviewedAt: new Date(),
      reviewerId: req.user.id,
      rejectionReason: reason || 'Resubmission required',
    },
  });

  await prisma.notification.create({
    data: {
      userId: assignment.workerId,
      type: 'TASK_RESUBMIT',
      title: 'Resubmission Required',
      message: `Your submission for "${assignment.job.title}" needs to be resubmitted. Reason: ${reason || 'Please review and resubmit'}`,
      link: `/my-tasks/${assignmentId}`,
    },
  });

  return success(res, {}, 'Resubmission requested');
});

module.exports = {
  getMyTasks, getTask, submitTask,
  getSubmissions, approveSubmission, rejectSubmission, requestResubmit,
};
