'use strict';

const joi = require('joi');
const { omit } = require('lodash');
const db = require(__base + 'app/models');
const response = require(__base + 'lib/common/response');
const redisClient = require(__base + 'lib/redis/redis-async');

module.exports = async (req, res, next) => {
  const schema = joi.object().keys({
    name: joi.string().optional().allow(null, ''),
    phone: joi.string().optional().allow(null, ''),
    address: joi.string().optional().allow(null, ''),
    department: joi.string().valid(...Object.values(db.User.DEPARTMENT)).default(db.User.DEPARTMENT.OTHER),
  });

  try {
    const params = joi.attempt(req.body, schema, { allowUnknown: true });
    const user = await db.User.findByPk(req.user.id);

    if (!user) {
      throw new Error('User not found');
    }

    await user.update({
      name: params.name,
      phone: params.phone,
      address: params.address,
      department: params.department,
    });

    const data = omit(user.dataValues, ['password', 'token', 'deletedAt']);

    const redisKey = `attendance:user:${req.user.id}`;
    await redisClient.set(redisKey, JSON.stringify(data), 'EX', 60 * 60); // 1 hour

    return response.json(res, 200)({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
}
