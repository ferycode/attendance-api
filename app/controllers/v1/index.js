'use strict';

const express = require('express');
const router = express.Router();

router.use('/users', require('./users'));
router.use('/oauth', require('./oauth'));
router.use('/clocks', require('./clocks'));
router.use('/reports', require('./reports'));

module.exports = router;