'use strict';

const joi = require('joi');
const bcrypt = require('bcryptjs');
const db = require(__base + 'app/models');
const response = require(__base + 'lib/common/response');

module.exports = async (req, res, next) => {
  const schema = joi.object().keys({
    password: joi.string().min(6).required(),
  });

  try {
    const params = joi.attempt(req.body, schema, { allowUnknown: true });
    const user = await db.User.findByPk(req.user.id);

    if (!user) {
      throw new Error('User not found');
    }

    const password = await bcrypt.hash(params.password, 10);
    await user.update({ password });

    return response.json(res, 200)({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    return next(err);
  }
}
