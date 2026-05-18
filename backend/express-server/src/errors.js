class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function badRequest(message, details) {
  return new AppError(400, 'BAD_REQUEST', message, details);
}

function unauthorized(message = 'Authentication is required') {
  return new AppError(401, 'UNAUTHORIZED', message);
}

function forbidden(message = 'You do not have permission to perform this action') {
  return new AppError(403, 'FORBIDDEN', message);
}

function notFound(resource = 'Resource') {
  return new AppError(404, 'NOT_FOUND', `${resource} was not found`);
}

function conflict(message) {
  return new AppError(409, 'CONFLICT', message);
}

module.exports = {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
};
