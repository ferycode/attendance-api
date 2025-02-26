const passport = require('passport');
const response = require(__base + 'lib/common/response');

exports.authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return response.json(res, 401)({
        message: 'Unauthorized access',
        error: info ? info.message : 'Invalid token'
      });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};
