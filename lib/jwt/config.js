const passportJwt = require('passport-jwt');
const JWTStrategy = passportJwt.Strategy;
const ExtractJWT = passportJwt.ExtractJwt;
const db = require(__base + 'app/models');
const log = require(__base + 'lib/winston/logger');

const jwtOptions = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'attendance-api-secret-key'
};

module.exports = (passport) => {
  try {
    passport.use(
      'jwt',
      new JWTStrategy(jwtOptions, async (jwtPayload, done) => {
        try {
          console.log(JSON.stringify(jwtPayload, null, 2), '-- jwtPayload --');
          console.log('lib/jwt/config.js:18');
          const user = await db.User.findOne({ 
            where: { id: jwtPayload.id },
            attributes: { exclude: ['password', 'token'] },
          });
          if (user) {
            return done(null, user);
          }
          return done(null, false, { message: 'User not found' });
        } catch (error) {
          log.error('JWT Strategy Error:', error);
          return done(error, false);
        }
      })
    );
    log.info('JWT Strategy initialized successfully');
  } catch (error) {
    log.error('JWT Strategy initialization failed:', error);
    throw error;
  }
};
