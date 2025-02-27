'use strict';

const joi = require('joi');
const bcrypt = require('bcryptjs');
const db = require(__base + 'app/models');
const response = require(__base + 'lib/common/response');

module.exports = async (req, res, next) => {
  const schema = joi.object().keys({
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
    name: joi.string().optional().allow(null, ''),
    phone: joi.string().optional().allow(null, ''),
    address: joi.string().optional().allow(null, ''),
    department: joi.string().valid(...Object.values(db.User.DEPARTMENT)).default(db.User.DEPARTMENT.OTHER),
  });

  try {
    const params = joi.attempt(req.body, schema, { allowUnknown: true });
    const user = await db.User.findOne({ where: { email: params.email } });

    if (user) {
      throw new Error('User already exists');
    }

    const password = await bcrypt.hash(params.password, 10);
    const registerUser = await db.User.create({ email: params.email, password });

    if (!registerUser) {
      throw new Error('Unable to register user');
    }

    return response.json(res, 200)({
      success: true,
      message: 'User registered successfully',
    });
  } catch (err) {
    return next(err);
  }
}
