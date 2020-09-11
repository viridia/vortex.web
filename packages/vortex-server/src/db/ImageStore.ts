import express, { Express } from 'express';
import 'multer';

export interface ImageStore {
  putImage(file: Express.Multer.File, res: express.Response): void;
  // getImage(imageId: string, res: express.Response): void;
  getImageUrl(imageId: string, res: express.Response): void;
}
