'use strict';

const express = require('express');
const router = express.Router();

module.exports = function(app) {
  router.use('/v1', require('./v1'));
  app.use(router);
}