'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require(__base + 'lib/middleware/auth');

router.get('/', require('./list'));
router.post('/', require('./register'));
router.post('/login', require('./login'));
router.post('/logout', authenticate, require('./logout'));
router.put('/update', authenticate, require('./update'));
router.put('/set-password', authenticate, require('./set-password'));
router.get('/profile', authenticate, require('./profile'));

module.exports = router;
