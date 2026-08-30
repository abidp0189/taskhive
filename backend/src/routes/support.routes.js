const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { success, paginated, notFound, badRequest, forbidden } = require('../utils/response');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

// Create ticket
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { subject, category, priority = 'MEDIUM', message } = req.body;
  if (!subject || !message) return badRequest(res, 'Subject and message are required');

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.user.id,
      subject, category: category || 'General', priority,
      messages: { create: { senderId: req.user.id, message } },
    },
    include: { messages: true },
  });
  return success(res, ticket, 'Support ticket created');
}));

// Get my tickets
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const isAdmin = ['ADMIN', 'MODERATOR'].includes(req.user.role);
  const where = isAdmin ? {} : { userId: req.user.id };

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where, skip, take: parseInt(limit), orderBy: { updatedAt: 'desc' },
      include: { user: { select: { name: true, email: true } }, _count: { select: { messages: true } } },
    }),
    prisma.supportTicket.count({ where }),
  ]);
  return paginated(res, tickets, { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) });
}));

// Get ticket with messages
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: req.params.id },
    include: { messages: { orderBy: { createdAt: 'asc' } }, user: { select: { name: true, email: true } } },
  });
  if (!ticket) return notFound(res);
  if (ticket.userId !== req.user.id && !['ADMIN', 'MODERATOR'].includes(req.user.role)) return forbidden(res);
  return success(res, ticket);
}));

// Reply to ticket
router.post('/:id/reply', authenticate, asyncHandler(async (req, res) => {
  const { message, isInternal = false } = req.body;
  if (!message) return badRequest(res, 'Message is required');

  const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket) return notFound(res);
  if (ticket.userId !== req.user.id && !['ADMIN', 'MODERATOR'].includes(req.user.role)) return forbidden(res);

  const msg = await prisma.ticketMessage.create({
    data: { ticketId: ticket.id, senderId: req.user.id, message, isInternal: !!isInternal },
  });

  await prisma.supportTicket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } });
  return success(res, msg, 'Reply sent');
}));

module.exports = router;
