import bodyParser from 'body-parser';
import express from 'express';
import passport from 'passport';
import cors from 'cors';

function domainName(hostUrl: string) {
  const url = new URL(hostUrl);
  url.pathname = '';
  url.search = '';
  const result = url.toString();
  if (result.endsWith('/')) {
    return result.slice(0, result.length - 1);
  }
  return result;
}

export const app = express();
app.use(cors({
  origin: domainName(process.env.PUBLIC_URL || 'http://localhost'),
  methods: ['GET', 'PUT', 'POST'],
}));
app.disable('x-powered-by');
app.use(bodyParser.json());
app.use(passport.initialize());
