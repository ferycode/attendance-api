'use strict';

const db = require(__base + 'app/models');
const response = require(__base + 'lib/common/response');

module.exports = async (req, res, next) => {
  try {
    const { count, rows } = await db.User.findAndCountAll();

    // const data = {
    //   id: 1,
    //   name: 'John Doe',
    // };

    return response.json(res, 200)({
      data: rows,
      count,
    });
  } catch (error) {
    return next(err);
  }
};
