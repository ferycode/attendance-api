'use strict';

const joi = require('joi');
const moment = require('moment');
const db = require(__base + 'app/models');
const response = require(__base + 'lib/common/response');
const redisClient = require(__base + 'lib/redis/redis-async');

const REMINDER_QUEUE = 'attendance_clock_in_reminder_queue';

module.exports = async (req, res, next) => {
  const schema = joi.object().keys({
    date: joi.date().optional().allow(null, ''),
  });

  try {
    const { date } = joi.attempt(req.body, schema, { allowUnknown: true });

    const today = date 
      ? moment(date).startOf('day') 
      : moment().startOf('day');
    
    const users = await db.User.findAll({
      where: {
        $or: [
          { lastClockedIn: null },
          {
            lastClockedIn: {
              $lte: today.format('YYYY-MM-DD HH:mm:ss')
            }
          }
        ],
        isLocked: false,
      }
    });

    for (const user of users) {
      await redisClient.rpush(REMINDER_QUEUE, JSON.stringify({
        email: user.email,
        name: user.name,
        timestamp: new Date()
      }));
    }

    return response.json(res, 200)({
      success: true,
      message: `Queued reminders for ${users.length} users`
    });
  } catch (err) {
    return next(err);
  }
}
