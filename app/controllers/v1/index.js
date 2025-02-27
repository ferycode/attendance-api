'use strict';

const express = require('express');
const router = express.Router();

router.use('/users', require('./users'));
router.use('/oauth', require('./oauth'));

module.exports = router;