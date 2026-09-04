/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err);

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
      field: err.meta?.target,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
    });
  }

  // Prisma write conflict / deadlock
  if (err.code === 'P2034') {
    return res.status(409).json({
      success: false,
      message: 'Transaction conflict occurred due to simultaneous updates. Please retry.',
    });
  }

  // Prisma connection errors
  if (err.code === 'P1001' || err.code === 'P1002') {
    return res.status(503).json({
      success: false,
      message: 'Database server is momentarily busy. Please try again in a moment.',
    });
  }

  // Prisma interactive transaction timeout or closure
  if (
    err.message &&
    (err.message.includes('Transaction already closed') ||
     err.message.includes('Transaction API error') ||
     err.message.includes('expired transaction'))
  ) {
    return res.status(408).json({
      success: false,
      message: 'Request timed out while processing. Please try again.',
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: `File too large. Max size is ${process.env.MAX_FILE_SIZE_MB || 10}MB`,
    });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const errors = {};
    err.errors.forEach((e) => {
      const key = e.path.join('.');
      errors[key] = e.message;
    });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  let userMessage = err.message || 'Internal server error';

  // In production, sanitize 500 errors so internal SQL/Prisma details are not exposed to clients
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    if (
      userMessage.includes('prisma.') ||
      userMessage.includes('invocation:') ||
      userMessage.includes('SELECT') ||
      userMessage.includes('UPDATE')
    ) {
      userMessage = 'An unexpected error occurred while processing your request. Please try again.';
    }
  }

  return res.status(statusCode).json({
    success: false,
    message: userMessage,
  });
};

/**
 * Async handler wrapper – eliminates try/catch boilerplate
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
