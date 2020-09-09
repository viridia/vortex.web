import passport from 'passport';
import { Express } from 'express';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { addGithub } from './github';
import { jwtOpts, UserToken as _UserToken } from './common';
import { addGoogle } from './google';

export type UserToken = _UserToken;

export function addAuthRoutes(app: Express) {
  // Set up JWT strategy
  passport.use(
    new JwtStrategy(jwtOpts, (payload: UserToken, done) => {
      done(null, payload);
    })
  );

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    addGithub(app);
  }

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    addGoogle(app);
  }
}
