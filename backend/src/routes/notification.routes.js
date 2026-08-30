const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { success, paginated } = require('../utils/response');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

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

router.get('/unread-count', authenticate, asyncHandler(async (req, res) => {
  const count = await prisma.notification.count({
    where: { userId: req.user.id, isRead: false },
  });
  return success(res, { count });
}));

module.exports = router;
