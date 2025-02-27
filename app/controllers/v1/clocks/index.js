'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require(__base + 'lib/middleware/auth');

router.post('/', authenticate, require('./clocks'));

module.exports = router;
