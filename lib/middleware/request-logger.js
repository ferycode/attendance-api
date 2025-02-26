'use strict';

const log = require(__base + 'lib/winston/logger');

module.exports = (req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const requestLog = {
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      statusCode: res.statusCode
    };
    log.info('Request Log', requestLog);
  });
  next();
};
