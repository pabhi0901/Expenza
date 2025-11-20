import passport from 'passport'
import dotenv from 'dotenv';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20' 

dotenv.config()

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      passReqToCallback: true
    },
    (req, accessToken, refreshToken, profile, done) => {
      return done(null, { accessToken, refreshToken, profile });
    }
  )
);

export default passport;
