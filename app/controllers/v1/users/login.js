'use strict';

const joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require(__base + 'app/models');
const response = require(__base + 'lib/common/response');

const JWT_SECRET = process.env.JWT_SECRET || 'attendance-api-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';

module.exports = async (req, res, next) => {
  const schema = joi.object().keys({
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
  });

  try {
    const params = joi.attempt(req.body, schema, { allowUnknown: true });
    const user = await db.User.findOne({ 
      where: { 
        email: params.email, 
        isLocked: false 
      } 
    });

    if (!user) {
      throw new Error('User not exists');
    }

    const isPasswordMatch = await bcrypt.compare(params.password, user.password);
    if (!isPasswordMatch) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
    await user.update({ token });

    return response.json(res, 200)({
      success: true,
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
}
