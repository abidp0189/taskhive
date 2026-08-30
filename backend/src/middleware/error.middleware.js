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
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

/**
 * Async handler wrapper – eliminates try/catch boilerplate
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
