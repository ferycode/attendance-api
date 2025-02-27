'use strict';

const joi = require('joi');
const moment = require('moment');
const db = require(__base + 'app/models');
const response = require(__base + 'lib/common/response');
const redisClient = require(__base + 'lib/redis/redis-async');
const { Attendances } = require(__base + 'lib/elasticsearch');

module.exports = async (req, res, next) => {
  const schema = joi.object().keys({
    notes: joi.string().optional().allow(null, ''),
    type: joi.string().valid(...Object.values(Attendances.type)).required(),
  });

  try {
    const { notes, type} = joi.attempt(req.body, schema, { allowUnknown: true });
    const user = await db.User.findByPk(req.user.id);

    if (!user) {
      throw new Error('User not found');
    }

    const clock = await Attendances.findOne({
      where: {
        bool: {
          filter: [
            { term: { userId: req.user.id } },
            { term: { type } },
            { 
              range: { 
                clockedAt: { 
                  gte: moment().startOf('day').toISOString(), 
                  lte: moment().endOf('day').toISOString(),
                } 
              }
            },
          ],
        },
      }
    });

    if (clock) {
      return response.json(res, 200)({
        success: true,
        message: `User already ${type} today`,
      });
    }
    
    const data = {
      userId: req.user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      type,
      notes,
      clockedAt: moment().toISOString(),
      createdAt: moment().toISOString(),
      updatedAt: moment().toISOString(),
    };

    await Attendances.sync({ body: data });

    if (type === Attendances.type.CLOCK_IN) {
      await user.update({
        lastClockedIn: moment().format('YYYY-MM-DD HH:mm:ss'),
      });
    }

    const redisKey = `attendance:user:${type}:${req.user.id}`;
    await redisClient.set(redisKey, JSON.stringify(data), 'EX', 60 * 60 * 24); // 1 day

    return response.json(res, 200)({
      success: true,
      message: `User ${type} successfully`,
    });
  } catch (err) {
    return next(err);
  }
}
