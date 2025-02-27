'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require(__base + 'lib/middleware/auth');

router.post('/', authenticate, require('./clocks'));
router.post('/reminder', require('./reminder'));

module.exports = router;
