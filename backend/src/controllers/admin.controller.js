const prisma = require('../utils/prisma');
const { success, paginated, notFound, badRequest, error, forbidden } = require('../utils/response');
const { asyncHandler } = require('../middleware/error.middleware');

// ─── Dashboard ───────────────────────────────────

const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers, activeUsers, totalJobs, activeJobs,
    pendingSubmissions, pendingWithdrawals, pendingDeposits,
    totalDepositsAgg, totalPayoutsAgg,
    jobRevenueAgg, withdrawalFeeAgg, fraudCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.job.count(),
    prisma.job.count({ where: { status: 'ACTIVE' } }),
    prisma.taskAssignment.count({ where: { status: 'SUBMITTED' } }),
    prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
    prisma.deposit.count({ where: { status: 'PENDING' } }),
    prisma.deposit.aggregate({ where: { status: 'CONFIRMED' }, _sum: { amount: true } }),
    prisma.walletTransaction.aggregate({ where: { type: 'TASK_REWARD' }, _sum: { amount: true } }),
    prisma.job.aggregate({
      where: { status: { in: ['ACTIVE', 'COMPLETED', 'PAUSED'] } },
      _sum: {
        platformFeeAmount: true,
        screenshotFeeAmount: true,
        boostCost: true,
      },
    }),
    prisma.withdrawalRequest.aggregate({ where: { status: 'PAID' }, _sum: { fee: true } }),
    prisma.fraudFlag.count({ where: { status: 'OPEN' } }),
  ]);

  const platformFeeRevenue = parseFloat(jobRevenueAgg._sum.platformFeeAmount || 0);
  const screenshotFeeRevenue = parseFloat(jobRevenueAgg._sum.screenshotFeeAmount || 0);
  const boostRevenue = parseFloat(jobRevenueAgg._sum.boostCost || 0);
  const withdrawalFeeRevenue = parseFloat(withdrawalFeeAgg._sum.fee || 0);
  const totalPlatformRevenue = platformFeeRevenue + screenshotFeeRevenue + boostRevenue + withdrawalFeeRevenue;

  return success(res, {
    totalUsers, activeUsers, totalJobs, activeJobs,
    pendingSubmissions, pendingWithdrawals, pendingDeposits,
    totalDeposits: parseFloat(totalDepositsAgg._sum.amount || 0),
    totalPayouts: parseFloat(totalPayoutsAgg._sum.amount || 0),
    totalPlatformRevenue,
    platformFeeRevenue,
    screenshotFeeRevenue,
    boostRevenue,
    withdrawalFeeRevenue,
    fraudAlerts: fraudCount,
  });
});

// ─── User Management ─────────────────────────────

const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ],
    }),
    ...(role && { role }),
    ...(status && { status }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true, status: true,
        createdAt: true, lastLoginAt: true, avatarUrl: true,
        country: { select: { name: true, code: true } },
        wallet: {
          select: { availableBalance: true, depositBalance: true, lockedBalance: true }
        },
        _count: { select: { taskAssignments: true, jobs: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return paginated(res, users, {
    page: parseInt(page), limit: parseInt(limit), total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      wallet: true,
      country: true,
      _count: { select: { taskAssignments: true, jobs: true, withdrawals: true } },
    },
  });
  if (!user) return notFound(res);
  // Remove password
  const { passwordHash, ...safeUser } = user;
  return success(res, safeUser);
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const validStatuses = ['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION'];
  if (!validStatuses.includes(status)) return badRequest(res, 'Invalid status');

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: req.params.id }, data: { status } });
    await tx.auditLog.create({
      data: {
        actorId: req.user.id,
        action: `USER_STATUS_${status}`,
        entityType: 'User',
        entityId: req.params.id,
        newValue: JSON.stringify({ status, reason }),
      },
    });
    // Notify user
    const notifType = status === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : status === 'ACTIVE' ? 'ACCOUNT_ACTIVATED' : 'SYSTEM';
    await tx.notification.create({
      data: {
        userId: req.params.id,
        type: notifType,
        title: `Account ${status.toLowerCase()}`,
        message: reason || `Your account status has been updated to ${status}`,
      },
    });
  });

  return success(res, {}, `User status updated to ${status}`);
});

const adjustBalance = asyncHandler(async (req, res) => {
  const { amount, type, reason } = req.body; // type: 'deposit' | 'available'
  if (!amount || !reason) return badRequest(res, 'Amount and reason are required');

  const wallet = await prisma.wallet.findUnique({ where: { userId: req.params.id } });
  if (!wallet) return notFound(res, 'Wallet not found');

  const adjustAmount = parseFloat(amount);
  const isCredit = adjustAmount > 0;
  const absAmount = Math.abs(adjustAmount);

  await prisma.$transaction(async (tx) => {
    const field = type === 'deposit' ? 'depositBalance' : 'availableBalance';
    const currentBalance = parseFloat(wallet[field]);
    if (!isCredit && currentBalance < absAmount) {
      throw Object.assign(new Error('Insufficient balance for deduction'), { statusCode: 400 });
    }

    await tx.wallet.update({
      where: { userId: req.params.id },
      data: { [field]: { increment: adjustAmount } },
    });

    const updatedWallet = await tx.wallet.findUnique({ where: { userId: req.params.id } });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'ADMIN_ADJUSTMENT',
        amount: absAmount,
        direction: isCredit ? 'CREDIT' : 'DEBIT',
        description: `Admin adjustment: ${reason}`,
        balanceAfter: updatedWallet[field],
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'ADMIN_BALANCE_ADJUSTMENT',
        entityType: 'Wallet',
        entityId: wallet.id,
        oldValue: JSON.stringify({ [field]: currentBalance }),
        newValue: JSON.stringify({ [field]: parseFloat(updatedWallet[field]), reason }),
      },
    });
  });

  return success(res, {}, 'Balance adjusted');
});

// ─── Job Management ──────────────────────────────

const getAdminJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(status && { status }),
    ...(search && { title: { contains: search } }),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      include: {
        employer: { select: { id: true, name: true, email: true } },
        category: { select: { name: true } },
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

const updateJobStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) return notFound(res);

  await prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: { id: req.params.id },
      data: { status, ...(reason && { rejectionReason: reason }) },
    });
    await tx.auditLog.create({
      data: {
        actorId: req.user.id,
        action: `JOB_STATUS_${status}`,
        entityType: 'Job',
        entityId: req.params.id,
        newValue: JSON.stringify({ status, reason }),
      },
    });
    // Notify employer
    await tx.notification.create({
      data: {
        userId: job.employerId,
        type: status === 'ACTIVE' ? 'SYSTEM' : 'JOB_REJECTED',
        title: `Job ${status === 'ACTIVE' ? 'Approved' : status}`,
        message: `Your job "${job.title}" status changed to ${status}${reason ? `. Reason: ${reason}` : ''}`,
        link: `/employer/jobs/${job.id}`,
      },
    });
  });

  return success(res, {}, `Job status updated to ${status}`);
});

// ─── Withdrawal Management ───────────────────────

const getWithdrawals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { ...(status && { status }) };

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where, skip, take: parseInt(limit), orderBy: { requestedAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.withdrawalRequest.count({ where }),
  ]);

  return paginated(res, withdrawals, {
    page: parseInt(page), limit: parseInt(limit), total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

const processWithdrawal = asyncHandler(async (req, res) => {
  const { action, externalReference, reason } = req.body; // action: 'approve' | 'reject'
  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id: req.params.id },
    include: { user: { include: { wallet: true } } },
  });

  if (!withdrawal) return notFound(res, 'Withdrawal not found');
  if (!['PENDING', 'PROCESSING'].includes(withdrawal.status)) {
    return badRequest(res, 'Withdrawal cannot be processed in its current state');
  }

  await prisma.$transaction(async (tx) => {
    if (action === 'approve') {
      await tx.withdrawalRequest.update({
        where: { id: withdrawal.id },
        data: {
          status: 'PAID',
          processedByAdminId: req.user.id,
          processedAt: new Date(),
          externalReference: externalReference || null,
        },
      });
      // Deduct from locked balance
      const wallet = withdrawal.user.wallet;
      await tx.wallet.update({
        where: { userId: withdrawal.userId },
        data: { lockedBalance: { decrement: parseFloat(withdrawal.amount) } },
      });
      const updatedWallet = await tx.wallet.findUnique({ where: { userId: withdrawal.userId } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL_APPROVED',
          amount: parseFloat(withdrawal.netAmount),
          direction: 'DEBIT',
          referenceType: 'WithdrawalRequest',
          referenceId: withdrawal.id,
          description: `Withdrawal paid via ${withdrawal.method}`,
          balanceAfter: updatedWallet.lockedBalance,
        },
      });
      await tx.notification.create({
        data: {
          userId: withdrawal.userId,
          type: 'WITHDRAWAL_APPROVED',
          title: 'Withdrawal Approved',
          message: `Your withdrawal of $${parseFloat(withdrawal.netAmount).toFixed(2)} has been processed.`,
          link: '/withdraw/history',
        },
      });
    } else if (action === 'reject') {
      await tx.withdrawalRequest.update({
        where: { id: withdrawal.id },
        data: {
          status: 'REJECTED',
          processedByAdminId: req.user.id,
          processedAt: new Date(),
          rejectionReason: reason,
        },
      });
      // Return funds to available balance
      const wallet = withdrawal.user.wallet;
      await tx.wallet.update({
        where: { userId: withdrawal.userId },
        data: {
          lockedBalance: { decrement: parseFloat(withdrawal.amount) },
          availableBalance: { increment: parseFloat(withdrawal.amount) },
        },
      });
      const updatedWallet = await tx.wallet.findUnique({ where: { userId: withdrawal.userId } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL_REJECTED',
          amount: parseFloat(withdrawal.amount),
          direction: 'CREDIT',
          referenceType: 'WithdrawalRequest',
          referenceId: withdrawal.id,
          description: `Withdrawal rejected: ${reason}`,
          balanceAfter: updatedWallet.availableBalance,
        },
      });
      await tx.notification.create({
        data: {
          userId: withdrawal.userId,
          type: 'WITHDRAWAL_REJECTED',
          title: 'Withdrawal Rejected',
          message: `Your withdrawal request was rejected. Reason: ${reason}. Funds have been returned.`,
          link: '/withdraw/history',
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: req.user.id,
        action: `WITHDRAWAL_${action.toUpperCase()}`,
        entityType: 'WithdrawalRequest',
        entityId: withdrawal.id,
        newValue: JSON.stringify({ action, externalReference, reason }),
      },
    });
  });

  return success(res, {}, `Withdrawal ${action}d successfully`);
});

// ─── Deposits Management ─────────────────────────

const getDeposits = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { ...(status && { status }) };

  const [deposits, total] = await Promise.all([
    prisma.deposit.findMany({
      where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.deposit.count({ where }),
  ]);

  return paginated(res, deposits, {
    page: parseInt(page), limit: parseInt(limit), total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

const confirmDeposit = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const deposit = await prisma.deposit.findUnique({
    where: { id: req.params.id },
    include: { user: { include: { wallet: true } } },
  });
  if (!deposit) return notFound(res);
  if (deposit.status !== 'PENDING') return badRequest(res, 'Deposit already processed');

  await prisma.$transaction(async (tx) => {
    await tx.deposit.update({
      where: { id: deposit.id },
      data: {
        status: 'CONFIRMED',
        confirmedByAdminId: req.user.id,
        confirmedAt: new Date(),
        notes: notes || null,
      },
    });

    const wallet = deposit.user.wallet;
    await tx.wallet.update({
      where: { userId: deposit.userId },
      data: { depositBalance: { increment: parseFloat(deposit.amount) } },
    });
    const updatedWallet = await tx.wallet.findUnique({ where: { userId: deposit.userId } });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: parseFloat(deposit.amount),
        direction: 'CREDIT',
        referenceType: 'Deposit',
        referenceId: deposit.id,
        description: `Deposit confirmed via ${deposit.paymentMethod}`,
        balanceAfter: updatedWallet.depositBalance,
      },
    });

    // Check referral commission on deposit
    const referral = await tx.referral.findFirst({ where: { referredUserId: deposit.userId } });
    if (referral) {
      const commSetting = await tx.platformSetting.findUnique({ where: { key: 'referral_deposit_commission_percent' } });
      const commRate = parseFloat(commSetting?.value || '5') / 100;
      const commAmount = parseFloat(deposit.amount) * commRate;
      if (commAmount > 0) {
        const refWallet = await tx.wallet.findUnique({ where: { userId: referral.referrerId } });
        if (refWallet) {
          await tx.wallet.update({
            where: { userId: referral.referrerId },
            data: { availableBalance: { increment: commAmount } },
          });
          const updatedRefWallet = await tx.wallet.findUnique({ where: { userId: referral.referrerId } });
          const wt = await tx.walletTransaction.create({
            data: {
              walletId: refWallet.id,
              type: 'REFERRAL_COMMISSION',
              amount: commAmount,
              direction: 'CREDIT',
              referenceType: 'Deposit',
              referenceId: deposit.id,
              description: `Referral commission from deposit`,
              balanceAfter: updatedRefWallet.availableBalance,
            },
          });
          await tx.referralCommission.create({
            data: {
              referralId: referral.id,
              sourceType: 'DEPOSIT',
              sourceAmount: parseFloat(deposit.amount),
              commissionRate: commRate,
              commissionAmount: commAmount,
              walletTransactionId: wt.id,
            },
          });
        }
      }
    }

    await tx.notification.create({
      data: {
        userId: deposit.userId,
        type: 'DEPOSIT_CONFIRMED',
        title: 'Deposit Confirmed',
        message: `Your deposit of $${parseFloat(deposit.amount).toFixed(2)} has been confirmed.`,
        link: '/wallet',
      },
    });
  });

  return success(res, {}, 'Deposit confirmed and balance credited');
});

const rejectDeposit = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const deposit = await prisma.deposit.findUnique({
    where: { id: req.params.id },
  });
  if (!deposit) return notFound(res, 'Deposit not found');
  if (deposit.status !== 'PENDING') return badRequest(res, 'Deposit already processed');

  await prisma.$transaction(async (tx) => {
    await tx.deposit.update({
      where: { id: deposit.id },
      data: {
        status: 'FAILED',
        rejectedByAdminId: req.user.id,
        rejectedAt: new Date(),
        rejectionReason: reason || 'Deposit request rejected by administrator',
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'DEPOSIT_REJECTED',
        entityType: 'Deposit',
        entityId: deposit.id,
        newValue: JSON.stringify({ reason }),
      },
    });

    await tx.notification.create({
      data: {
        userId: deposit.userId,
        type: 'DEPOSIT_REJECTED',
        title: 'Deposit Rejected',
        message: `Your deposit of $${parseFloat(deposit.amount).toFixed(2)} was rejected. Reason: ${reason || 'Transaction could not be verified'}`,
        link: '/wallet',
      },
    });
  });

  return success(res, {}, 'Deposit rejected');
});

// ─── Categories & Subcategories Management ───────

const getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    include: {
      subcategories: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
  return success(res, categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, description, icon, sortOrder = 0 } = req.body;
  if (!name || !slug) return badRequest(res, 'Name and slug are required');
  const cat = await prisma.category.create({ data: { name, slug, description, icon, sortOrder } });
  return success(res, cat, 'Category created');
});

const updateCategory = asyncHandler(async (req, res) => {
  const cat = await prisma.category.update({
    where: { id: req.params.id },
    data: req.body,
  });
  return success(res, cat, 'Category updated');
});

const createSubcategory = asyncHandler(async (req, res) => {
  const { categoryId, name, slug, description, defaultReward = 0.02, defaultCriteria, sortOrder = 0 } = req.body;
  if (!categoryId || !name || !slug) return badRequest(res, 'Category ID, name, and slug are required');
  const sub = await prisma.subcategory.create({
    data: {
      categoryId,
      name,
      slug,
      description,
      defaultReward: parseFloat(defaultReward),
      defaultCriteria,
      sortOrder,
    },
  });
  return success(res, sub, 'Subcategory created');
});

const updateSubcategory = asyncHandler(async (req, res) => {
  const { name, slug, description, defaultReward, defaultCriteria, isActive, sortOrder } = req.body;
  const sub = await prisma.subcategory.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(slug && { slug }),
      ...(description !== undefined && { description }),
      ...(defaultReward !== undefined && { defaultReward: parseFloat(defaultReward) }),
      ...(defaultCriteria !== undefined && { defaultCriteria }),
      ...(isActive !== undefined && { isActive }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });
  return success(res, sub, 'Subcategory updated');
});

// ─── Payment Methods Management (Admin) ─────────

const getPaymentMethods = asyncHandler(async (req, res) => {
  const methods = await prisma.paymentMethod.findMany({
    orderBy: { sortOrder: 'asc' },
  });
  return success(res, methods);
});

const createPaymentMethod = asyncHandler(async (req, res) => {
  const { name, type, number, accountName, sortOrder = 0, isActive = true } = req.body;
  if (!name || !type || !number) return badRequest(res, 'Name, type, and number are required');
  const method = await prisma.paymentMethod.create({
    data: { name, type, number, accountName, sortOrder, isActive },
  });
  return success(res, method, 'Payment method added');
});

const updatePaymentMethod = asyncHandler(async (req, res) => {
  const method = await prisma.paymentMethod.update({
    where: { id: req.params.id },
    data: req.body,
  });
  return success(res, method, 'Payment method updated');
});

const deletePaymentMethod = asyncHandler(async (req, res) => {
  await prisma.paymentMethod.delete({ where: { id: req.params.id } });
  return success(res, {}, 'Payment method deleted');
});

// ─── Platform Settings ───────────────────────────

const getSettings = asyncHandler(async (req, res) => {
  const settings = await prisma.platformSetting.findMany({ orderBy: { group: 'asc' } });
  const map = {};
  settings.forEach((s) => { map[s.key] = s.value; });
  return success(res, map);
});

const updateSettings = asyncHandler(async (req, res) => {
  const updates = req.body; // { key: value }
  for (const [key, value] of Object.entries(updates)) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }
  await prisma.auditLog.create({
    data: {
      actorId: req.user.id,
      action: 'SETTINGS_UPDATED',
      entityType: 'PlatformSetting',
      newValue: JSON.stringify(updates),
    },
  });
  return success(res, {}, 'Settings updated');
});

// ─── Fraud Flags ─────────────────────────────────

const getFraudFlags = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { ...(status && { status }) };
  const [flags, total] = await Promise.all([
    prisma.fraudFlag.findMany({
      where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.fraudFlag.count({ where }),
  ]);
  return paginated(res, flags, { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) });
});

// ─── Audit Logs ──────────────────────────────────

const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, entityType } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { ...(entityType && { entityType }) };
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, name: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return paginated(res, logs, { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) });
});

module.exports = {
  getDashboard, getUsers, getUser, updateUserStatus, adjustBalance,
  getAdminJobs, updateJobStatus,
  getWithdrawals, processWithdrawal,
  getDeposits, confirmDeposit, rejectDeposit,
  getCategories, createCategory, updateCategory, createSubcategory, updateSubcategory,
  getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
  getSettings, updateSettings,
  getFraudFlags, getAuditLogs,
};
