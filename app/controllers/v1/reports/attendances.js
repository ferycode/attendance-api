'use strict';

const joi = require('joi');
const db = require(__base + 'app/models');
const moment = require('moment');
const response = require(__base + 'lib/common/response');
const { Attendances } = require(__base + 'lib/elasticsearch');

module.exports = async (req, res, next) => {
  const schema = joi.object().keys({
    type: joi.string().valid(...Object.values(Attendances.type)).optional(),
    periodStart: joi.date().iso().optional(),
    periodEnd: joi.date().iso().optional(),
    name: joi.string().optional(),
    email: joi.string().email().optional(),
    phone: joi.string().optional(),
    department: joi.string().valid(...Object.values(db.User.DEPARTMENT)).default(db.User.DEPARTMENT.OTHER),
    page: joi.number().integer().min(1).default(1),
    perPage: joi.number().integer().min(1).default(50)
  });

  try {
    const params = joi.attempt(req.query, schema, { allowUnknown: true });
    
    let options = { 
      order: [
        { clockedAt: 'asc' },
      ],
      unlimited: true,
    };

    let periodConditions = { 
      clockedAt: { 
        gte: moment().startOf('day').toISOString(), 
        lte: moment().endOf('day').toISOString(),
      } 
    };

    if (params.periodStart && params.periodEnd) {
      periodConditions = { 
        clockedAt: { 
          gte: moment(params.periodStart).startOf('day').toISOString(), 
          lte: moment(params.periodEnd).endOf('day').toISOString(),
        } 
      };
    }

    const conditions = { 
      bool: {
        filter: [
          { range: periodConditions }
        ]
      }
    };
    
    if (params.type) {
      conditions.bool.filter.push({ 
        term: { type: params.type } 
      });
    }
    
    if (params.name) {
      conditions.bool.filter.push({ 
        match: { name: params.name } 
      });
    }

    if (params.email) { 
      conditions.bool.filter.push({ 
        match: { email: params.email } 
      });
    }

    if (params.phone) {
      conditions.bool.filter.push({ 
        match: { phone: params.phone } 
      });
    }

    if (params.department) {
      conditions.bool.filter.push({ 
        match: { department: params.department } 
      });
    }

    if (params.page && params.perPage) {
      Object.assign(options, {
        offset: (params.page - 1) * params.perPage,
        limit: params.perPage,
        unlimited: false
      });
    }

    const [rows, count] = await Promise.all([
      Attendances.findAll({ 
        where: conditions,
        ...options,
      }),
      Attendances.count({ body: { query: conditions } }),
    ]);
    
    return response.json(res, 200)({
      data: rows,
      count,
    });
  } catch (err) {
    return next(err);
  }
}
