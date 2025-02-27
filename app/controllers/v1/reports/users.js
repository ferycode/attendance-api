'use strict';

const joi = require('joi');
const db = require(__base + 'app/models');
const response = require(__base + 'lib/common/response');

module.exports = async (req, res, next) => {
   const schema = joi.object().keys({
    name: joi.string().optional(),
    email: joi.string().email().optional(),
    phone: joi.string().optional(),
    address: joi.string().optional(),
    department: joi.string().valid(...Object.values(db.User.DEPARTMENT)).optional(),
    page: joi.number().integer().min(1).default(1),
    perPage: joi.number().integer().min(1).default(50)
  });

  try {
    const params = joi.attempt(req.query, schema, { allowUnknown: true });

    const conditions = { isLocked: false };

    if (params.name) {
      conditions.name = { [db.Sequelize.Op.like]: `%${params.name}%` };
    }
    if (params.email) {
      conditions.email = { [db.Sequelize.Op.like]: `%${params.email}%` };
    }
    if (params.phone) {
      conditions.phone = { [db.Sequelize.Op.like]: `%${params.phone}%` };
    }
    if (params.address) {
      conditions.address = { [db.Sequelize.Op.like]: `%${params.address}%` };
    }
    if (params.department) {
      conditions.department = params.department;
    }

    const { count, rows } = await db.User.findAndCountAll({
      where: conditions,
      attributes: { exclude: ['password', 'token'] },
      limit: params.perPage,
      offset: (params.page - 1) * params.perPage,
    });

    return response.json(res, 200)({
      data: rows,
      count,
    });
  } catch (err) {
    return next(err);
  }
};
