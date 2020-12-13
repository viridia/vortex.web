import AWS from 'aws-sdk';
import cuid from 'cuid';
import express from 'express';
import fs from 'fs';
import { ImageStore } from './ImageStore';

export class ImageStoreS3 implements ImageStore {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3();
  }

  public async putImage(file: Express.Multer.File, res: express.Response): Promise<void> {
    const id = await this.newObjectId(process.env.STORAGE_BUCKET_IMAGES);
    this.s3.upload(
      {
        ACL: 'public-read',
        Bucket: process.env.STORAGE_BUCKET_IMAGES,
        Key: id,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype,
        Metadata: {
          name: file.originalname,
          // Include owner hash
        },
      },
      (err, data) => {
        if (err) {
          console.error(err);
          fs.unlink(file.path, () => {
            res.status(500).json({ error: 'upload-failed' });
          });
        } else {
          fs.unlink(file.path, () => {
            res.json({
              name: file.originalname,
              contentType: file.mimetype,
              url: data.Location,
            });
          });
        }
      }
    );
  }

  // I don't think we need this - we can read the url directly.
  // public getImageUrl(imageId: string, res: express.Response): void {
  //   return this.s3.getSignedUrl(
  //     'getObject',
  //     {
  //       Bucket: process.env.STORAGE_BUCKET_IMAGES,
  //       Key: imageId,
  //     },
  //     (err, data) => {
  //       if (err) {
  //         console.error(err);
  //         if (err.name === 'NoSuchKey') {
  //           res.status(404).json({ code: err.name, message: err.message });
  //         } else if (err.name === 'AccessDenied') {
  //           res.status(403).json({ code: err.name, message: err.message });
  //         } else {
  //           res.status(500).json({ code: err.name, message: err.message });
  //         }
  //       } else {
  //         res.setHeader('content-type', 'text/plain');
  //         res.send(data);
  //       }
  //     }
  //   );
  // }

  private newObjectId(bucket: string): Promise<string> {
    let attempts = 0;
    return new Promise((resolve, reject) => {
      const genId = () => {
        const id = cuid.slug();
        this.s3.headObject(
          {
            Bucket: bucket,
            Key: id,
          },
          (err, data) => {
            if (err) {
              if (err.code === 'NotFound') {
                resolve(id);
              } else {
                reject(err);
              }
            } else {
              // Object exists, try again
              console.debug('object', id, 'exists, retrying...');
              attempts += 1;
              if (attempts > 10) {
                reject(new Error('ID generation failed, too many attempts'));
              } else {
                genId();
              }
            }
          }
        );
      };

      genId();
    });
  }
}
