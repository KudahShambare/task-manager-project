const { validationResult } = require('express-validator');
const { badRequest } = require('../errors');

function validate(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return next(
    badRequest(
      'Request validation failed',
      result.array().map((item) => ({
        field: item.path,
        message: item.msg,
      })),
    ),
  );
}

module.exports = validate;
