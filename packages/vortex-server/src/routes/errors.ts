import { Express, NextFunction, Request, Response } from 'express';

// Must go last!
export function addErrorRoutes(app: Express) {
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ code: err.name, message: err.message });
  });
}
