'use strict';

const db = require(__base + 'app/models');
const response = require(__base + 'lib/common/response');

module.exports = async (req, res, next) => {
  try {
    const user = await db.User.findOne({ 
      where: { id: req.user.id }
    });

    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ token: null });

    return response.json(res, 200)({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (err) {
    return next(err);
  }
};
