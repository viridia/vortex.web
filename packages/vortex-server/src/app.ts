import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import passport from 'passport';
import './env';

export const app = express();
// TODO
// app.use(redirectToHTTPS([/localhost:(\d{4})/]));
app.use(bodyParser.json());
app.use(compression());
app.use(passport.initialize());
