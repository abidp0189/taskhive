/**
 * Standard API response helpers
 */

const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const created = (res, data = {}, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

const paginated = (res, data = [], pagination = {}, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

const forbidden = (res, message = 'Access denied') => {
  return error(res, message, 403);
};

const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

const badRequest = (res, message = 'Bad request', errors = null) => {
  return error(res, message, 400, errors);
};

module.exports = { success, created, paginated, error, notFound, forbidden, unauthorized, badRequest };
