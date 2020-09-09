import jwt from 'jwt-simple';
import passport, { AuthenticateOptions } from 'passport';
import { Express } from 'express';
import { Strategy as GithubStrategy } from 'passport-github2';
import { makeCallbackUrl, makeRedirectUrl, createToken, jwtOpts, queryParam } from './common';

export function addGithub(app: Express) {
  // Github OAuth login.
  passport.use(
    new GithubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: makeCallbackUrl('auth/github/callback'),
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

  app.get('/auth/github', (req, res, next) => {
    const options: AuthenticateOptions = {
      session: false,
      state: queryParam(req, 'next'),
    };
    passport.authenticate('github', options)(req, res, next);
  });

  app.get('/auth/github/callback', (req, res, next) => {
    passport.authenticate(
      'github',
      {
        session: false,
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
