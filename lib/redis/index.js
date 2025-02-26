'use strict';

const moment = require('moment');
const redisClient = require('./redis-async');
const log = require(__base + 'lib/winston/logger');

const makeCache = async (key, data, expired = null) => {
  try {
    const expiredInSeconds = expired ? moment(expired).diff(moment(), 'seconds') : undefined;
    if (expiredInSeconds) {
      await redisClient.set(
        key, 
        JSON.stringify(data), 
        'EX', 
        expiredInSeconds
      );
      return;
    }

    await redisClient.set(
      key, 
      JSON.stringify(data)
    );

  } catch (err) {
    log.error('[redis] Unable to makeCache: ' + err);
  }
  return;
};

const getFromCache = async (key) => {
  try {
    const item = await redisClient.get(key);
    return item;
  } catch (err) {
    log.error('Unable to getFromCache: ' + err);
    return null;
  }
};

const hasNoCacheControlHeader = (req) => {
  const hasCacheControl = req.get('Cache-Control');
  if (hasCacheControl) {
    return ['no-cache', 'must-revalidate'].includes(hasCacheControl);
  }
  return false;
};

module.exports = {
  makeCache,
  getFromCache,
  hasNoCacheControlHeader,
  redisClient
};
