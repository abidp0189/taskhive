const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { success, paginated } = require('../utils/response');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { verifyAccessToken } = require('../utils/jwt');
const { addClient } = require('../utils/realtime');

/**
 * GET /api/notifications/stream — SSE real-time notification stream
 * Authenticates via ?token= query param (EventSource doesn't support custom headers)
 */
router.get('/stream', (req, res) => {
  const token = req.query.token;
  if (!token) {
    res.status(401).json({ success: false, message: 'Token required' });
    return;
  }

  let userPayload;
  try {
    userPayload = verifyAccessToken(token);
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ userId: userPayload.id, ts: Date.now() })}\n\n`);

  // Register client
  addClient(userPayload.id, userPayload.role, res);

  // Keep connection alive (req 'close' event handled in addClient)
  req.on('close', () => {
    // cleanup handled automatically by addClient's close handler
  });
});

router.get('/unread-count', authenticate, asyncHandler(async (req, res) => {
  const count = await prisma.notification.count({
    where: { userId: req.user.id, isRead: false },
  });
  return success(res, { count });
}));

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unread } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {
    userId: req.user.id,
    ...(unread === 'true' && { isRead: false }),
  };
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ]);
  return paginated(res, notifications, { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) });
}));

router.post('/read-all', authenticate, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  return success(res, {}, 'All notifications marked as read');
}));

router.patch('/:id/read', authenticate, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: { isRead: true },
  });
  return success(res, {}, 'Notification marked as read');
}));

module.exports = router;
