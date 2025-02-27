'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const response = require(__base + 'lib/common/response');

router.get('/', (req, res, next) => {
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })(req, res, next);
});

router.get('/callback', 
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/v1/oauth/failed'
  }),
  require('./callback')
);

router.get('/failed', (req, res) => {
  return response.json(res, 401)({
    message: 'Authentication failed',
    error: 'Failed to authenticate with Google'
  });
});

module.exports = router;
