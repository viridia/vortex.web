/// <reference path="../global.d.ts"/>
import Ajv from 'ajv';
import DocumentStore from '../db/DocumentStore';
import graphSchema from '../graph.schema.json';
import passport from 'passport';
import { Express } from 'express';
import { UserToken } from './auth';

const validator = new Ajv();
const validate = validator.compile(graphSchema);

export function addDocRoutes(app: Express, docStore: DocumentStore) {
  app.get('/api/docs', async (req, res, next) => {
    docStore.listDocuments('x').then(
      docList => {
        res.json(docList);
      },
      error => {
        console.error(error);
        res.status(500).json({ code: 'InternalError', message: String(error) });
      }
    );
  });

  app.get('/api/docs', async (req, res, next) => {
    passport.authenticate(
      'jwt',
      { session: false },
      async (err: any, user: UserToken, info: any) => {
        if (!user) {
          res.json([]);
          return;
        }
        docStore.listDocuments(user.id).then(
          docList => {
            res.json(docList);
          },
          error => {
            console.error(error);
            res.status(500).json({ code: 'InternalError', message: String(error) });
          }
        );
      }
    )(req, res, next);
  });

  app.get('/api/docs/:id', (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err: any, user: UserToken, info: any) => {
      docStore.getDocument(req.params.id).then(
        (doc: any) => {
          if (doc) {
            doc.ownedByUser = doc.creator === user.id;
            res.json(doc);
          } else {
            res.status(404).json({ error: 'not-found' });
          }
        },
        error => {
          console.error(error);
          res.status(500).json({ code: 'InternalError', message: String(error) });
        }
      );
    })(req, res, next);
  });

  app.post(
    '/api/docs',
    passport.authenticate('jwt', { session: false }),
    async (req, res, next) => {
      if (!req.user) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      if (!validate(req.body)) {
        res.status(400).json({ error: 'validation-failed', details: validate.errors });
        return;
      }

      try {
        const id = await docStore.createDocument(req.body, req.user.id, req.user.displayName);
        if (id !== null) {
          res.json({ id });
        } else {
          res.status(500).end();
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ code: 'InternalError', message: String(error) });
      }
    }
  );

  app.put(
    '/api/docs/:id',
    passport.authenticate('jwt', { session: false }),
    async (req, res, next) => {
      if (!req.user) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      if (!validate(req.body)) {
        res.status(400).json({ error: 'validation-failed', details: validate.errors });
        return;
      }

      try {
        const doc: any = await docStore.getDocument(req.params.id);
        if (!doc) {
          console.error('pre-fetch failed');
          res.status(404).json({ error: 'not-found' });
          return;
        }

        if (doc.creator !== req.user.id) {
          res.status(403).json({ error: 'forbidden' });
          return;
        }

        const replaced = await docStore.updateDocument(req.params.id, req.body);
        if (replaced) {
          res.json({ id: req.params.id });
        } else {
          // Do something with the error
          res.status(500).end();
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ code: 'InternalError', message: String(error) });
      }
    }
  );
}
