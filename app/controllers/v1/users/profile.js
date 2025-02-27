'use strict';

const db = require(__base + 'app/models');
const response = require(__base + 'lib/common/response');
const redisClient = require(__base + 'lib/redis/redis-async');

module.exports = async (req, res, next) => {
  try {
    const redisKey = `attendance:user:${req.user.id}`;
    const cachedUser = await redisClient.get(redisKey);

    if (cachedUser) {
      return response.json(res, 200)({
        data: JSON.parse(cachedUser),
      });
    }

    const user = await db.User.findOne({ 
      where: { id: req.user.id },
      attributes: { exclude: ['password', 'token', 'deletedAt'] },
    });
    
    if (!user) {
      throw new Error('User not found');
    }

    await redisClient.set(redisKey, JSON.stringify(user), 'EX', 60 * 60); // 1 hour
    
    return response.json(res, 200)({
      data: user,
    });
  } catch (err) {
    return next(err);
  }
}
