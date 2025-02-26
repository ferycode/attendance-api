'use strict';

const db = require(__base + 'app/models');
const log = require(__base + 'lib/winston/logger');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = (passport) => {
  try {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        if (!profile.emails || !profile.emails.length) {
          return done(new Error('No email found from Google profile'));
        }

        const email = profile.emails[0].value;
        let user = await db.User.findOne({
          where: { email }
        });

        if (!user) {
          user = await db.User.create({
            email: email,
            name: profile.displayName,
          });
        }

        return done(null, user);
      } catch (err) {
        log.error('Google OAuth Error:', err);
        return done(err);
      }
    }));

    passport.serializeUser((user, done) => {
      done(null, user.id);
    });
    
    passport.deserializeUser(async (id, done) => {
      try {
        const user = await db.User.findByPk(id);
        done(null, user);
      } catch (err) {
        done(err);
      }
    });
    log.info('Google OAuth Strategy initialized successfully');
  } catch (error) {
    log.error('Google OAuth Strategy initialization failed:', error);
    throw error;
  }
}
