const { createLogger, format, transports } = require('winston');
const { combine, timestamp, errors, splat, json } = format;

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    errors({ stack: true }),
    splat(),
    json()
  ),
  transports: [
    new transports.Console()
  ]
});

module.exports = logger;
