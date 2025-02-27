'use strict';

const jwt = require('jsonwebtoken');
const db = require(__base + 'app/models');
const response = require(__base + 'lib/common/response');

const JWT_SECRET = process.env.JWT_SECRET || 'attendance-api-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';

module.exports = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error('Authentication failed');
    }

    const user = await db.User.findOne({ 
      where: { 
        id: req.user.id, 
        isLocked: false 
      } 
    });

    if (!user) {
      throw new Error('User not exists');
    }

    const token = jwt.sign({ id: req.user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
    await user.update({ token });

    return response.json(res, 200)({
      message: 'User logged in successfully',
      token,
      data: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    return next(err);
  }
};
