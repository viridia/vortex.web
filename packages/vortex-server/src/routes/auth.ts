import jwt from 'jwt-simple';
import passport from 'passport';
import qs from 'qs';
import { Express, Request } from 'express';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { Strategy as GithubStrategy } from 'passport-github2';
import '../env';

export interface UserToken {
  id: string;
  displayName: string;
}

function queryParam(req: Request, name: string): string | undefined {
  const str = req.query[name];
  return typeof str === 'string' ? str : undefined;
}

const jwtOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

function createToken(emails: Array<{ value: string }>, displayName: string): UserToken {
  if (emails.length > 0) {
    const id = emails[0].value;
    return {
      id,
      displayName,
    };
  }
  return null;
}

function makeCallbackUrl(pathname: string, next?: string): string {
  const url = new URL(process.env.SERVER_URL);
  url.pathname = url.pathname + pathname;
  url.search = qs.stringify({ next }, { addQueryPrefix: true });
  return url.toString();
}

function makeRedirectUrl(next: string, user: string) {
  const url = new URL(process.env.PUBLIC_URL);
  const queryParams = { session: user };
  const qmark = next.indexOf('?');
  if (qmark > -1) {
    Object.assign(queryParams, qs.parse(next.slice(qmark), { ignoreQueryPrefix: true }));
    next = next.slice(0, qmark);
  }
  url.pathname = next;
  url.search = qs.stringify(queryParams, { addQueryPrefix: true });
  return url.toString();
}

function addGithub(app: Express) {
  // Github OAuth login.
  passport.use(
    new GithubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: '',
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
    const options = {
      session: false,
      callbackURL: makeCallbackUrl('auth/github/callback', queryParam(req, 'next')),
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
        res.redirect(makeRedirectUrl(queryParam(req, 'next') || '/', user));
      }
    )(req, res, next);
  });
}

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
}
