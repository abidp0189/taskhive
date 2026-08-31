const prisma = require('../utils/prisma');
const { success, paginated, notFound, badRequest, error, forbidden } = require('../utils/response');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * GET /api/wallet - Get wallet balances
 */
const getWallet = asyncHandler(async (req, res) => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId: req.user.id },
  });

  if (!wallet) return notFound(res, 'Wallet not found');

  return success(res, {
    availableBalance: parseFloat(wallet.availableBalance),
    pendingBalance: parseFloat(wallet.pendingBalance),
    lockedBalance: parseFloat(wallet.lockedBalance),
    depositBalance: parseFloat(wallet.depositBalance),
    currency: wallet.currency,
  });
});

/**
 * GET /api/wallet/transactions - Ledger history
 */
const getTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
  if (!wallet) return notFound(res, 'Wallet not found');

  const where = {
    walletId: wallet.id,
    ...(type && { type }),
  };

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return paginated(res, transactions, {
    page: parseInt(page), limit: parseInt(limit), total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/wallet/payment-methods - Active payment methods for deposits/withdrawals
 */
const getActivePaymentMethods = asyncHandler(async (req, res) => {
  const methods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return success(res, methods);
});

/**
 * GET /api/wallet/config - Public financial configuration
 */
const getWalletConfig = asyncHandler(async (req, res) => {
  const settings = await prisma.platformSetting.findMany({
    where: {
      key: {
        in: [
          'platform_fee_percent',
          'screenshot_fee_percent',
          'min_withdrawal_amount',
          'min_deposit_amount',
          'withdrawal_fee_percent',
          'min_job_budget',
          'boost_1m_price',
          'boost_5m_price',
          'boost_10m_price',
          'boost_15m_price',
          'default_estimated_days',
        ],
      },
    },
  });

  const config = {
    platform_fee_percent: 10,
    screenshot_fee_percent: 3,
    min_withdrawal_amount: 1.00,
    min_deposit_amount: 1.00,
    withdrawal_fee_percent: 6,
    min_job_budget: 0.80,
    boost_1m_price: 0.04,
    boost_5m_price: 0.07,
    boost_10m_price: 0.15,
    boost_15m_price: 0.20,
    default_estimated_days: 3,
  };

  settings.forEach((s) => {
    config[s.key] = parseFloat(s.value);
  });

  return success(res, config);
});

/**
 * POST /api/wallet/withdrawals - Request withdrawal (Workers only)
 */
const requestWithdrawal = asyncHandler(async (req, res) => {
  // Role check: Only workers (and admin for testing) can withdraw earned money
  if (req.user.role !== 'WORKER' && req.user.role !== 'ADMIN') {
    return forbidden(res, 'Only workers can withdraw earned funds. Employers use wallet funds for job campaigns.');
  }

  const { amount, method, accountName, accountDetails } = req.body;

  if (!amount || !method || !accountDetails) {
    return badRequest(res, 'Amount, method, and account details are required');
  }

  const requestedAmount = parseFloat(amount);
  if (isNaN(requestedAmount) || requestedAmount <= 0) {
    return badRequest(res, 'Invalid withdrawal amount');
  }

  // Get settings from database
  const [minSetting, feeSetting] = await Promise.all([
    prisma.platformSetting.findUnique({ where: { key: 'min_withdrawal_amount' } }),
    prisma.platformSetting.findUnique({ where: { key: 'withdrawal_fee_percent' } }),
  ]);

  const minAmount = parseFloat(minSetting?.value || '1.00');
  const feePercentNum = parseFloat(feeSetting?.value || '6.00');
  const feePercent = feePercentNum / 100;

  if (requestedAmount < minAmount) {
    return badRequest(res, `Minimum withdrawal amount is $${minAmount.toFixed(2)}`);
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
  if (!wallet) return notFound(res, 'Wallet not found');

  if (parseFloat(wallet.availableBalance) < requestedAmount) {
    return badRequest(res, `Insufficient earned balance. Available: $${parseFloat(wallet.availableBalance).toFixed(2)}`);
  }

  const fee = requestedAmount * feePercent;
  const netAmount = Math.max(0, requestedAmount - fee);

  const withdrawal = await prisma.$transaction(async (tx) => {
    // Lock funds from available balance
    await tx.wallet.update({
      where: { userId: req.user.id },
      data: {
        availableBalance: { decrement: requestedAmount },
        lockedBalance: { increment: requestedAmount },
      },
    });

    const updatedWallet = await tx.wallet.findUnique({ where: { userId: req.user.id } });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAWAL_REQUEST',
        amount: requestedAmount,
        direction: 'DEBIT',
        referenceType: 'WithdrawalRequest',
        description: `Withdrawal request via ${method} (Requested: $${requestedAmount.toFixed(2)}, Fee: $${fee.toFixed(2)}, Net: $${netAmount.toFixed(2)})`,
        balanceAfter: updatedWallet.availableBalance,
      },
    });

    return await tx.withdrawalRequest.create({
      data: {
        userId: req.user.id,
        amount: requestedAmount,
        fee,
        feePercent: feePercentNum,
        netAmount,
        method,
        accountName: accountName || null,
        accountDetails: typeof accountDetails === 'object' ? JSON.stringify(accountDetails) : String(accountDetails),
      },
    });
  });

  return success(res, withdrawal, 'Withdrawal request submitted. Admin will process it shortly.');
});

/**
 * GET /api/wallet/withdrawals - Withdrawal history
 */
const getWithdrawals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where: { userId: req.user.id },
      skip,
      take: parseInt(limit),
      orderBy: { requestedAt: 'desc' },
    }),
    prisma.withdrawalRequest.count({ where: { userId: req.user.id } }),
  ]);

  return paginated(res, withdrawals, {
    page: parseInt(page), limit: parseInt(limit), total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * POST /api/wallet/deposits - Request a manual deposit (Employers only)
 */
const requestDeposit = asyncHandler(async (req, res) => {
  // Role check: Only employers (and admin) can deposit funds
  if (req.user.role !== 'EMPLOYER' && req.user.role !== 'ADMIN') {
    return forbidden(res, 'Only employers can deposit funds for job campaigns.');
  }

  const { amount, paymentMethod, paymentMethodId, providerReference, notes } = req.body;

  if (!amount || (!paymentMethod && !paymentMethodId)) {
    return badRequest(res, 'Amount and payment method are required');
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return badRequest(res, 'Invalid deposit amount');
  }

  // Validate minimum deposit
  const minDepositSetting = await prisma.platformSetting.findUnique({ where: { key: 'min_deposit_amount' } });
  const minDeposit = parseFloat(minDepositSetting?.value || '1.00');
  if (numAmount < minDeposit) {
    return badRequest(res, `Minimum deposit amount is $${minDeposit.toFixed(2)} (৳${(minDeposit * 100).toFixed(0)} BDT)`);
  }

  // Validate payment method if ID is provided
  let methodName = paymentMethod;
  if (paymentMethodId) {
    const pm = await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
    if (pm) methodName = `${pm.name} (${pm.number})`;
  }

  const deposit = await prisma.deposit.create({
    data: {
      userId: req.user.id,
      amount: numAmount,
      paymentMethod: methodName || 'Manual Payment',
      paymentMethodId: paymentMethodId || null,
      providerReference: providerReference ? providerReference.trim() : null,
      notes: notes ? notes.trim() : null,
    },
  });

  return success(res, deposit, 'Deposit request submitted. Admin will verify and confirm it shortly.');
});

/**
 * GET /api/wallet/deposits - Deposit history
 */
const getDeposits = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [deposits, total] = await Promise.all([
    prisma.deposit.findMany({
      where: { userId: req.user.id },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.deposit.count({ where: { userId: req.user.id } }),
  ]);

  return paginated(res, deposits, {
    page: parseInt(page), limit: parseInt(limit), total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

module.exports = {
  getWallet,
  getTransactions,
  getActivePaymentMethods,
  getWalletConfig,
  requestWithdrawal,
  getWithdrawals,
  requestDeposit,
  getDeposits,
};
