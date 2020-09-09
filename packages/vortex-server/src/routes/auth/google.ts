import jwt from 'jwt-simple';
import passport from 'passport';
import { Express } from 'express';
import { Strategy, AuthenticateOptionsGoogle } from 'passport-google-oauth20';
import { makeCallbackUrl, makeRedirectUrl, createToken, jwtOpts, queryParam } from './common';

export function addGoogle(app: Express) {
  // Google OAuth2 login.
  passport.use(
    new Strategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: makeCallbackUrl('auth/google/callback'),
      },
      (_accessToken, _refreshToken, profile, done) => {
        const token = createToken(profile.emails, profile.displayName);
        if (token) {
          done(null, jwt.encode(token, jwtOpts.secretOrKey));
        } else {
          done(Error('missing email'));
        }
      }
    )
  );

  app.get('/auth/google', (req, res, next) => {
    const options: AuthenticateOptionsGoogle = {
      session: false,
      scope: ['openid', 'email', 'profile'],
      state: queryParam(req, 'next'),
    };
    passport.authenticate('google', options)(req, res, next);
  });

  app.get('/auth/google/callback', (req, res, next) => {
    passport.authenticate(
      'google',
      {
        session: false,
        scope: ['openid', 'email', 'profile'],
        failureRedirect: '/',
        failureFlash: 'Login failed.',
      },
      (err, user: string) => {
        if (err) {
          return next(err);
        }
        res.redirect(makeRedirectUrl(queryParam(req, 'state') || '/', user));
      }
    )(req, res, next);
  });
}
