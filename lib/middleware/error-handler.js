'use strict';

const log = require(__base + 'lib/winston/logger');

module.exports = (err, req, res, next) => {
  log.error(err.stack);

  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.details
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};
