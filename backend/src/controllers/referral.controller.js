const prisma = require('../utils/prisma');
const { success, notFound } = require('../utils/response');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * GET /api/referral - Referral info and link
 */
const getReferralInfo = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { referralCode: true },
  });

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const referralLink = `${baseUrl}/register?ref=${user.referralCode}`;

  return success(res, { referralCode: user.referralCode, referralLink });
});

/**
 * GET /api/referral/stats
 */
const getReferralStats = asyncHandler(async (req, res) => {
  const referrals = await prisma.referral.findMany({
    where: { referrerId: req.user.id },
    include: {
      referredUser: { select: { id: true, name: true, createdAt: true, status: true } },
      commissions: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalCommission = referrals
    .flatMap((r) => r.commissions)
    .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);

  return success(res, {
    totalReferrals: referrals.length,
    totalCommission,
    referrals: referrals.map((r) => ({
      id: r.id,
      referredUser: r.referredUser,
      joinedAt: r.createdAt,
      totalCommission: r.commissions.reduce((s, c) => s + parseFloat(c.commissionAmount), 0),
      commissionCount: r.commissions.length,
    })),
  });
});

module.exports = { getReferralInfo, getReferralStats };
