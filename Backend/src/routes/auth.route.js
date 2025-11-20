import express from 'express'
const router = express.Router()
import passport from '../config/passport.config.js'
import authController from '../controller/auth.controller.js'

// Step 1: Start Google Authentication
router.get(
  '/google',
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly'
    ],
    accessType: 'offline',
    prompt: 'consent'
  })
);

// Step 2: Google Callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  authController.loginSignupController
);


export default router