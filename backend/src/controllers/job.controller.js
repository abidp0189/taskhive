const prisma = require('../utils/prisma');
const { success, created, paginated, notFound, badRequest, error, forbidden } = require('../utils/response');
const { asyncHandler } = require('../middleware/error.middleware');

const PAGE_SIZE = 20;

/**
 * GET /api/jobs - Browse active jobs (workers)
 */
const getJobs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = PAGE_SIZE,
    search,
    categoryId,
    subcategoryId,
    minReward,
    maxReward,
    sort = 'newest',
    pinned,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const now = new Date();

  const where = {
    status: 'ACTIVE',
    OR: [
      { scheduledAt: null },
      { scheduledAt: { lte: now } },
    ],
    ...(search && {
      AND: [
        {
          OR: [
            { title: { contains: search } },
            { shortDescription: { contains: search } },
          ],
        },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(subcategoryId && { subcategoryId }),
    ...(minReward && { rewardPerWorker: { gte: parseFloat(minReward) } }),
    ...(maxReward && { rewardPerWorker: { lte: parseFloat(maxReward) } }),
    ...(pinned === 'true' && { visibility: 'PINNED' }),
  };

  const orderBy =
    sort === 'reward_high' ? [{ rewardPerWorker: 'desc' }]
    : sort === 'reward_low' ? [{ rewardPerWorker: 'asc' }]
    : sort === 'oldest' ? [{ createdAt: 'asc' }]
    : [{ priority: 'desc' }, { createdAt: 'desc' }];

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy,
      select: {
        id: true,
        title: true,
        shortDescription: true,
        rewardPerWorker: true,
        totalWorkers: true,
        completedWorkers: true,
        approvedWorkers: true,
        proofTypes: true,
        visibility: true,
        status: true,
        endAt: true,
        createdAt: true,
        category: { select: { id: true, name: true, icon: true } },
        subcategory: { select: { id: true, name: true } },
        targets: { select: { targetType: true, countryCode: true, regionCode: true } },
        employer: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  // Mark jobs the current user has already taken
  let userAssignments = {};
  if (req.user) {
    const assignments = await prisma.taskAssignment.findMany({
      where: {
        workerId: req.user.id,
        jobId: { in: jobs.map((j) => j.id) },
      },
      select: { jobId: true, status: true },
    });
    assignments.forEach((a) => { userAssignments[a.jobId] = a.status; });
  }

  const enriched = jobs.map((job) => ({
    ...job,
    availableSlots: job.totalWorkers - job.completedWorkers,
    userAssignmentStatus: userAssignments[job.id] || null,
  }));

  return paginated(res, enriched, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/jobs/:id - Job details
 */
const getJob = asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      category: { select: { id: true, name: true, icon: true } },
      subcategory: { select: { id: true, name: true } },
      targets: true,
      employer: { select: { id: true, name: true, avatarUrl: true, createdAt: true } },
    },
  });

  if (!job) return notFound(res, 'Job not found');

  // Don't expose full instructions to non-authenticated users or employers
  let jobData = { ...job };

  if (!req.user || req.user.role === 'EMPLOYER') {
    delete jobData.instructions;
    delete jobData.proofRequirements;
  }

  // Check user's assignment for this job
  if (req.user) {
    const assignment = await prisma.taskAssignment.findFirst({
      where: { jobId: job.id, workerId: req.user.id },
      select: { id: true, status: true },
    });
    jobData.userAssignment = assignment || null;
  }

  return success(res, { ...jobData, availableSlots: job.totalWorkers - job.completedWorkers });
});

/**
 * POST /api/jobs/:id/start - Worker starts/reserves a job
 */
const startJob = asyncHandler(async (req, res) => {
  const jobId = req.params.id;
  const workerId = req.user.id;

  const result = await prisma.$transaction(async (tx) => {
    // Lock the job row
    const job = await tx.job.findUnique({ where: { id: jobId } });
    if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
    if (job.status !== 'ACTIVE') throw Object.assign(new Error('Job is not active'), { statusCode: 400 });

    const availableSlots = job.totalWorkers - job.completedWorkers;
    if (availableSlots <= 0) throw Object.assign(new Error('No slots available for this job'), { statusCode: 409 });

    // Check if already assigned
    const existing = await tx.taskAssignment.findFirst({
      where: { jobId, workerId },
    });
    if (existing) throw Object.assign(new Error('You have already started or completed this job'), { statusCode: 409 });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (job.taskExpiryHours || 48));

    const assignment = await tx.taskAssignment.create({
      data: {
        jobId,
        workerId,
        status: 'IN_PROGRESS',
        rewardAmount: job.rewardPerWorker,
        expiresAt,
      },
    });

    // Increment completedWorkers (reserved)
    await tx.job.update({
      where: { id: jobId },
      data: { completedWorkers: { increment: 1 } },
    });

    return assignment;
  });

  return created(res, result, 'Task started. Complete and submit your proof.');
});

/**
 * POST /api/jobs - Employer creates a job
 */
const createJob = asyncHandler(async (req, res) => {
  const {
    categoryId, subcategoryId, title, shortDescription,
    instructions, proofRequirements, proofTypes = 'TEXT,IMAGE',
    requiresScreenshot = false, targetUrl, rewardPerWorker, totalWorkers,
    targets = [{ targetType: 'GLOBAL' }],
    scheduledAt, estimatedDays = 3, boostDuration = 0,
    taskExpiryHours = 48, maxResubmissions = 3,
    visibility = 'NORMAL',
  } = req.body;

  if (!categoryId || !title || !instructions || !proofRequirements || !rewardPerWorker || !totalWorkers) {
    return badRequest(res, 'Required fields: categoryId, title, instructions, proofRequirements, rewardPerWorker, totalWorkers');
  }

  const employerId = req.user.id;
  const reward = parseFloat(rewardPerWorker);
  const workers = parseInt(totalWorkers);

  if (isNaN(reward) || reward <= 0) return badRequest(res, 'Invalid reward per worker');
  if (isNaN(workers) || workers <= 0) return badRequest(res, 'Invalid worker quantity');

  // Base worker budget
  const baseWorkerBudget = reward * workers;

  // Validate minimum budget ($0.80)
  const minBudgetSetting = await prisma.platformSetting.findUnique({ where: { key: 'min_job_budget' } });
  const minBudget = parseFloat(minBudgetSetting?.value || '0.80');
  if (baseWorkerBudget < minBudget) {
    return badRequest(res, `Minimum base job budget is $${minBudget.toFixed(2)}. Your base budget is $${baseWorkerBudget.toFixed(2)} (${workers} workers × $${reward.toFixed(3)})`);
  }

  // Platform fee (default 10%)
  const feeSetting = await prisma.platformSetting.findUnique({ where: { key: 'platform_fee_percent' } });
  const platformFeePercent = parseFloat(feeSetting?.value || '10');
  const platformFeeAmount = baseWorkerBudget * (platformFeePercent / 100);

  // Screenshot fee (default 3% when screenshot proof required)
  const hasScreenshot = requiresScreenshot || (proofTypes && proofTypes.includes('IMAGE'));
  const screenshotFeeSetting = await prisma.platformSetting.findUnique({ where: { key: 'screenshot_fee_percent' } });
  const screenshotFeePercent = hasScreenshot ? parseFloat(screenshotFeeSetting?.value || '3') : 0;
  const screenshotFeeAmount = hasScreenshot ? baseWorkerBudget * (screenshotFeePercent / 100) : 0;

  // Boost pricing (1m = $0.04, 5m = $0.07, 10m = $0.15, 15m = $0.20)
  const boostMap = { 1: 0.04, 5: 0.07, 10: 0.15, 15: 0.20 };
  const requestedBoost = parseInt(boostDuration) || 0;
  let boostCost = 0;
  if (requestedBoost > 0) {
    const boostKey = `boost_${requestedBoost}m_price`;
    const boostSetting = await prisma.platformSetting.findUnique({ where: { key: boostKey } });
    boostCost = boostSetting ? parseFloat(boostSetting.value) : (boostMap[requestedBoost] || 0);
  }

  // Total Employer Charge
  const totalCharge = baseWorkerBudget + platformFeeAmount + screenshotFeeAmount + boostCost;

  // Check employer deposit balance
  const wallet = await prisma.wallet.findUnique({ where: { userId: employerId } });
  if (!wallet || parseFloat(wallet.depositBalance) < totalCharge) {
    return badRequest(res, `Insufficient deposit balance. Required: $${totalCharge.toFixed(2)}, Available: $${parseFloat(wallet?.depositBalance || 0).toFixed(2)}`);
  }

  // Calculate timing & scheduling
  const numEstimatedDays = parseInt(estimatedDays) || 3;
  const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
  const jobScheduledAt = isScheduled ? new Date(scheduledAt) : null;
  const startTime = jobScheduledAt || new Date();
  const estimatedCompletionAt = new Date(startTime.getTime() + numEstimatedDays * 24 * 60 * 60 * 1000);

  // Boost start & expiry
  let boostStartedAt = null;
  let boostExpiresAt = null;
  if (requestedBoost > 0) {
    boostStartedAt = startTime;
    boostExpiresAt = new Date(startTime.getTime() + requestedBoost * 60 * 1000);
  }

  const job = await prisma.$transaction(async (tx) => {
    const newJob = await tx.job.create({
      data: {
        employerId,
        categoryId,
        subcategoryId: subcategoryId || null,
        title: title.trim(),
        shortDescription: shortDescription?.trim() || null,
        instructions: instructions.trim(),
        proofRequirements: proofRequirements.trim(),
        proofTypes,
        requiresScreenshot: hasScreenshot,
        targetUrl: targetUrl || null,
        rewardPerWorker: reward,
        totalWorkers: workers,
        // Financial snapshots
        baseWorkerBudget,
        platformFeePercent,
        platformFeeAmount,
        screenshotFeePercent,
        screenshotFeeAmount,
        boostDuration: requestedBoost > 0 ? requestedBoost : null,
        boostCost,
        totalCharge,
        platformFee: platformFeeAmount + screenshotFeeAmount,
        // Boost tracking
        boostStartedAt,
        boostExpiresAt,
        priority: requestedBoost > 0 ? 100 : 0,
        // Scheduling
        estimatedDays: numEstimatedDays,
        scheduledAt: jobScheduledAt,
        estimatedCompletionAt,
        publishedAt: isScheduled ? null : new Date(),
        status: isScheduled ? 'SCHEDULED' : 'PENDING_REVIEW',
        visibility,
        taskExpiryHours: parseInt(taskExpiryHours),
        maxResubmissions: parseInt(maxResubmissions),
      },
    });

    // Create targets
    if (targets && targets.length > 0) {
      await tx.jobTarget.createMany({
        data: targets.map((t) => ({
          jobId: newJob.id,
          targetType: t.targetType || 'GLOBAL',
          regionCode: t.regionCode || null,
          countryCode: t.countryCode || null,
          countryId: t.countryId || null,
        })),
      });
    }

    // Lock employer budget
    await tx.wallet.update({
      where: { userId: employerId },
      data: {
        depositBalance: { decrement: totalCharge },
        lockedBalance: { increment: totalCharge },
      },
    });

    // Create wallet transaction record
    const updatedWallet = await tx.wallet.findUnique({ where: { userId: employerId } });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'JOB_BUDGET_LOCK',
        amount: totalCharge,
        direction: 'DEBIT',
        referenceType: 'Job',
        referenceId: newJob.id,
        description: `Budget locked for job: ${title} (Base: $${baseWorkerBudget.toFixed(2)}, Platform: $${platformFeeAmount.toFixed(2)}, Screenshot: $${screenshotFeeAmount.toFixed(2)}, Boost: $${boostCost.toFixed(2)})`,
        balanceAfter: updatedWallet.depositBalance,
      },
    });

    return newJob;
  });

  return created(res, job, isScheduled ? 'Job campaign scheduled successfully' : 'Job campaign created and submitted for review');
});

/**
 * PATCH /api/jobs/:id - Update draft job
 */
const updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return notFound(res);
  if (job.employerId !== req.user.id && req.user.role !== 'ADMIN') return forbidden(res);
  if (job.status !== 'DRAFT' && req.user.role !== 'ADMIN') {
    return badRequest(res, 'Only draft jobs can be edited');
  }

  const { title, shortDescription, instructions, proofRequirements, proofTypes, targetUrl } = req.body;
  const updated = await prisma.job.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(shortDescription !== undefined && { shortDescription }),
      ...(instructions && { instructions }),
      ...(proofRequirements && { proofRequirements }),
      ...(proofTypes && { proofTypes }),
      ...(targetUrl !== undefined && { targetUrl }),
    },
  });

  return success(res, updated, 'Job updated');
});

/**
 * POST /api/jobs/:id/pause|resume|cancel
 */
const changeJobStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const action = req.path.split('/').pop();

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return notFound(res);
  if (job.employerId !== req.user.id && req.user.role !== 'ADMIN') return forbidden(res);

  const statusMap = { pause: 'PAUSED', resume: 'ACTIVE', cancel: 'CANCELLED' };
  const newStatus = statusMap[action];
  if (!newStatus) return badRequest(res, 'Invalid action');

  await prisma.job.update({ where: { id }, data: { status: newStatus } });

  // If cancelled, release locked budget back to deposit
  if (action === 'cancel') {
    const wallet = await prisma.wallet.findUnique({ where: { userId: job.employerId } });
    const remainingSlots = job.totalWorkers - job.approvedWorkers;
    const refundAmount = parseFloat(job.rewardPerWorker) * remainingSlots + parseFloat(job.platformFee);

    if (refundAmount > 0 && wallet) {
      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { userId: job.employerId },
          data: {
            lockedBalance: { decrement: refundAmount },
            depositBalance: { increment: refundAmount },
          },
        });
        const updatedWallet = await tx.wallet.findUnique({ where: { userId: job.employerId } });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'JOB_BUDGET_RELEASE',
            amount: refundAmount,
            direction: 'CREDIT',
            referenceType: 'Job',
            referenceId: job.id,
            description: `Budget released for cancelled job: ${job.title}`,
            balanceAfter: updatedWallet.depositBalance,
          },
        });
      });
    }
  }

  return success(res, {}, `Job ${action}d successfully`);
});

/**
 * GET /api/employer/jobs - Employer's own jobs
 */
const getEmployerJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = PAGE_SIZE, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    employerId: req.user.id,
    ...(status && { status }),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
        targets: true,
        _count: { select: { assignments: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return paginated(res, jobs, {
    page: parseInt(page), limit: parseInt(limit), total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

module.exports = { getJobs, getJob, startJob, createJob, updateJob, changeJobStatus, getEmployerJobs };
