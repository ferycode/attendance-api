'use strict';

const express = require('express');
const router = express.Router();

router.get('/attendances', require('./attendances'));
router.get('/users', require('./users'));

module.exports = router;
