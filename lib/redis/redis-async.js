'use strict';

const { createClient } = require('async-redis');
const log = require(__base + 'lib/winston/logger');

const {
  REDIS_PORT,
  REDIS_HOST
} = process.env;

const redisClient = createClient({
  host: REDIS_HOST,
  port: REDIS_PORT
});

redisClient.on('error', (err) => {
  log.error(`[Redis] Error: ${JSON.stringify(err)}`);
});

redisClient.on('connect', () => {
  log.info(`[Redis] Connected ${REDIS_HOST}:${REDIS_PORT}`);
});

module.exports = redisClient;