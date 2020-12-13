import cuid from 'cuid';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { ImageStore } from './ImageStore';

const mkdir = promisify(fs.mkdir);
const rename = promisify(fs.rename);
const stat = promisify(fs.stat);
const imagesDir = path.resolve(__dirname, '../../data/images');

export class ImageStoreLocalFile implements ImageStore {
  public async putImage(file: Express.Multer.File, res: express.Response): Promise<void> {
    const id = cuid.slug();
    const ext = path.extname(file.originalname);
    await mkdir(imagesDir, { recursive: true });
    await rename(file.path, path.resolve(imagesDir, `./${id}${ext}`));
    const url = new URL(process.env.SERVER_URL);
    url.pathname = `/images/${id}${ext}`;
    res.json({
      name: file.originalname,
      contentType: file.mimetype,
      url: url.toString(),
    });
  }

  public getImage?(imageId: string, res: express.Response): void {
    const doit = async () => {
      const fpath = path.resolve(imagesDir, `./${imageId}`);
      const fstat = await stat(fpath);

      if (fstat.isFile()) {
        if (imageId.endsWith('.png')) {
          res.setHeader('Content-Type', 'image/png');
        } else if (imageId.endsWith('.jpg') || imageId.endsWith('.jpeg')) {
          res.setHeader('Content-Type', 'image/jpeg');
        }

        res.setHeader('Content-Length', fstat.size);
        var s = fs.createReadStream(fpath);
        s.on('open', function () {
          s.pipe(res);
        });
      } else {
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
      }
    };
    doit();
  }
}
