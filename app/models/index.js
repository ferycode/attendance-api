"use strict";

const { NODE_ENV = 'development' } = process.env;
const fs        = require("fs");
const path      = require("path");
const basename  = path.basename(module.filename);
const Sequelize = require("sequelize");
const lodash    = require("lodash");
let config      = require('../../config/database.json')[NODE_ENV];
const { colorizeQuery } = require(__base + 'lib/sequelize-logging');
const db        = {};

const Op = Sequelize.Op;
const operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $regexp: Op.regexp,
  $notRegexp: Op.notRegexp,
  $iRegexp: Op.iRegexp,
  $notIRegexp: Op.notIRegexp,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $overlap: Op.overlap,
  $contains: Op.contains,
  $contained: Op.contained,
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col
};

let sequelize;

Object.assign(config, { operatorsAliases });

if (NODE_ENV === 'development'){
  Object.assign(config, { logging: colorizeQuery, benchmark: true });
}

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  let conf = config;
  sequelize = new Sequelize(config.database, config.username, config.password, conf);
}

Sequelize.postgres.DECIMAL.parse = function (value) { return parseFloat(value); };

fs.readdirSync(__dirname).filter(function (file) {
	return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
}).forEach(function (file) {
	const model = sequelize.import(path.join(__dirname, file));
	db[model.name] = model;
});

Object.keys(db).forEach(function (modelName) {
	if ("associate" in db[modelName]) {
		db[modelName].associate(db);
	}
});

module.exports = lodash.extend({
	sequelize: sequelize,
	Sequelize: Sequelize
}, db);
