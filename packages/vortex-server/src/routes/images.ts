import { Express } from 'express';
import { ImageStore } from '../db/ImageStore';
import multer from 'multer';
import path from 'path';

const UPLOADS_TMP_DIR = path.resolve(__dirname, '../..', process.env.UPLOADS_TMP_DIR);

export function addImageRoutes(app: Express, imageStore: ImageStore) {
  if (imageStore.getImage) {
    app.get('/images/:id', async (req, res) => {
      imageStore.getImage(req.params.id, res);
    });
  }

  const upload = multer({ dest: UPLOADS_TMP_DIR });
  app.post('/api/images', upload.single('attachment'), async (req, res) => {
    imageStore.putImage(req.file, res);
  });
}
