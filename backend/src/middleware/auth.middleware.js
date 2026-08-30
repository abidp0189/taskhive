const { verifyAccessToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');

/**
 * Authenticate: validates JWT access token from Authorization header
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'Access token required');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Access token expired');
    }
    return unauthorized(res, 'Invalid access token');
  }
};

/**
 * Authorize: checks that the user has one of the allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res);
    if (!roles.includes(req.user.role)) {
      const { forbidden } = require('../utils/response');
      return forbidden(res, 'You do not have permission to access this resource');
    }
    next();
  };
};

/**
 * Optional auth: attach user if token present, but don't block
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // ignore
    }
  }
  next();
};

module.exports = { authenticate, authorize, optionalAuth };
