const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { generateAccessToken, generateRefreshToken, generateReferralCode, verifyAccessToken } = require('../utils/jwt');
const { success, created, error, badRequest, unauthorized, notFound } = require('../utils/response');
const { asyncHandler } = require('../middleware/error.middleware');
const { sendPasswordResetEmail } = require('../utils/mailer');

/**
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'WORKER', referralCode } = req.body;

  if (!name || !email || !password) {
    return badRequest(res, 'Name, email, and password are required');
  }

  if (password.length < 8) {
    return badRequest(res, 'Password must be at least 8 characters');
  }

  const validRoles = ['WORKER', 'EMPLOYER'];
  if (!validRoles.includes(role)) {
    return badRequest(res, 'Invalid role. Choose WORKER or EMPLOYER');
  }

  // Check duplicate email
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return error(res, 'Email already registered', 409);
  }

  // Handle referral
  let referrer = null;
  if (referralCode) {
    referrer = await prisma.user.findUnique({ where: { referralCode } });
    // Silently ignore invalid referral codes
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const myReferralCode = generateReferralCode(name);

  // Create user + wallet in transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        status: 'ACTIVE', // simplified: skip email verification for MVP
        referralCode: myReferralCode,
        referredByUserId: referrer?.id || null,
      },
    });

    // Create wallet
    await tx.wallet.create({
      data: { userId: newUser.id },
    });

    // Create referral record
    if (referrer) {
      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredUserId: newUser.id,
        },
      });
    }

    return newUser;
  }, { timeout: 30000, maxWait: 15000 });

  const accessToken = generateAccessToken({ id: user.id, role: user.role, email: user.email });
  const refreshTokenValue = generateRefreshToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenValue,
      expiresAt,
    },
  });

  return created(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      referralCode: user.referralCode,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    refreshToken: refreshTokenValue,
  }, 'Registration successful');
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return badRequest(res, 'Email and password are required');
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    return unauthorized(res, 'Invalid email or password');
  }

  if (user.status === 'BANNED') {
    return error(res, 'Your account has been banned. Contact support.', 403);
  }
  if (user.status === 'SUSPENDED') {
    return error(res, 'Your account is suspended. Contact support.', 403);
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return unauthorized(res, 'Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const accessToken = generateAccessToken({ id: user.id, role: user.role, email: user.email });
  const refreshTokenValue = generateRefreshToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenValue,
      expiresAt,
    },
  });

  return success(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      referralCode: user.referralCode,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    refreshToken: refreshTokenValue,
  }, 'Login successful');
});

/**
 * POST /api/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return badRequest(res, 'Refresh token required');

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    }
    return unauthorized(res, 'Invalid or expired refresh token');
  }

  const user = storedToken.user;

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { userId: user.id, token: newRefreshToken, expiresAt },
  });

  const accessToken = generateAccessToken({ id: user.id, role: user.role, email: user.email });

  return success(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed');
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  return success(res, {}, 'Logged out successfully');
});

/**
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatarUrl: true,
      phone: true,
      bio: true,
      referralCode: true,
      countryId: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      country: { select: { id: true, name: true, code: true } },
    },
  });

  if (!user) return notFound(res, 'User not found');
  return success(res, user);
});

/**
 * PATCH /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, bio, countryId } = req.body;

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name && { name: name.trim() }),
      ...(phone !== undefined && { phone }),
      ...(bio !== undefined && { bio }),
      ...(countryId !== undefined && { countryId }),
    },
    select: {
      id: true, name: true, email: true, role: true, status: true,
      avatarUrl: true, phone: true, bio: true, referralCode: true,
      countryId: true,
    },
  });

  return success(res, updated, 'Profile updated');
});

/**
 * POST /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return badRequest(res, 'Current and new passwords required');
  }
  if (newPassword.length < 8) {
    return badRequest(res, 'New password must be at least 8 characters');
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) return badRequest(res, 'Current password is incorrect');

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash: newHash },
  });

  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });

  return success(res, {}, 'Password changed. Please login again.');
});

/**
 * POST /api/auth/forgot-password
 * Only for WORKER and EMPLOYER accounts.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return badRequest(res, 'Email address is required');

  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

  if (!user) {
    return error(res, 'No account found with this email address. Please check your spelling or register.', 404);
  }

  // Only for WORKER and EMPLOYER
  if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
    return error(res, 'Password reset via email is only available for Worker and Employer accounts.', 403);
  }

  if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
    return error(res, 'This account is deactivated. Please contact support.', 403);
  }

  // Generate a secure random token (valid for 24 hours)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token: rawToken, expiresAt },
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetLink, user.name);
  } catch (mailErr) {
    console.error('Failed to dispatch password reset email:', mailErr);
    return error(res, 'Failed to send email. Please check SMTP configuration or try again in a few minutes.', 500);
  }

  return success(res, {}, 'Password reset link sent successfully! Please check your email inbox (and spam folder).');
});

/**
 * GET /api/auth/verify-reset-token
 * Validates whether a token exists, is unused, and not expired before displaying the form.
 */
const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) return badRequest(res, 'Token is required');

  const cleanToken = token.trim();
  const record = await prisma.passwordResetToken.findUnique({
    where: { token: cleanToken },
    include: { user: { select: { name: true, email: true, role: true } } },
  });

  if (!record) {
    return error(res, 'This reset link is invalid or does not exist.', 400);
  }

  if (record.used) {
    return error(res, 'This reset link has already been used. Please request a new one.', 400);
  }

  if (new Date() > record.expiresAt) {
    return error(res, 'This reset link has expired. Please request a new one.', 400);
  }

  return success(res, { email: record.user.email, name: record.user.name }, 'Token is valid');
});

/**
 * POST /api/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return badRequest(res, 'Token and new password are required');
  if (password.length < 8) return badRequest(res, 'Password must be at least 8 characters');

  const cleanToken = token.trim();

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: cleanToken },
    include: { user: true },
  });

  if (!record) {
    return error(res, 'This reset link is invalid or does not exist. Please request a new one.', 400);
  }

  if (record.used) {
    return error(res, 'This reset link has already been used. If you need to change your password again, please request a new link.', 400);
  }

  if (new Date() > record.expiresAt) {
    return error(res, 'This reset link has expired. Please request a new one.', 400);
  }

  // Block admin/moderator just in case
  if (record.user.role === 'ADMIN' || record.user.role === 'MODERATOR') {
    return error(res, 'Password reset is not available for this account type.', 403);
  }

  const newHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    // Mark ALL tokens for this user as used once password is reset
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId },
      data: { used: true },
    }),
    // Update password
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: newHash },
    }),
    // Invalidate all existing refresh tokens (force re-login)
    prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return success(res, {}, 'Password reset successfully! You can now log in with your new password.');
});

module.exports = { register, login, refresh, logout, getMe, updateProfile, changePassword, forgotPassword, resetPassword, verifyResetToken };
