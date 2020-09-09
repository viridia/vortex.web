import qs from 'qs';
import { Request } from 'express';
import { ExtractJwt } from 'passport-jwt';

export interface UserToken {
  id: string;
  displayName: string;
}

export function queryParam(req: Request, name: string): string | undefined {
  const str = req.query[name];
  return typeof str === 'string' ? str : undefined;
}

export const jwtOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

export function createToken(emails: Array<{ value: string }>, displayName: string): UserToken {
  if (emails.length > 0) {
    const id = emails[0].value;
    return {
      id,
      displayName,
    };
  }
  return null;
}

/** Make sure there is exactly one slash between joined parts */
function joinPaths(prefix: string, ...suffixes: string[]): string {
  let result = prefix;
  suffixes.forEach(path => {
    if (!result.endsWith('/')) {
      result += '/';
    }
    result += path.startsWith('/') ? path.slice(1) : path;
  });
  return result;
}

export function makeCallbackUrl(pathname: string): string {
  const url = new URL(process.env.SERVER_URL);
  url.pathname = joinPaths(url.pathname, pathname);
  return url.toString();
}

export function makeRedirectUrl(next: string, user: string) {
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
